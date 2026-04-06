#!/usr/bin/env python3
"""
CLI wrapper for speech emotion detection using librosa audio features.

Uses a comprehensive feature-based approach with:
  - 45+ acoustic features (pitch, energy, spectral, voice quality, rhythm)
  - Dedicated scream/terror detector using high-frequency energy & spectral contrast
  - Harmonicity-driven fear/happy separation
  - Crying detection via rhythmic energy-burst analysis
  - Softmax probability calibration

Fast (~2-5 seconds) with no heavy ML dependencies (no torch/transformers).

Usage: python emotion_detection_cli.py <audio_path>
"""

import sys
import json
import os
import warnings
import logging

# Suppress all warnings/logs so only JSON goes to stdout
warnings.filterwarnings('ignore')
logging.disable(logging.CRITICAL)

import numpy as np


def _compute_scream_score(y, sr):
    """
    Dedicated scream/terror detector.

    Screams are acoustically distinct from all other vocalizations:
      - Extremely high energy concentrated in upper frequencies (>3kHz)
      - Broadband noise-like spectrum (high flatness, low contrast)
      - Very high spectral centroid (often >3000Hz)
      - High zero-crossing rate (noise-like waveform)
      - Low harmonic-to-noise ratio (voice breaks into noise)
      - High pitch with extreme instability / jitter
      - Sudden onset (abrupt energy increase)

    Returns a scream probability 0.0 - 1.0
    """
    import librosa

    # --- High-frequency energy ratio ---
    # Screams concentrate energy above 3kHz; speech does not
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=512))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
    hf_mask = freqs >= 3000  # above 3kHz
    lf_mask = freqs < 3000   # below 3kHz

    hf_energy = float(np.mean(S[hf_mask, :] ** 2)) if np.any(hf_mask) else 0.0
    lf_energy = float(np.mean(S[lf_mask, :] ** 2)) if np.any(lf_mask) else 1e-10
    total_energy = hf_energy + lf_energy + 1e-10
    hf_ratio = hf_energy / total_energy  # screams: >0.3; speech: <0.15

    # --- Spectral contrast ---
    # Screams have LOW contrast (uniform energy across bands)
    # Speech has HIGH contrast (clear formant peaks vs valleys)
    contrast = librosa.feature.spectral_contrast(y=y, sr=sr, n_bands=6)
    mean_contrast = float(np.mean(contrast))  # screams: low; speech: high

    # --- Spectral flatness (Wiener entropy) ---
    flatness = float(np.mean(librosa.feature.spectral_flatness(y=y)))
    # screams: >0.1; speech: <0.05

    # --- Spectral centroid ---
    centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
    # screams: often >3000Hz; speech: typically 1000-2500Hz

    # --- Zero-crossing rate ---
    zcr = float(np.mean(librosa.feature.zero_crossing_rate(y)))
    # screams: high (>0.1); speech: lower

    # --- Harmonicity ---
    harmonic, percussive = librosa.effects.hpss(y)
    h_energy = float(np.mean(np.abs(harmonic)))
    p_energy = float(np.mean(np.abs(percussive)))
    harmonic_ratio = h_energy / (h_energy + p_energy + 1e-10)
    # screams: low (<0.5); speech: high (>0.6)

    # --- RMS energy (screams are LOUD) ---
    rms = float(np.mean(librosa.feature.rms(y=y)))

    # --- Onset strength (abrupt attack) ---
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    max_onset = float(np.max(onset_env)) if len(onset_env) > 0 else 0
    mean_onset = float(np.mean(onset_env)) if len(onset_env) > 0 else 0
    onset_ratio = max_onset / (mean_onset + 1e-10)  # sudden attack

    # --- Compute scream score ---
    def s_norm(val, lo, hi):
        return max(0.0, min(1.0, (val - lo) / (hi - lo + 1e-10)))

    indicators = []

    # High-frequency dominance (strongest indicator)
    indicators.append(3.0 * s_norm(hf_ratio, 0.10, 0.50))

    # Low spectral contrast (screams are broadband)
    indicators.append(2.0 * s_norm(1.0 - mean_contrast / 30.0, 0.0, 1.0))

    # High spectral flatness
    indicators.append(2.0 * s_norm(flatness, 0.02, 0.3))

    # Very high centroid
    indicators.append(1.5 * s_norm(centroid, 2000, 5000))

    # High ZCR
    indicators.append(1.0 * s_norm(zcr, 0.05, 0.20))

    # Low harmonicity (screams break voice)
    indicators.append(2.5 * s_norm(1.0 - harmonic_ratio, 0.3, 0.7))

    # High energy (screams are loud)
    indicators.append(1.0 * s_norm(rms, 0.05, 0.3))

    # Sudden onset
    indicators.append(0.5 * s_norm(onset_ratio, 2.0, 8.0))

    total_weight = 3.0 + 2.0 + 2.0 + 1.5 + 1.0 + 2.5 + 1.0 + 0.5  # = 13.5
    scream_score = sum(indicators) / total_weight

    return min(1.0, max(0.0, scream_score))


