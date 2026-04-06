'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';

interface AudioPlayerProps {
  src: string;
  label: string;
  color?: string;
}

export const AudioPlayer = ({ src, label, color = '#C8A96A' }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioReady, setAudioReady] = useState(false);

  // Static waveform data decoded once from the audio file
  const waveformDataRef = useRef<Float32Array | null>(null);
  const animationRef = useRef<number | null>(null);

  // Audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setAudioReady(true);
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    // If metadata already loaded (cached)
    if (audio.readyState >= 1) {
      setDuration(audio.duration);
      setAudioReady(true);
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  // Decode the audio file into a waveform for visualization (no createMediaElementAudioSource!)
  useEffect(() => {
    if (!src) return;

    let cancelled = false;

    async function decodeWaveform() {
      try {
        const response = await fetch(src);
        if (!response.ok || cancelled) return;

        const arrayBuffer = await response.arrayBuffer();
        if (cancelled) return;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;

        const offlineCtx = new AudioCtx();
        const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);
        offlineCtx.close();

        if (cancelled) return;

        // Down-sample channel 0 into a manageable number of bars
        const rawData = audioBuffer.getChannelData(0);
        const samples = 120; // number of waveform bars
        const blockSize = Math.floor(rawData.length / samples);
        const downsampled = new Float32Array(samples);

        for (let i = 0; i < samples; i++) {
          let sum = 0;
          const start = i * blockSize;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[start + j]);
          }
          downsampled[i] = sum / blockSize;
        }

        // Normalize to [0, 1]
        const max = Math.max(...downsampled, 0.001);
        for (let i = 0; i < samples; i++) {
          downsampled[i] /= max;
        }

        waveformDataRef.current = downsampled;
      } catch {
        // If decoding fails, visualization simply stays empty — audio still works
      }
    }

    decodeWaveform();
    return () => { cancelled = true; };
  }, [src]);

  // Canvas drawing loop — renders the static waveform with a playhead overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution to match display size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      const waveform = waveformDataRef.current;
      if (!waveform || waveform.length === 0) {
        // No waveform yet — draw a flat line
        ctx.strokeStyle = `${color}33`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const bars = waveform.length;
      const gap = 2;
      const barWidth = Math.max(1, (w - (bars - 1) * gap) / bars);

      // Compute playback progress
      const progress = duration > 0 ? currentTime / duration : 0;
      const progressX = progress * w;

      for (let i = 0; i < bars; i++) {
        const x = i * (barWidth + gap);
        const amplitude = waveform[i];
        const barH = Math.max(2, amplitude * (h - 8));
        const y = (h - barH) / 2;

        // Played portion: bright color; unplayed: dimmed
        if (x + barWidth <= progressX) {
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.9;
        } else if (x <= progressX) {
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.7;
        } else {
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.25;
        }

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, 1);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [color, currentTime, duration]);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      try {
        await audio.play();
      } catch (err) {
        console.warn('Audio play failed:', err);
      }
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="rounded-2xl backdrop-blur-md bg-gradient-to-br from-[#0B0B0B]/60 to-[#0B0B0B]/40 border border-[#C8A96A]/20 p-6 shadow-2xl shadow-[#C8A96A]/10">
        {/* Label */}
        <div className="mb-4">
          <p className="text-[#F5E6D3]/70 text-sm font-medium tracking-wide">{label}</p>
        </div>

        {/* Waveform Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-24 rounded-lg mb-4"
          style={{ background: 'linear-gradient(to bottom, rgba(11, 11, 11, 0.4), rgba(11, 11, 11, 0.2))' }}
        />

        {/* Controls */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlayPause}
              className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#C8A96A]/40 to-[#C8A96A]/20 border border-[#C8A96A]/40 flex items-center justify-center hover:shadow-lg hover:shadow-[#C8A96A]/30 transition-all duration-300 flex-shrink-0"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-[#C8A96A]" fill="#C8A96A" />
              ) : (
                <Play className="w-5 h-5 text-[#C8A96A] ml-0.5" fill="#C8A96A" />
              )}
            </motion.button>

            {/* Progress Bar */}
            <div className="flex-1 flex items-center gap-3">
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.01"
                value={currentTime}
                onChange={handleProgressChange}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: duration
                    ? `linear-gradient(to right, ${color} 0%, ${color} ${
                        (currentTime / duration) * 100
                      }%, rgba(11, 11, 11, 0.3) ${(currentTime / duration) * 100}%, rgba(11, 11, 11, 0.3) 100%)`
                    : 'rgba(11, 11, 11, 0.3)',
                }}
              />
            </div>
          </div>

          {/* Time Display */}
          <div className="flex justify-between items-center">
            <span className="text-[#F5E6D3]/70 text-xs font-mono">
              {formatTime(currentTime)}
            </span>
            <span className="text-[#F5E6D3]/50 text-xs font-mono">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Hidden Audio Element — preload="auto" ensures full download so playback
          doesn't cut off mid-stream due to blocked Range requests */}
      <audio ref={audioRef} src={src} preload="auto" />
    </motion.div>
  );
};
