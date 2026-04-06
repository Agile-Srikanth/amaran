'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LoadingWave } from '@/components/LoadingWave';
import { Navbar } from '@/components/Navbar';
import { useAudio } from '@/lib/AudioContext';

interface ProcessingStage {
  id: number;
  label: string;
  duration: number;
  completed: boolean;
}

export default function ProcessingPage() {
  const router = useRouter();
  const { processingResult, isProcessing, selectedFile, error, resetState } = useAudio();
  const [stages, setStages] = useState<ProcessingStage[]>([
    { id: 1, label: 'Loading audio file...', duration: 2000, completed: false },
    { id: 2, label: 'Applying noise reduction...', duration: 3000, completed: false },
    { id: 3, label: 'Computing STFT analysis...', duration: 3500, completed: false },
    { id: 4, label: 'Generating spectrograms...', duration: 2500, completed: false },
    { id: 5, label: 'Detecting emotions...', duration: 2000, completed: false },
  ]);

  useEffect(() => {
    if (!selectedFile && !processingResult) {
      router.push('/');
      return;
    }
  }, [selectedFile, processingResult, router]);

  useEffect(() => {
    let timeoutIds: NodeJS.Timeout[] = [];
    let currentDelay = 0;

    stages.forEach((stage, index) => {
      currentDelay += stage.duration;

      const timeoutId = setTimeout(() => {
        setStages((prevStages) =>
          prevStages.map((s, i) => (i === index ? { ...s, completed: true } : s))
        );
      }, currentDelay - stage.duration);

      timeoutIds.push(timeoutId);
    });

    return () => {
      timeoutIds.forEach((id) => clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    if (processingResult && !isProcessing) {
      const timer = setTimeout(() => {
        router.push('/results');
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [processingResult, isProcessing, router]);

  return (
    <>
      <Navbar />

      {/* Processing Container */}
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 px-6">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B0B0B] via-transparent to-[#0B0B0B] pointer-events-none" />
        <div className="absolute -top-1/2 -right-1/4 w-1/2 h-full bg-gradient-radial from-[#C8A96A]/5 to-transparent blur-3xl opacity-30 pointer-events-none" />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex flex-col items-center justify-center gap-12"
        >
          {/* Loading Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <LoadingWave size="lg" label="Processing your audio..." />
          </motion.div>

          {/* Processing Stages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="w-full max-w-2xl space-y-3"
          >
            {stages.map((stage, index) => (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.15 }}
                className="flex items-center gap-4 p-4 rounded-xl backdrop-blur-md bg-gradient-to-r from-[#0B0B0B]/60 to-[#0B0B0B]/40 border border-[#C8A96A]/20 hover:border-[#C8A96A]/40 transition-all duration-300"
              >
                {/* Status Indicator */}
                <div className="flex-shrink-0">
                  {stage.completed ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
                      className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4CCD89] to-[#27AE60] flex items-center justify-center"
                    >
                      <span className="text-[#0B0B0B] font-bold text-sm">✓</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-6 h-6 rounded-full bg-gradient-to-br from-[#C8A96A] to-[#F5E6D3] flex items-center justify-center"
                    >
                      <div className="w-2 h-2 rounded-full bg-[#0B0B0B]" />
                    </motion.div>
                  )}
                </div>

                {/* Stage Label */}
                <motion.span
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: stage.completed ? 0.7 : 1 }}
                  className={`flex-1 text-sm font-medium transition-colors duration-300 ${
                    stage.completed ? 'text-[#F5E6D3]/60' : 'text-[#F5E6D3]'
                  }`}
                >
                  {stage.label}
                </motion.span>

                {/* Progress Bar */}
                <div className="flex-shrink-0 h-1 w-24 rounded-full bg-[#0B0B0B]/50 overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{
                      scaleX: stage.completed ? 1 : 0,
                    }}
                    transition={{ duration: stage.duration / 1000, ease: 'easeOut' }}
                    className="h-full w-full origin-left rounded-full bg-gradient-to-r from-[#C8A96A] to-[#F5E6D3]"
                    style={{
                      boxShadow: stage.completed ? '0 0 10px rgba(200, 169, 106, 0.6)' : 'none',
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Processing Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center max-w-md space-y-2"
          >
            <p className="text-[#F5E6D3]/70 text-sm">
              {selectedFile && (
                <>
                  Processing: <span className="font-semibold text-[#C8A96A]">{selectedFile.name}</span>
                </>
              )}
            </p>
            <p className="text-[#F5E6D3]/50 text-xs">
              This may take a few moments. Please do not close this window.
            </p>
          </motion.div>

          {/* Success Message (when complete) */}
          {processingResult && !isProcessing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center space-y-2"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#4CCD89] to-[#27AE60] shadow-lg shadow-[#4CCD89]/50"
              >
                <span className="text-2xl">✓</span>
              </motion.div>
              <p className="text-[#4CCD89] font-semibold">Processing Complete!</p>
              <p className="text-[#F5E6D3]/50 text-sm">Redirecting to results...</p>
            </motion.div>
          )}

          {/* Error Message */}
          {error && !isProcessing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center space-y-4 max-w-lg"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#E74C5E] to-[#C0392B] shadow-lg shadow-[#E74C5E]/50"
              >
                <span className="text-2xl">✕</span>
              </motion.div>
              <p className="text-[#E74C5E] font-semibold">Processing Failed</p>
              <p className="text-[#F5E6D3]/60 text-sm break-words">{error}</p>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(200, 169, 106, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  resetState();
                  router.push('/');
                }}
                className="mt-4 px-8 py-3 rounded-xl bg-gradient-to-r from-[#C8A96A] to-[#D4B97A] text-[#0B0B0B] font-semibold hover:shadow-lg transition-all duration-300"
              >
                Try Again
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </section>
    </>
  );
}