def detect_emotion(audio_path: str) -> dict:
    """
    Detect emotion from an audio file using acoustic feature analysis.
    Returns dict with emotion, confidence (0-100), and all_emotions percentages.
    """
    import librosa

    y, sr = librosa.load(audio_path, sr=22050, mono=True)

    if len(y) == 0 or np.max(np.abs(y)) < 1e-6:
        return {
            'emotion': 'neutral', 'confidence': 50.0,
            'all_emotions': {
                'happy': 8.0, 'sad': 8.0, 'angry': 8.0,
                'fear': 8.0, 'neutral': 60.0, 'crying': 8.0
            }
        }

    y = y / (np.max(np.abs(y)) + 1e-10)

    # ─── SCREAM DETECTOR (run first) ─────────────────────────────────────
    scream_prob = _compute_scream_score(y, sr)

    # ─── Feature extraction ───────────────────────────────────────────────

    # Pitch (fundamental frequency)
    f0, voiced_flag, _ = librosa.pyin(
        y, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'), sr=sr
    )
    f0_clean = f0[~np.isnan(f0)] if f0 is not None else np.array([0.0])
    if len(f0_clean) == 0:
        f0_clean = np.array([0.0])

    pitch_mean = float(np.mean(f0_clean))
    pitch_std = float(np.std(f0_clean))
    pitch_range = float(np.ptp(f0_clean))
    pitch_jitter = float(
        np.mean(np.abs(np.diff(f0_clean))) / (pitch_mean + 1e-10)
    ) if len(f0_clean) > 1 else 0.0

    # Energy (RMS)
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
    energy_mean = float(np.mean(rms))
    energy_std = float(np.std(rms))
    energy_max = float(np.max(rms))
    energy_cv = energy_std / (energy_mean + 1e-10)

    # Energy bursts (for crying / sobbing detection)
    threshold = energy_mean * 1.5
    above = rms > threshold
    burst_count = int(np.sum(np.diff(above.astype(int)) == 1))
    burst_rate = burst_count / (len(y) / sr)

    # Tempo
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    tempo = float(librosa.feature.tempo(onset_envelope=onset_env, sr=sr)[0])

    # Spectral features
    centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)[0]))
    zcr = float(np.mean(librosa.feature.zero_crossing_rate(y)[0]))
    bandwidth = float(np.mean(librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]))
    flatness = float(np.mean(librosa.feature.spectral_flatness(y=y)[0]))
    rolloff = float(np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr)[0]))

    # Voice quality — harmonic vs percussive energy
    harmonic, percussive = librosa.effects.hpss(y)
    h_energy = float(np.mean(np.abs(harmonic)))
    p_energy = float(np.mean(np.abs(percussive)))
    hnr = h_energy / (p_energy + 1e-10)
    harmonic_ratio = h_energy / (h_energy + p_energy + 1e-10)

    # MFCC dynamics
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc_delta = librosa.feature.delta(mfcc)
    mfcc_delta_mean = float(np.mean(np.abs(mfcc_delta)))

    # Voiced ratio
    voiced_ratio = float(
        np.sum(voiced_flag) / (len(voiced_flag) + 1e-10)
    ) if voiced_flag is not None else 0.0

    # Onset regularity (rhythmic = crying)
    onsets = librosa.onset.onset_detect(y=y, sr=sr, onset_envelope=onset_env)
    if len(onsets) > 2:
        onset_times = librosa.frames_to_time(onsets, sr=sr)
        intervals = np.diff(onset_times)
        onset_reg = float(max(0, 1.0 - np.std(intervals) / (np.mean(intervals) + 1e-10)))
    else:
        onset_reg = 0.0

    # ─── Normalize features to [0, 1] ────────────────────────────────────

    def norm(val, lo, hi):
        return max(0.0, min(1.0, (val - lo) / (hi - lo + 1e-10)))

    n_pitch       = norm(pitch_mean, 80, 400)
    n_pitch_var   = norm(pitch_std, 5, 100)
    n_pitch_range = norm(pitch_range, 10, 300)
    n_pitch_jit   = norm(pitch_jitter, 0, 0.2)
    n_energy      = norm(energy_mean, 0.01, 0.3)
    n_energy_var  = norm(energy_std, 0.005, 0.15)
    n_energy_max  = norm(energy_max, 0.05, 0.7)
    n_energy_cv   = norm(energy_cv, 0.1, 1.5)
    n_burst       = norm(burst_rate, 0, 5)
    n_tempo       = norm(tempo, 50, 200)
    n_centroid    = norm(centroid, 500, 5000)
    n_zcr         = norm(zcr, 0.02, 0.25)
    n_bandwidth   = norm(bandwidth, 500, 4000)
    n_flatness    = norm(flatness, 0.001, 0.4)
    n_rolloff     = norm(rolloff, 1000, 8000)
    n_hnr         = norm(hnr, 0.5, 8.0)
    n_harmonic    = norm(harmonic_ratio, 0.3, 0.9)
    n_mfcc_d      = norm(mfcc_delta_mean, 0, 5)
    n_voiced      = norm(voiced_ratio, 0.1, 0.9)
    n_onset_reg   = norm(onset_reg, 0, 1)

    # ─── Base emotion scores (weighted feature sums) ─────────────────────

    scores = {}

    # HAPPY: high pitch, energy, harmonicity; bright, melodic, voiced
    scores['happy'] = (
        0.12 * n_pitch +
        0.10 * n_energy +
        0.08 * n_tempo +
        0.08 * n_centroid +
        0.06 * n_pitch_var +
        0.22 * n_harmonic +          # HEAVILY weight harmonicity for happy
        0.06 * n_mfcc_d +
        0.05 * n_pitch_range +
        0.08 * n_voiced +            # happy speech is voiced
        0.08 * (1.0 - n_flatness) +  # NOT noisy
        0.07 * (1.0 - n_zcr)         # NOT harsh
    )

    # SAD: low pitch, low energy, slow, dark, monotone
    scores['sad'] = (
        0.18 * (1.0 - n_pitch) +
        0.16 * (1.0 - n_energy) +
        0.12 * (1.0 - n_tempo) +
        0.12 * (1.0 - n_centroid) +
        0.10 * (1.0 - n_pitch_var) +
        0.08 * (1.0 - n_energy_var) +
        0.06 * n_harmonic +
        0.06 * (1.0 - n_mfcc_d) +
        0.06 * n_voiced +
        0.06 * (1.0 - n_zcr)
    )

    # ANGRY: high energy, harsh (high ZCR, flatness), mid-low pitch
    scores['angry'] = (
        0.06 * (1.0 - n_pitch) +
        0.18 * n_energy +
        0.10 * n_tempo +
        0.14 * n_zcr +
        0.10 * n_bandwidth +
        0.08 * n_energy_var +
        0.08 * n_energy_max +
        0.08 * n_flatness +
        0.06 * (1.0 - n_harmonic) +
        0.06 * n_centroid +
        0.06 * n_mfcc_d
    )

    # FEAR/TERROR: very high pitch + energy, pitch instability, noisy/breathy
    scores['fear'] = (
        0.12 * n_pitch +
        0.10 * n_energy +
        0.10 * n_pitch_var +
        0.10 * n_pitch_jit +
        0.08 * n_pitch_range +
        0.10 * n_zcr +
        0.12 * (1.0 - n_harmonic) +  # KEY: fear is NOT harmonic
        0.10 * n_flatness +           # KEY: fear is noisy/broadband
        0.06 * n_energy_max +
        0.06 * n_bandwidth +
        0.06 * n_mfcc_d
    )

    # NEUTRAL: moderate everything
    def center(val, c=0.4, w=0.35):
        return max(0.0, 1.0 - ((val - c) / w) ** 2)

    scores['neutral'] = (
        0.14 * center(n_pitch, 0.4) +
        0.14 * center(n_energy, 0.35) +
        0.12 * center(n_tempo, 0.4) +
        0.12 * (1.0 - n_pitch_var) +
        0.10 * (1.0 - n_energy_var) +
        0.08 * center(n_centroid, 0.4) +
        0.08 * (1.0 - n_mfcc_d) +
        0.06 * n_harmonic +
        0.06 * (1.0 - n_pitch_jit) +
        0.05 * (1.0 - n_flatness) +
        0.05 * center(n_tempo, 0.3)
    )

    # CRYING: rhythmic energy bursts, pitch variability, periodic sobs
    scores['crying'] = (
        0.12 * n_pitch +
        0.14 * n_energy_cv +
        0.14 * n_pitch_var +
        0.12 * n_burst +
        0.10 * n_pitch_range +
        0.08 * n_onset_reg +
        0.08 * (1.0 - n_hnr) +
        0.06 * n_pitch_jit +
        0.06 * n_energy_var +
        0.06 * n_mfcc_d +
        0.04 * n_energy
    )

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # SCREAM OVERRIDE — if the dedicated scream detector fires strongly,
    # directly inject fear and crush happy BEFORE any other rule-based logic
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if scream_prob > 0.55:
        # Very likely a scream — hard override
        scores['fear'] *= (1.0 + scream_prob * 4.0)   # up to 5x boost
        scores['happy'] *= max(0.05, 1.0 - scream_prob * 1.5)  # crush to near-zero
        scores['neutral'] *= max(0.1, 1.0 - scream_prob)
        scores['sad'] *= max(0.1, 1.0 - scream_prob * 0.8)
    elif scream_prob > 0.35:
        # Moderate scream indicators
        scores['fear'] *= (1.0 + scream_prob * 2.5)   # up to ~1.9x boost
        scores['happy'] *= max(0.15, 1.0 - scream_prob * 1.2)
        scores['neutral'] *= max(0.3, 1.0 - scream_prob * 0.5)

    # ─── Rule-based boosting ─────────────────────────────────────────────

    # FEAR / SCREAMING — additional harmonicity-based rules
    if n_energy > 0.5 and n_pitch > 0.5 and n_harmonic < 0.55:
        scores['fear'] *= 1.8
        scores['happy'] *= 0.4
    if n_pitch > 0.6 and n_pitch_jit > 0.3 and n_flatness > 0.2:
        scores['fear'] *= 1.6
        scores['happy'] *= 0.5
    if n_pitch_var > 0.5 and n_energy > 0.4 and n_zcr > 0.4:
        scores['fear'] *= 1.5
    if n_energy_max > 0.6 and n_pitch > 0.4 and n_harmonic < 0.50:
        scores['fear'] *= 1.4
        scores['happy'] *= 0.5

    # High energy + high pitch + low voiced ratio = likely scream
    if n_energy > 0.4 and n_pitch > 0.4 and n_voiced < 0.4:
        scores['fear'] *= 1.5
        scores['happy'] *= 0.4

    # High centroid (>3kHz range) + high energy = scream-like
    if n_centroid > 0.6 and n_energy > 0.4 and n_harmonic < 0.5:
        scores['fear'] *= 1.4
        scores['happy'] *= 0.5

    # HAPPY — must be harmonic, melodic, voiced. Very strict gates.
    if n_harmonic > 0.6 and n_pitch > 0.5 and n_energy > 0.3 and n_voiced > 0.5:
        scores['happy'] *= 1.5
    if n_harmonic > 0.65 and n_centroid > 0.3 and n_pitch_var > 0.15:
        scores['happy'] *= 1.3

    # STRICT happy penalties — if ANY scream-like feature, punish happy
    if n_flatness > 0.25 or n_harmonic < 0.45:
        scores['happy'] *= 0.4
    if n_zcr > 0.5 and n_harmonic < 0.55:
        scores['happy'] *= 0.5
    if n_voiced < 0.35:
        scores['happy'] *= 0.4  # happy speech is always highly voiced
    if n_centroid > 0.65 and n_flatness > 0.15:
        scores['happy'] *= 0.4  # bright + noisy = NOT happy

    # SAD
    if n_pitch < 0.35 and n_energy < 0.35 and n_tempo < 0.4:
        scores['sad'] *= 1.5
    if n_pitch_var < 0.2 and n_energy < 0.4:
        scores['sad'] *= 1.3

    # ANGRY — lower pitch than fear, still loud and harsh
    if n_energy > 0.6 and n_zcr > 0.5 and n_pitch < 0.5:
        scores['angry'] *= 1.5
    if n_energy > 0.5 and n_pitch < 0.45 and n_harmonic < 0.5:
        scores['angry'] *= 1.3
        scores['happy'] *= 0.6
    if n_energy > 0.5 and n_pitch < 0.4:
        scores['angry'] *= 1.2
        scores['fear'] *= 0.8

    # NEUTRAL
    if (n_pitch_var < 0.2 and n_energy_var < 0.2 and
            0.2 < n_pitch < 0.6 and 0.15 < n_energy < 0.55):
        scores['neutral'] *= 1.5

    # CRYING
    if n_burst > 0.4 and n_pitch_var > 0.5 and n_onset_reg > 0.3:
        scores['crying'] *= 1.6
    if n_energy_cv > 0.5 and n_hnr < 0.4:
        scores['crying'] *= 1.3
        scores['happy'] *= 0.8

    # ─── Cross-penalties ─────────────────────────────────────────────────

    if n_energy < 0.15:
        scores['angry'] *= 0.4
        scores['happy'] *= 0.6
        scores['fear'] *= 0.6
    if n_pitch_var < 0.1:
        scores['happy'] *= 0.6
        scores['fear'] *= 0.5
        scores['crying'] *= 0.5
    if n_harmonic > 0.7:
        scores['angry'] *= 0.6

    # ─── Softmax calibration ─────────────────────────────────────────────

    for k in scores:
        scores[k] = max(scores[k], 0.01)

    temperature = 0.45  # slightly sharper than 0.5 for more decisive results
    max_s = max(scores.values())
    exp_s = {k: np.exp((v - max_s) / temperature) for k, v in scores.items()}
    total = sum(exp_s.values())
    probs = {k: v / total for k, v in exp_s.items()}

    predicted = max(probs, key=probs.get)
    confidence_pct = round(probs[predicted] * 100, 1)
    all_pct = {k: round(v * 100, 1) for k, v in probs.items()}

    return {
        'emotion': predicted,
        'confidence': confidence_pct,
        'all_emotions': all_pct
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Main
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: emotion_detection_cli.py <audio_path>"
        }))
        sys.exit(0)

    audio_path = sys.argv[1]

    if not os.path.exists(audio_path):
        alt_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', audio_path)
        if os.path.exists(alt_path):
            audio_path = alt_path
        else:
            print(json.dumps({
                "success": False,
                "error": f"Audio file not found: {audio_path} (cwd={os.getcwd()})"
            }))
            sys.exit(0)

    try:
        result = detect_emotion(audio_path)

        print(json.dumps({
            "success": True,
            "emotion": result['emotion'],
            "confidence": result['confidence'],
            "all_emotions": result['all_emotions']
        }))
        sys.exit(0)

    except Exception as e:
        import traceback
        print(json.dumps({
            "success": False,
            "error": f"{str(e)} | {traceback.format_exc()}"
        }))
        sys.exit(0)


if __name__ == '__main__':
    main()
