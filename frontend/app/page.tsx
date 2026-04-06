'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AnimatedWaveform } from '@/components/AnimatedWaveform';
import { FileUploader } from '@/components/FileUploader';
import { Navbar } from '@/components/Navbar';
import { useAudio } from '@/lib/AudioContext';

export default function Home() {
  const router = useRouter();
  const { selectedFile, setSelectedFile, startProcessing, isProcessing } = useAudio();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
  };

  const handleAnalyze = () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    router.push('/processing');
    setTimeout(() => {
      startProcessing();
    }, 100);
  };

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20">
        {/* Animated Waveform Background */}
        <div className="absolute inset-0 opacity-100">
          <AnimatedWaveform opacity={0.25} speed={1} />
        </div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B0B0B] via-transparent to-[#0B0B0B] pointer-events-none" />
        <div className="absolute -top-1/3 -right-1/4 w-[600px] h-[600px] bg-gradient-radial from-[#C8A96A]/12 to-transparent blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute -bottom-1/3 -left-1/4 w-[500px] h-[500px] bg-gradient-radial from-[#C0C0C0]/6 to-transparent blur-3xl opacity-30 pointer-events-none" />
        {/* Silver accent orb */}
        <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-gradient-radial from-[#C0C0C0]/5 to-transparent blur-3xl opacity-20 pointer-events-none" />

        {/* Content Container */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 flex flex-col items-center text-center space-y-10"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#C8A96A]/15 via-[#C0C0C0]/8 to-[#C8A96A]/15 border border-[#C8A96A]/30 backdrop-blur-xl">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8A96A] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C8A96A]" />
              </span>
              <span className="text-[#C0C0C0] text-sm font-semibold tracking-widest uppercase">
                AI-Powered Speech Analysis
              </span>
            </div>
          </motion.div>

          {/* Main Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-none font-display">
              <span className="text-gradient">
                AMARAN
              </span>
            </h1>
          </motion.div>

          {/* Subtitle — bold with silver */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <p className="text-xl md:text-2xl font-medium tracking-wide">
              <span className="text-[#C8A96A] font-bold">Enhance</span>
              <span className="text-[#C0C0C0]/40 mx-3">/</span>
              <span className="text-[#C0C0C0] font-bold">Analyze</span>
              <span className="text-[#C0C0C0]/40 mx-3">/</span>
              <span className="text-[#C8A96A] font-bold">Understand</span>
            </p>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-2xl"
          >
            <p className="text-lg text-[#C0C0C0]/70 leading-relaxed">
              Advanced AI-powered audio processing with real-time noise reduction,
              emotion detection, and comprehensive acoustic analysis.
              Upload your audio and unlock powerful insights.
            </p>
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="w-48 divider-glow"
          />

          {/* File Uploader */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="w-full max-w-xl"
          >
            <FileUploader onFileSelected={handleFileSelected} disabled={isAnalyzing || isProcessing} />
          </motion.div>

          {/* Analyze Button */}
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
              className="flex flex-col items-center gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.06, boxShadow: '0 0 50px rgba(200, 169, 106, 0.4), 0 0 20px rgba(192, 192, 192, 0.15)' }}
                whileTap={{ scale: 0.96 }}
                onClick={handleAnalyze}
                disabled={isAnalyzing || isProcessing}
                className="btn-primary px-14 py-5 text-lg font-black disabled:opacity-50"
              >
                {isAnalyzing || isProcessing ? (
                  <span className="flex items-center gap-3">
                    <span className="w-5 h-5 border-2 border-[#0B0B0B]/30 border-t-[#0B0B0B] rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  'Analyze Now'
                )}
              </motion.button>
              <p className="text-xs text-[#C0C0C0]/40 mt-1">
                {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
              </p>
            </motion.div>
          )}

          {/* Feature Cards — bold glass cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl"
          >
            {[
              { icon: '\uD83C\uDFB5', label: 'Noise Reduction', desc: 'MMSE-STSA Algorithm' },
              { icon: '\uD83D\uDCCA', label: 'Waveform Analysis', desc: 'Visual Spectrum' },
              { icon: '\uD83C\uDFAD', label: 'Emotion Detection', desc: 'AI Classification' },
              { icon: '\u26A1', label: 'Real-time', desc: 'Fast Processing' },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                whileHover={{
                  scale: 1.08,
                  y: -4,
                  borderColor: 'rgba(200, 169, 106, 0.5)',
                  boxShadow: '0 15px 40px rgba(0,0,0,0.3), 0 0 20px rgba(200, 169, 106, 0.12)'
                }}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-[#111]/80 border border-[#C0C0C0]/10 backdrop-blur-sm cursor-default transition-all duration-300 group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{feature.icon}</span>
                <span className="text-sm text-[#F5E6D3] text-center font-bold tracking-wide">
                  {feature.label}
                </span>
                <span className="text-[10px] text-[#C0C0C0]/50 font-medium uppercase tracking-wider">
                  {feature.desc}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>
    </>
  );
}
