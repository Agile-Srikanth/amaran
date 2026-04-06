'use client';

import { useEffect, useRef } from 'react';

interface AnimatedWaveformProps {
  opacity?: number;
  speed?: number;
}

export const AnimatedWaveform = ({
  opacity = 0.3,
  speed = 1,
}: AnimatedWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number>();
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const centerY = height / 2;

      // Clear canvas with subtle trail
      ctx.fillStyle = 'rgba(11, 11, 11, 0.12)';
      ctx.fillRect(0, 0, width, height);

      // Gold and silver waves
      const waves = [
        { amplitude: 35, frequency: 0.006, phase: 0, color: `rgba(200, 169, 106, ${opacity})`, width: 2.5 },
        { amplitude: 25, frequency: 0.010, phase: Math.PI / 3, color: `rgba(192, 192, 192, ${opacity * 0.5})`, width: 1.5 },
        { amplitude: 20, frequency: 0.014, phase: Math.PI / 2, color: `rgba(200, 169, 106, ${opacity * 0.6})`, width: 2 },
        { amplitude: 15, frequency: 0.018, phase: Math.PI, color: `rgba(192, 192, 192, ${opacity * 0.3})`, width: 1 },
        { amplitude: 10, frequency: 0.022, phase: Math.PI * 1.5, color: `rgba(200, 169, 106, ${opacity * 0.35})`, width: 1.5 },
      ];

      waves.forEach((wave) => {
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = wave.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();

        for (let x = 0; x < width; x += 2) {
          const y =
            centerY +
            Math.sin(x * wave.frequency + timeRef.current * speed * 0.04 + wave.phase) *
              wave.amplitude *
              (0.7 + 0.3 * Math.sin(x * 0.002 + timeRef.current * 0.01));
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      });

      // Dual glow effect — gold center, silver edges
      const gradient = ctx.createLinearGradient(0, centerY - 60, 0, centerY + 60);
      gradient.addColorStop(0, 'rgba(192, 192, 192, 0)');
      gradient.addColorStop(0.3, `rgba(192, 192, 192, ${opacity * 0.1})`);
      gradient.addColorStop(0.5, `rgba(200, 169, 106, ${opacity * 0.25})`);
      gradient.addColorStop(0.7, `rgba(192, 192, 192, ${opacity * 0.1})`);
      gradient.addColorStop(1, 'rgba(192, 192, 192, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, centerY - 60, width, 120);

      timeRef.current++;
      animationIdRef.current = requestAnimationFrame(animate);
    };

    animationIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [opacity, speed]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: 'transparent' }}
    />
  );
};
