"""
Audio Processor - Python DSP Engine
Faithful port of the MATLAB-based Speech Processing and Noise Reduction System.

Pipeline:
  1. Preprocess: load, mono, normalize, pre-emphasis (alpha=0.97)
  2. Framing & Windowing: Hamming window, 25ms frames, 10ms hop
  3. STFT: FFT with nfft = next power of 2 (min 512)
  4. Noise Reduction: MMSE-STSA Ephraim-Malah algorithm with Bessel functions
  5. Reconstruction: ISTFT via overlap-add, window normalization, de-emphasis
"""

import numpy as np
import librosa
import soundfile as sf
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend (must be before pyplot import)
import matplotlib.pyplot as plt
import logging
import os
from pathlib import Path
from datetime import datetime
from typing import Tuple, Dict
from scipy.special import i0 as besseli0, i1 as besseli1
from scipy.signal import lfilter
import json

# Configure logging to stderr (not stdout) to avoid corrupting JSON output
import sys as _sys
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=_sys.stderr
)
logger = logging.getLogger(__name__)

# Configure matplotlib for dark theme
matplotlib.rcParams['figure.facecolor'] = '#0B0B0B'
matplotlib.rcParams['axes.facecolor'] = '#0B0B0B'
matplotlib.rcParams['axes.edgecolor'] = '#333333'
matplotlib.rcParams['text.color'] = '#FFFFFF'
matplotlib.rcParams['xtick.color'] = '#FFFFFF'
matplotlib.rcParams['ytick.color'] = '#FFFFFF'
matplotlib.rcParams['grid.color'] = '#333333'


