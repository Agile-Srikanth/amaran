'use client';

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { ProcessingResult, processAudio } from './api';

interface AudioContextType {
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  processingResult: ProcessingResult | null;
  isProcessing: boolean;
  error: string | null;
  processingStage: number;
  startProcessing: () => Promise<void>;
  resetState: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState(0);
  const stageTimers = useRef<NodeJS.Timeout[]>([]);

  const clearTimers = useCallback(() => {
    stageTimers.current.forEach(clearTimeout);
    stageTimers.current = [];
  }, []);

  const startProcessing = useCallback(async () => {
    if (!selectedFile) {
      setError('No file selected');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessingResult(null);
    setProcessingStage(0);

    // Animate through processing stages while API call runs
    const delays = [600, 2000, 3600, 5000, 6200];
    delays.forEach((delay, idx) => {
      const t = setTimeout(() => setProcessingStage(idx + 1), delay);
      stageTimers.current.push(t);
    });

    try {
      const result = await processAudio(selectedFile);
      setProcessingResult(result);
      setProcessingStage(5);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed';
      setError(errorMessage);
      console.error('Processing error:', err);
    } finally {
      setIsProcessing(false);
      clearTimers();
    }
  }, [selectedFile, clearTimers]);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setProcessingResult(null);
    setIsProcessing(false);
    setError(null);
    setProcessingStage(0);
    clearTimers();
  }, [clearTimers]);

  return (
    <AudioContext.Provider
      value={{
        selectedFile,
        setSelectedFile,
        processingResult,
        isProcessing,
        error,
        processingStage,
        startProcessing,
        resetState,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
};
