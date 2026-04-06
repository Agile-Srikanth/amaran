'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getEmotionEmoji, getEmotionColor } from '@/lib/api';

interface EmotionDisplayProps {
  emotion: string;
  confidence: number;
  allEmotions: Record<string, number>;
}

export const EmotionDisplay = ({
  emotion,
  confidence,
  allEmotions,
}: EmotionDisplayProps) => {
  const emoji = getEmotionEmoji(emotion);
  const color = getEmotionColor(emotion);

  // Backend sends values as percentages (0-100).
  // Normalize: if the top value is <= 1 it was sent as a decimal — scale up.
  const rawMax = Math.max(...Object.values(allEmotions), 0);
  const scale = rawMax > 0 && rawMax <= 1 ? 100 : 1;

  const emotionsPct: Record<string, number> = Object.fromEntries(
    Object.entries(allEmotions).map(([k, v]) => [k, v * scale])
  );
  const confidencePct = (confidence > 0 && confidence <= 1) ? confidence * 100 : confidence;

  const sortedEmotions = useMemo(() => {
    return Object.entries(emotionsPct)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);
  }, [emotionsPct]);

  const maxConfidence = Math.max(...Object.values(emotionsPct), 1);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="rounded-2xl backdrop-blur-md bg-gradient-to-br from-[#0B0B0B]/60 to-[#0B0B0B]/40 border border-[#C8A96A]/20 p-8 shadow-2xl shadow-[#C8A96A]/10">
        {/* Emoji */}
        <div className="flex justify-center mb-6">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="text-7xl"
          >
            {emoji}
          </motion.div>
        </div>

        {/* Emotion Label */}
        <div className="text-center mb-8">
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-bold mb-2"
            style={{
              background: `linear-gradient(135deg, ${color}, #C8A96A)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
          </motion.h2>
        </div>

        {/* Confidence Circular Progress */}
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="rgba(245, 230, 211, 0.1)"
                strokeWidth="8"
              />

              {/* Progress circle */}
              <motion.circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={color}
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 50}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - confidencePct / 100) }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-center"
              >
                <p className="text-3xl font-bold text-[#C8A96A]">
                  {Math.round(confidencePct)}%
                </p>
                <p className="text-xs text-[#F5E6D3]/50">Confidence</p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="space-y-3">
          <p className="text-[#F5E6D3]/70 text-sm font-medium mb-4">Emotion Breakdown</p>

          {sortedEmotions.map(([emotionName, value], index) => {
            const emotionColor = getEmotionColor(emotionName);
            const barWidth = (value / maxConfidence) * 100;

            return (
              <motion.div
                key={emotionName}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                className="space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[#F5E6D3]/70 text-sm capitalize">
                    {emotionName}
                  </span>
                  <span className="text-[#F5E6D3]/50 text-xs font-mono">
                    {value.toFixed(1)}%
                  </span>
                </div>

                <div className="h-2 rounded-full bg-[#0B0B0B]/50 overflow-hidden border border-[#C8A96A]/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 * index }}
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${emotionColor}, #C8A96A)`,
                      boxShadow: `0 0 10px ${emotionColor}40`,
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