class AudioProcessor:
    """
    Production-level audio processing engine.
    Ports the MATLAB MMSE-STSA Ephraim-Malah noise reduction pipeline.
    """

    def __init__(self, frame_len_ms: float = 25, step_ms: float = 20):
        """
        Args:
            frame_len_ms: Frame length in milliseconds (default 25)
            step_ms: Frame step / hop length in milliseconds (default 20, was 10 - doubled for speed)
        """
        self.frame_len_ms = frame_len_ms
        self.step_ms = step_ms
        self.max_duration = 30  # Cap audio at 30 seconds for free-tier servers
        self.pre_emphasis_alpha = 0.97  # Matches MATLAB exactly

        logger.info(
            f"AudioProcessor initialized: frame={frame_len_ms}ms, step={step_ms}ms, "
            f"pre_emphasis={self.pre_emphasis_alpha}"
        )

    # ──────────────────────────────────────────────────────────────────────
    # Step 1: Preprocess
    # ──────────────────────────────────────────────────────────────────────
    def preprocess_audio(self, input_path: str) -> Tuple[np.ndarray, np.ndarray, int]:
        """
        Load audio, convert to mono, normalize, apply pre-emphasis.
        Matches MATLAB preprocess_audio() exactly.

        Returns:
            (original_signal, pre_emphasized_signal, sample_rate)
        """
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Audio file not found: {input_path}")

        logger.info(f"Loading audio from {input_path}")

        # Load audio at 16kHz to reduce processing time on limited-CPU servers
        # Original sr=None was too slow on Render free tier (44.1kHz = ~3x more work)
        TARGET_SR = 16000
        y, fs = librosa.load(input_path, sr=TARGET_SR, mono=True, duration=self.max_duration)
        logger.info(f"Loaded: {len(y)} samples at {fs} Hz ({len(y)/fs:.2f}s)")

        # Truncate to max_duration seconds if somehow longer
        max_samples = int(self.max_duration * fs)
        if len(y) > max_samples:
            y = y[:max_samples]
            logger.info(f"Truncated to {self.max_duration}s ({max_samples} samples)")

        # Normalize to [-1, 1]
        max_val = np.max(np.abs(y))
        if max_val > 0:
            y = y / max_val

        # Keep original (before pre-emphasis) for visualization
        original_signal = y.copy()

        # Pre-emphasis: y[n] = x[n] - alpha * x[n-1]  (matches MATLAB filter([1, -alpha], 1, y))
        alpha = self.pre_emphasis_alpha
        emphasized = np.zeros_like(y)
        emphasized[0] = y[0]
        emphasized[1:] = y[1:] - alpha * y[:-1]

        logger.info(f"Pre-emphasis applied (alpha={alpha})")
        return original_signal, emphasized, fs

    # ──────────────────────────────────────────────────────────────────────
    # Step 2: Framing & Windowing
    # ──────────────────────────────────────────────────────────────────────
    def framing_windowing(
        self, signal_data: np.ndarray, fs: int
    ) -> Tuple[np.ndarray, int, int]:
        """
        Divide signal into overlapping Hamming-windowed frames.
        Matches MATLAB framing_windowing() exactly.

        Returns:
            (frames [frame_length x num_frames], frame_length, hop_length)
        """
        frame_length = round((self.frame_len_ms / 1000) * fs)
        hop_length = round((self.step_ms / 1000) * fs)
        signal_length = len(signal_data)

        # Number of frames (pad so last frame isn't truncated)
        num_frames = int(np.ceil(max(0, signal_length - frame_length) / hop_length)) + 1
        pad_length = (num_frames - 1) * hop_length + frame_length - signal_length
        if pad_length > 0:
            signal_padded = np.concatenate([signal_data, np.zeros(pad_length)])
        else:
            signal_padded = signal_data.copy()

        # Hamming window (matches MATLAB: 0.54 - 0.46*cos(...))
        n = np.arange(frame_length)
        win = 0.54 - 0.46 * np.cos(2 * np.pi * n / frame_length)

        # Extract and window frames (vectorized with stride_tricks for speed)
        indices = np.arange(frame_length)[:, None] + np.arange(num_frames)[None, :] * hop_length
        frames = signal_padded[indices] * win[:, None]

        logger.info(
            f"Framing: {num_frames} frames, frame_len={frame_length} samples, "
            f"hop={hop_length} samples"
        )
        return frames, frame_length, hop_length

    # ──────────────────────────────────────────────────────────────────────
    # Step 3: STFT
    # ──────────────────────────────────────────────────────────────────────
    def compute_stft(
        self, frames: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray, int]:
        """
        Compute FFT of windowed frames (positive frequencies only).
        Matches MATLAB compute_stft() exactly.

        Returns:
            (mag_spec, phase_spec, nfft)
        """
        frame_length = frames.shape[0]

        # nfft = next power of 2 >= frame_length, minimum 512
        nfft = max(512, int(2 ** np.ceil(np.log2(frame_length))))

        # FFT along columns (axis=0)
        stft_frames = np.fft.fft(frames, n=nfft, axis=0)

        # Keep only positive frequencies
        half_nfft = nfft // 2 + 1
        stft_frames = stft_frames[:half_nfft, :]

        mag_spec = np.abs(stft_frames)
        phase_spec = np.angle(stft_frames)

        logger.info(f"STFT: nfft={nfft}, {mag_spec.shape[0]} freq bins x {mag_spec.shape[1]} frames")
        return mag_spec, phase_spec, nfft

    # ──────────────────────────────────────────────────────────────────────
    # Step 4: MMSE-STSA Ephraim-Malah Noise Reduction
    # ──────────────────────────────────────────────────────────────────────
    def noise_reduction(
        self, mag_spec: np.ndarray, nfft: int, fs: int
    ) -> np.ndarray:
        """
        High-performance MMSE-STSA Ephraim-Malah noise reduction.
        Faithful port of MATLAB noise_reduction() function.

        This is the core algorithm that produces clean speech without
        the "musical noise" artifacts of spectral subtraction.

        Args:
            mag_spec: Magnitude spectrum [num_bins x num_frames]
            nfft: FFT size used
            fs: Sample rate

        Returns:
            clean_mag_spec: Cleaned magnitude spectrum
        """
        num_bins, num_frames = mag_spec.shape
        clean_mag_spec = np.zeros((num_bins, num_frames))

        # ── 1. Initialize noise power from first 5 frames ──
        init_frames = min(5, num_frames)
        noise_pow = np.mean(mag_spec[:, :init_frames] ** 2, axis=1)

        # ── Parameters (matching MATLAB exactly) ──
        alpha_snr = 0.92    # Decision-directed smoothing factor
        alpha_noise = 0.99  # Noise profile smoothing (slow, conservative update)

        prev_clean_sq = mag_spec[:, 0] ** 2
        sqrt_pi_2 = np.sqrt(np.pi) / 2.0

        logger.info(
            f"MMSE-STSA: alpha_snr={alpha_snr}, alpha_noise={alpha_noise}, "
            f"init_noise_frames={init_frames}"
        )

        for i in range(num_frames):
            curr_mag = mag_spec[:, i]
            curr_sq = curr_mag ** 2

            # ── A: A posteriori SNR ──
            post_snr = curr_sq / np.maximum(noise_pow, 1e-12)
            post_snr_mapped = np.maximum(post_snr - 1.0, 0.0)

            # ── B: A priori SNR (Decision-Directed) ──
            if i == 0:
                prior_snr = post_snr_mapped
            else:
                prior_snr = (
                    alpha_snr * (prev_clean_sq / np.maximum(noise_pow, 1e-12))
                    + (1.0 - alpha_snr) * post_snr_mapped
                )
            # Minimum a priori SNR = -15 dB (prevents musical noise)
            prior_snr = np.maximum(prior_snr, 10 ** (-15.0 / 10.0))

            # ── C: Ephraim-Malah MMSE-STSA gain function ──
            vk = (prior_snr * post_snr) / (1.0 + prior_snr)

            # Scaled Bessel functions: besseli(nu, z, 1) = I_nu(z) * exp(-|z|)
            # In Python scipy: we compute I0(vk/2)*exp(-vk/2) and I1(vk/2)*exp(-vk/2)
            vk_half = vk / 2.0
            # Clamp to prevent overflow in Bessel functions
            vk_half_clamped = np.minimum(vk_half, 500.0)

            I0_scaled = besseli0(vk_half_clamped) * np.exp(-vk_half_clamped)
            I1_scaled = besseli1(vk_half_clamped) * np.exp(-vk_half_clamped)

            # MMSE-STSA gain
            gain = (
                sqrt_pi_2
                * np.sqrt(vk / np.maximum(post_snr, 1e-12))
                * ((1.0 + vk) * I0_scaled + vk * I1_scaled)
            )

            # ── D: Apply gain ──
            clean_mag = curr_mag * gain

            # Sub-threshold gating: floor at 5% of noise magnitude
            clean_mag = np.maximum(clean_mag, 0.05 * np.sqrt(noise_pow))

            # ── E: Continuous noise profile update ──
            # Only update bins where prior_snr < 0.05 (very likely noise)
            is_noise = prior_snr < 0.05
            noise_pow[is_noise] = (
                alpha_noise * noise_pow[is_noise]
                + (1.0 - alpha_noise) * curr_sq[is_noise]
            )

            # ── Save state ──
            clean_mag_spec[:, i] = clean_mag
            prev_clean_sq = clean_mag ** 2

        logger.info("MMSE-STSA noise reduction completed")
        return clean_mag_spec

    # ──────────────────────────────────────────────────────────────────────
    # Step 5: Signal Reconstruction (Overlap-Add + De-emphasis)
    # ──────────────────────────────────────────────────────────────────────
    def reconstruct_signal(
        self,
        clean_mag_spec: np.ndarray,
        phase_spec: np.ndarray,
        frame_length: int,
        hop_length: int
    ) -> np.ndarray:
        """
        Reconstruct time-domain signal via ISTFT overlap-add.
        Matches MATLAB reconstruct_signal() exactly, including:
          - Full spectrum reconstruction from positive frequencies
          - IFFT → overlap-add with Hamming window normalization
          - De-emphasis filter to invert pre-emphasis
          - Final amplitude normalization

        Returns:
            Reconstructed clean audio signal
        """
        num_bins, num_frames = clean_mag_spec.shape
        nfft = (num_bins - 1) * 2

        # Recombine magnitude and phase → complex spectrum
        complex_spec = clean_mag_spec * np.exp(1j * phase_spec)

        # Reconstruct full symmetric spectrum (signal is real)
        if nfft % 2 == 0:
            full_spec = np.concatenate([
                complex_spec,
                np.conj(complex_spec[-2:0:-1, :])  # bins end-1 down to 2
            ], axis=0)
        else:
            full_spec = np.concatenate([
                complex_spec,
                np.conj(complex_spec[-1:0:-1, :])
            ], axis=0)

        # IFFT back to time domain
        ifft_frames = np.real(np.fft.ifft(full_spec, n=nfft, axis=0))

        # Keep only the first frame_length samples per frame
        ifft_frames = ifft_frames[:frame_length, :]

        # Overlap-Add (OLA)
        signal_length = (num_frames - 1) * hop_length + frame_length
        reconstructed = np.zeros(signal_length)
        window_sum = np.zeros(signal_length)

        # Same Hamming window used during framing
        n = np.arange(frame_length)
        win = 0.54 - 0.46 * np.cos(2 * np.pi * n / frame_length)

        for i in range(num_frames):
            start = i * hop_length
            reconstructed[start:start + frame_length] += ifft_frames[:, i]
            window_sum[start:start + frame_length] += win

        # Normalize by window sum to remove OLA amplitude modulation
        window_sum[window_sum < 1e-6] = 1.0
        reconstructed /= window_sum

        # De-emphasis filter: y[n] = x[n] + alpha * y[n-1]
        # Inverts the pre-emphasis applied during preprocessing
        # (matches MATLAB: filter(1, [1, -alpha], reconstructed_signal))
        # Using scipy.signal.lfilter for vectorized speed (avoids slow Python loop)
        alpha = self.pre_emphasis_alpha
        reconstructed = lfilter([1], [1, -alpha], reconstructed)

        # Peak-normalize to [-1, 1] (matches MATLAB: / max(abs()))
        max_val = np.max(np.abs(reconstructed))
        if max_val > 0:
            reconstructed = reconstructed / max_val

        # Gentle loudness lift: bring RMS up to a comfortable listening level.
        # The MATLAB version applies tanh(5*x) for playback only — we use a
        # gentler approach so the saved WAV is both loud AND clear.
        rms = np.sqrt(np.mean(reconstructed ** 2))
        target_rms = 0.15  # comfortable loudness for speech
        if rms > 1e-6 and rms < target_rms:
            gain = target_rms / rms
            # Soft-clip with mild tanh to avoid harsh distortion
            reconstructed = np.tanh(gain * reconstructed)
            # Re-normalize peaks
            max_val = np.max(np.abs(reconstructed))
            if max_val > 1e-6:
                reconstructed = reconstructed / max_val

        logger.info(
            f"Signal reconstructed: {len(reconstructed)} samples, "
            f"RMS={np.sqrt(np.mean(reconstructed**2)):.4f}"
        )
        return reconstructed

    # ──────────────────────────────────────────────────────────────────────
    # Visualization
    # ──────────────────────────────────────────────────────────────────────
    def generate_waveform_plot(
        self,
        signal_data: np.ndarray,
        sr: int,
        title: str,
        output_path: str,
        color: str = '#C8A96A'
    ) -> None:
        """Generate waveform visualization PNG with dark theme."""
        try:
            logger.info(f"Generating waveform: {title}")
            plt.figure(figsize=(10, 3), dpi=72)

            time_axis = np.arange(len(signal_data)) / sr
            plt.plot(time_axis, signal_data, color=color, linewidth=0.5, alpha=0.8)

            plt.xlabel('Time (s)', fontsize=10, color='#FFFFFF')
            plt.ylabel('Amplitude', fontsize=10, color='#FFFFFF')
            plt.title(title, fontsize=12, color='#FFFFFF', pad=15)
            plt.grid(True, alpha=0.2, color='#333333')
            plt.tight_layout()

            plt.savefig(output_path, facecolor='#0B0B0B', edgecolor='none', dpi=72)
            plt.close()
            logger.info(f"Waveform saved: {output_path}")

        except Exception as e:
            logger.error(f"Error generating waveform: {e}")
            plt.close('all')
            raise

    def generate_spectrogram_plot(
        self,
        mag_spec: np.ndarray,
        fs: int,
        title: str,
        output_path: str
    ) -> None:
        """
        Generate spectrogram visualization from pre-computed magnitude spectrum.
        Matches MATLAB visualization: imagesc of 20*log10(mag_spec + eps).
        """
        try:
            logger.info(f"Generating spectrogram: {title}")
            plt.figure(figsize=(10, 4), dpi=100)

            num_bins, num_frames = mag_spec.shape
            magnitude_db = 20 * np.log10(mag_spec + 1e-10)

            freq_axis = np.linspace(0, fs / 2, num_bins)
            frame_axis = np.arange(num_frames)

            im = plt.pcolormesh(
                frame_axis, freq_axis, magnitude_db,
                shading='auto',
                cmap='jet'  # Match MATLAB colormap
            )

            plt.ylabel('Frequency (Hz)', fontsize=12, color='#FFFFFF')
            plt.xlabel('Frame Index', fontsize=12, color='#FFFFFF')
            plt.title(title, fontsize=14, color='#FFFFFF', pad=20)

            cbar = plt.colorbar(im, label='Magnitude (dB)')
            cbar.ax.tick_params(colors='#FFFFFF')
            cbar.set_label('Magnitude (dB)', color='#FFFFFF')

            # Limit frequency range to 8 kHz for clarity
            plt.ylim(0, min(8000, fs / 2))
            plt.tight_layout()

            plt.savefig(output_path, facecolor='#0B0B0B', edgecolor='none', dpi=100)
            plt.close()
            logger.info(f"Spectrogram saved: {output_path}")

        except Exception as e:
            logger.error(f"Error generating spectrogram: {e}")
            plt.close('all')
            raise

    def generate_spectrogram_fast(
        self,
        mag_spec: np.ndarray,
        fs: int,
        title: str,
        output_path: str
    ) -> None:
        """Fast spectrogram using imshow instead of slow pcolormesh."""
        try:
            logger.info(f"Generating fast spectrogram: {title}")
            plt.figure(figsize=(10, 3), dpi=72)

            magnitude_db = 20 * np.log10(mag_spec + 1e-10)

            # imshow is MUCH faster than pcolormesh
            plt.imshow(
                magnitude_db,
                aspect='auto',
                origin='lower',
                cmap='jet',
                extent=[0, mag_spec.shape[1], 0, fs / 2]
            )

            plt.ylabel('Frequency (Hz)', fontsize=10, color='#FFFFFF')
            plt.xlabel('Frame', fontsize=10, color='#FFFFFF')
            plt.title(title, fontsize=11, color='#FFFFFF', pad=10)
            plt.ylim(0, min(8000, fs / 2))
            plt.tight_layout()

            plt.savefig(output_path, facecolor='#0B0B0B', edgecolor='none', dpi=72)
            plt.close()
            logger.info(f"Spectrogram saved: {output_path}")
        except Exception as e:
            logger.error(f"Error generating spectrogram: {e}")
            plt.close('all')
            raise

    # ──────────────────────────────────────────────────────────────────────
    # Main entry point
    # ──────────────────────────────────────────────────────────────────────
    def process_file(self, input_path: str, output_dir: str) -> Dict[str, any]:
        """
        Full processing pipeline matching MATLAB main.m:
          1. Preprocess audio
          2. Framing & windowing
          3. Compute STFT
          4. MMSE-STSA noise reduction
          5. Reconstruct signal
          6. Generate visualizations
        """
        try:
            logger.info("=" * 70)
            logger.info(f"STARTING AUDIO PROCESSING: {input_path}")
            logger.info("=" * 70)

            start_time = datetime.now()
            Path(output_dir).mkdir(parents=True, exist_ok=True)

            # ── Step 1: Preprocess ──
            logger.info("Step 1: Preprocessing audio...")
            original_signal, noisy_signal, fs = self.preprocess_audio(input_path)

            # ── Step 2: Framing & Windowing ──
            logger.info("Step 2: Framing and windowing...")
            frames, frame_length, hop_length = self.framing_windowing(noisy_signal, fs)

            # ── Step 3: STFT ──
            logger.info("Step 3: Computing STFT...")
            mag_spec, phase_spec, nfft = self.compute_stft(frames)

            # ── Step 4: MMSE-STSA Noise Reduction ──
            logger.info("Step 4: Applying MMSE-STSA noise reduction...")
            clean_mag_spec = self.noise_reduction(mag_spec, nfft, fs)

            # ── Step 5: Signal Reconstruction ──
            logger.info("Step 5: Reconstructing signal...")
            clean_signal = self.reconstruct_signal(
                clean_mag_spec, phase_spec, frame_length, hop_length
            )

            # Trim to original length (OLA may pad)
            orig_len = len(original_signal)
            if len(clean_signal) > orig_len:
                clean_signal = clean_signal[:orig_len]
            elif len(clean_signal) < orig_len:
                clean_signal = np.concatenate([
                    clean_signal,
                    np.zeros(orig_len - len(clean_signal))
                ])

            # ── Step 6: Output files ──
            base_name = Path(input_path).stem
            waveform_orig_path = os.path.join(output_dir, f"{base_name}_waveform_original.png")
            waveform_clean_path = os.path.join(output_dir, f"{base_name}_waveform_cleaned.png")
            spec_orig_path = os.path.join(output_dir, f"{base_name}_spectrogram_original.png")
            spec_clean_path = os.path.join(output_dir, f"{base_name}_spectrogram_cleaned.png")
            audio_output_path = os.path.join(output_dir, f"{base_name}_cleaned.wav")

            # Save cleaned audio
            sf.write(audio_output_path, clean_signal, fs)
            logger.info(f"Cleaned audio saved: {audio_output_path}")

            # Generate visualizations (only waveforms — spectrograms are too slow for free tier)
            logger.info("Step 6: Generating visualizations...")

            # Waveform plots (use original signal, not pre-emphasized)
            self.generate_waveform_plot(
                original_signal, fs,
                f"Original Waveform - {base_name}",
                waveform_orig_path,
                color='#C8A96A'
            )
            self.generate_waveform_plot(
                clean_signal, fs,
                f"Cleaned Waveform - {base_name}",
                waveform_clean_path,
                color='#4CCD89'
            )

            # Generate simple spectrograms using fast imshow instead of pcolormesh
            self.generate_spectrogram_fast(
                mag_spec, fs,
                f"Original Noisy Spectrogram - {base_name}",
                spec_orig_path
            )
            self.generate_spectrogram_fast(
                clean_mag_spec, fs,
                f"Processed Clean Spectrogram - {base_name}",
                spec_clean_path
            )

            # ── Results ──
            processing_time = (datetime.now() - start_time).total_seconds()

            results = {
                'status': 'success',
                'input_file': input_path,
                'output_dir': output_dir,
                'processing_time_seconds': processing_time,
                'timestamp': start_time.isoformat(),
                'audio_duration_seconds': len(original_signal) / fs,
                'sample_rate': fs,
                'nfft': nfft,
                'frame_len_ms': self.frame_len_ms,
                'step_ms': self.step_ms,
                'output_files': {
                    'cleaned_audio': audio_output_path,
                    'waveform_original': waveform_orig_path,
                    'waveform_cleaned': waveform_clean_path,
                    'spectrogram_original': spec_orig_path,
                    'spectrogram_cleaned': spec_clean_path
                }
            }

            logger.info("=" * 70)
            logger.info(f"PROCESSING COMPLETED in {processing_time:.2f}s")
            logger.info("=" * 70)

            return results

        except Exception as e:
            logger.error(f"Error in process_file: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }


if __name__ == '__main__':
    processor = AudioProcessor(frame_len_ms=25, step_ms=20)
    test_input = "/path/to/audio/file.wav"
    test_output_dir = "/path/to/output"
    if os.path.exists(test_input):
        results = processor.process_file(test_input, test_output_dir)
        print(json.dumps(results, indent=2))
    else:
        print("Please provide a valid audio file path")
