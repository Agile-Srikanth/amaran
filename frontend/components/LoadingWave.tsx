'use client';

import { motion } from 'framer-motion';

interface LoadingWaveProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingWave = ({ label, size = 'md' }: LoadingWaveProps) => {
  const sizeConfig = {
    sm: { barCount: 5, barHeight: 16, gap: 3 },
    md: { barCount: 8, barHeight: 24, gap: 4 },
    lg: { barCount: 12, barHeight: 32, gap: 5 },
  };

  const config = sizeConfig[size];

  const barVariants = {
    animate: (i: number) => ({
      scaleY: [1, 1.5, 0.8, 1.2, 1],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        delay: i * 0.1,
        ease: 'easeInOut',
      },
    }),
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Bars */}
      <div className="flex items-end justify-center gap-1" style={{ gap: `${config.gap}px` }}>
        {Array.from({ length: config.barCount }).map((_, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={barVariants}
            animate="animate"
            style={{
              width: 4,
              height: config.barHeight,
              borderRadius: 2,
              background: 'linear-gradient(180deg, #C8A96A, #C8A96A)',
              boxShadow: '0 0 10px rgba(200, 169, 106, 0.6)',
            }}
          />
        ))}
      </div>

      {/* Label */}
      {label && (
        <motion.p
          initial={{ opacity: 0.6 }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-[#F5E6D3]/70 text-sm font-medium tracking-wide"
        >
          {label}
        </motion.p>
      )}
    </div>
  );
};
