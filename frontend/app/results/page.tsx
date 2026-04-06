'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AudioPlayer } from '@/components/AudioPlayer';
import { SpectrogramViewer } from '@/components/SpectrogramViewer';
import { EmotionDisplay } from '@/components/EmotionDisplay';
import { Navbar } from '@/components/Navbar';
import { useAudio } from '@/lib/AudioContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

/** Image with error fallback */
function AnalysisImage({ src, alt, delay = 0 }: { src: string | null; alt: string; delay?: number }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="w-full h-40 rounded-lg bg-[#0B0B0B]/60 border border-[#C8A96A]/10 flex items-center justify-center">
        <p className="text-[#F5E6D3]/40 text-sm">{error ? 'Failed to load image' : 'No image available'}</p>
      </div>
    );
  }

  return (
    <motion.img
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      src={src}
      alt={alt}
      className="w-full h-auto rounded-lg"
      onError={() => setError(true)}
    />
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const { processingResult, selectedFile } = useAudio();
  const { resetState } = useAudio();

  useEffect(() => {
    if (!processingResult) {
      router.push('/');
      return;
    }
  }, [processingResult, router]);

  if (!processingResult) {
    return null;
  }

  const handleProcessAnother = () => {
    resetState();
    router.push('/');
  };

  const processingTimeSeconds = (processingResult.processing_time_ms / 1000).toFixed(2);

  return (
    <>
      <Navbar />

      {/* Results Container */}
      <section className="relative w-full min-h-screen pt-28 pb-16 px-4 md:px-8">
        {/* Background Elements */}
        <div className="fixed inset-0 bg-gradient-to-br from-[#0B0B0B] via-transparent to-[#0B0B0B] pointer-events-none z-0" />
        <div className="fixed -top-1/2 -right-1/4 w-1/2 h-full bg-gradient-radial from-[#C8A96A]/5 to-transparent blur-3xl opacity-20 pointer-events-none z-0" />
        <div className="fixed -bottom-1/2 -left-1/4 w-1/2 h-full bg-gradient-radial from-[#C8A96A]/5 to-transparent blur-3xl opacity-20 pointer-events-none z-0" />

        {/* Main Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-7xl mx-auto space-y-8"
        >
          {/* Header Section */}
          <motion.div variants={itemVariants} className="text-center space-y-4 mb-12">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#4CCD89] to-[#27AE60] shadow-lg shadow-[#4CCD89]/50 mx-auto"
            >
              <span className="text-2xl">✓</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#F5E6D3]">
              Analysis Complete
            </h1>
            <p className="text-[#F5E6D3]/70 text-lg">
              Your audio has been processed successfully
            </p>
          </motion.div>

          {/* Main Layout: Two-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN - Audio & Info */}
            <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
              {/* Audio Comparison Card */}
              <div className="rounded-2xl backdrop-blur-md bg-gradient-to-br from-[#0B0B0B]/60 to-[#0B0B0B]/40 border border-[#C8A96A]/20 p-6 shadow-2xl shadow-[#C8A96A]/10">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="mb-6"
                >
                  <h2 className="text-xl font-bold text-[#F5E6D3] mb-1">Audio Comparison</h2>
                  <p className="text-[#F5E6D3]/50 text-sm">Original vs. Processed</p>
                </motion.div>

                <div className="space-y-5">
                  {/* Original Audio Player */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <AudioPlayer
                      src={processingResult.original_audio_url}
                      label="Original Audio"
                      color="#C8A96A"
                    />
                  </motion.div>

                  {/* Processed Audio Player */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <AudioPlayer
                      src={processingResult.processed_audio_url}
                      label="Processed Audio"
                      color="#4CCD89"
                    />
                  </motion.div>
                </div>
              </div>

              {/* Processing Info Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="rounded-2xl backdrop-blur-md bg-gradient-to-br from-[#0B0B0B]/60 to-[#0B0B0B]/40 border border-[#C8A96A]/20 p-6 shadow-2xl shadow-[#C8A96A]/10"
              >
                <h3 className="text-lg font-bold text-[#F5E6D3] mb-4">Processing Details</h3>

                <div className="space-y-3">
                  {/* File Name */}
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-[#F5E6D3]/60 text-sm">File Name</span>
                    <span className="text-[#F5E6D3] text-sm font-semibold text-right max-w-[160px] truncate">
                      {selectedFile?.name || 'Unknown'}
                    </span>
                  </div>

                  {/* File Size */}
                  <div className="flex items-center justify-between">
                    <span className="text-[#F5E6D3]/60 text-sm">File Size</span>
                    <span className="text-[#C8A96A] text-sm font-mono">
                      {selectedFile
                        ? (selectedFile.size / 1024 / 1024).toFixed(2)
                        : '0.00'}{' '}
                      MB
                    </span>
                  </div>

                  {/* Processing Time */}
                  <div className="flex items-center justify-between">
                    <span className="text-[#F5E6D3]/60 text-sm">Processing Time</span>
                    <span className="text-[#4CCD89] text-sm font-mono">
                      {processingTimeSeconds}s
                    </span>
                  </div>

                  {/* Job ID */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#C8A96A]/10">
                    <span className="text-[#F5E6D3]/60 text-xs">Job ID</span>
                    <span className="text-[#F5E6D3]/40 text-xs font-mono truncate">
                      {processingResult.job_id}
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* RIGHT COLUMN - Analysis Cards */}
            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
              {/* Waveform Analysis Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-2xl backdrop-blur-md bg-gradient-to-br from-[#0B0B0B]/60 to-[#0B0B0B]/40 border border-[#C8A96A]/20 p-6 shadow-2xl shadow-[#C8A96A]/10"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <h2 className="text-xl font-bold text-[#F5E6D3] mb-5">Waveform Analysis</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Original Waveform */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.35 }}
                    >
                      <div className="rounded-xl overflow-hidden bg-[#0B0B0B]/40 border border-[#C8A96A]/10 p-3">
                        <p className="text-[#F5E6D3]/70 text-xs font-medium mb-3">Original Waveform</p>
                        <AnalysisImage src={processingResult.waveform_original_url} alt="Original Waveform" delay={0.4} />
                      </div>
                    </motion.div>

                    {/* Processed Waveform */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      <div className="rounded-xl overflow-hidden bg-[#0B0B0B]/40 border border-[#C8A96A]/10 p-3">
                        <p className="text-[#F5E6D3]/70 text-xs font-medium mb-3">Processed Waveform</p>
                        <AnalysisImage src={processingResult.waveform_processed_url} alt="Processed Waveform" delay={0.45} />
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Spectrogram Analysis Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="rounded-2xl backdrop-blur-md bg-gradient-to-br from-[#0B0B0B]/60 to-[#0B0B0B]/40 border border-[#C8A96A]/20 p-6 shadow-2xl shadow-[#C8A96A]/10"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <h2 className="text-xl font-bold text-[#F5E6D3] mb-5">Spectrogram Analysis</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Original Spectrogram */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.45 }}
                    >
                      <div className="rounded-xl overflow-hidden bg-[#0B0B0B]/40 border border-[#C8A96A]/10 p-3 cursor-pointer group hover:border-[#C8A96A]/40 transition-colors duration-300">
                        <p className="text-[#F5E6D3]/70 text-xs font-medium mb-3">Original Spectrogram</p>
                        <AnalysisImage src={processingResult.spectrogram_original_url} alt="Original Spectrogram" delay={0.45} />
                      </div>
                    </motion.div>

                    {/* Processed Spectrogram */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      <div className="rounded-xl overflow-hidden bg-[#0B0B0B]/40 border border-[#C8A96A]/10 p-3 cursor-pointer group hover:border-[#C8A96A]/40 transition-colors duration-300">
                        <p className="text-[#F5E6D3]/70 text-xs font-medium mb-3">Processed Spectrogram</p>
                        <AnalysisImage src={processingResult.spectrogram_processed_url} alt="Processed Spectrogram" delay={0.5} />
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          {/* Emotion Detection - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="rounded-2xl backdrop-blur-md bg-gradient-to-br from-[#0B0B0B]/60 to-[#0B0B0B]/40 border border-[#C8A96A]/20 p-6 shadow-2xl shadow-[#C8A96A]/10">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.55 }}
              >
                <h2 className="text-xl font-bold text-[#F5E6D3] mb-6 text-center">Emotion Detection Results</h2>

                <div className="max-w-2xl mx-auto">
                  <EmotionDisplay
                    emotion={processingResult.emotion}
                    confidence={processingResult.confidence}
                    allEmotions={processingResult.all_emotions}
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Action Buttons Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(200, 169, 106, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleProcessAnother}
              className="btn-primary px-8 py-3 font-semibold"
            >
              Process Another Audio
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(200, 169, 106, 0.2)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/')}
              className="px-8 py-3 rounded-xl bg-[#0B0B0B]/60 border border-[#C8A96A]/40 text-[#F5E6D3] font-semibold hover:border-[#C8A96A] hover:bg-[#0B0B0B]/80 transition-all duration-300 backdrop-blur-md"
            >
              Back to Home
            </motion.button>
          </motion.div>

          {/* Footer Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="grid grid-cols-3 gap-4 mt-12 max-w-md mx-auto text-center"
          >
            {[
              { label: 'Job ID', value: processingResult.job_id.substring(0, 8) + '...' },
              { label: 'Processing', value: `${processingTimeSeconds}s` },
              { label: 'Format', value: selectedFile?.type.split('/')[1]?.toUpperCase() || 'AUDIO' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                className="p-3 rounded-lg bg-[#0B0B0B]/50 border border-[#C8A96A]/20"
              >
                <p className="text-[#F5E6D3]/50 text-xs mb-1">{stat.label}</p>
                <p className="text-[#C8A96A] font-mono text-sm font-semibold">{stat.value}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>
    </>
  );
}
