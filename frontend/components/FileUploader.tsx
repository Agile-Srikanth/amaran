'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

type UploadState = 'idle' | 'hover' | 'accepted' | 'rejected';

export const FileUploader = ({ onFileSelected, disabled = false }: FileUploaderProps) => {
  const [state, setState] = useState<UploadState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setErrorMessage('');

      if (rejectedFiles.length > 0) {
        setState('rejected');
        const error = rejectedFiles[0].errors[0];
        if (error.code === 'file-too-large') {
          setErrorMessage('File is too large. Maximum size is 50MB.');
        } else if (error.code === 'file-invalid-type') {
          setErrorMessage('Invalid file type. Please upload an audio file.');
        }
        setTimeout(() => setState('idle'), 3000);
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setState('accepted');
        setSelectedFile(file);
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.flac', '.m4a'],
    },
    maxSize: 50 * 1024 * 1024,
    disabled,
    multiple: false,
  });

  const currentState = isDragActive ? 'hover' : state;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <motion.div
        {...getRootProps()}
        whileHover={{ scale: 1.02, borderColor: 'rgba(200, 169, 106, 0.6)' }}
        whileTap={{ scale: 0.99 }}
        className={`
          relative rounded-2xl p-10 cursor-pointer transition-all duration-400
          backdrop-blur-xl border-2 border-dashed
          ${currentState === 'accepted'
            ? 'border-[#C8A96A]/60 bg-gradient-to-br from-[#C8A96A]/10 via-[#111]/80 to-[#C0C0C0]/5 shadow-lg shadow-[#C8A96A]/10'
            : currentState === 'rejected'
            ? 'border-red-500/60 bg-gradient-to-br from-red-500/10 via-[#111]/80 to-[#111]/80'
            : currentState === 'hover'
            ? 'border-[#C8A96A]/70 bg-gradient-to-br from-[#C8A96A]/15 via-[#111]/80 to-[#C0C0C0]/5 shadow-xl shadow-[#C8A96A]/15'
            : 'border-[#C0C0C0]/20 bg-gradient-to-br from-[#111]/80 to-[#0B0B0B]/80 hover:border-[#C8A96A]/40 hover:shadow-lg hover:shadow-[#C8A96A]/8'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className="relative z-10 flex flex-col items-center justify-center space-y-5">
          {/* Icon */}
          <motion.div
            animate={isDragActive ? { scale: 1.3, rotate: 5 } : { scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="relative"
          >
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#C8A96A]/15 to-[#C0C0C0]/5 border border-[#C8A96A]/20">
              <Upload className="w-10 h-10 text-[#C8A96A]" strokeWidth={2} />
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {selectedFile ? (
              <motion.div
                key="file-info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center"
              >
                <p className="text-[#F5E6D3] font-bold text-lg tracking-wide">{selectedFile.name}</p>
                <p className="text-[#C0C0C0]/50 text-sm mt-1">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </motion.div>
            ) : errorMessage ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center"
              >
                <p className="text-red-400 font-bold text-lg">{errorMessage}</p>
              </motion.div>
            ) : (
              <motion.div
                key="prompt"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center space-y-2"
              >
                <p className="text-[#F5E6D3] font-bold text-lg">
                  {isDragActive ? 'Drop your audio here' : 'Drag and drop an audio file'}
                </p>
                <p className="text-[#C0C0C0]/50 text-sm">
                  or click to browse (max 50MB)
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  {['MP3', 'WAV', 'OGG', 'FLAC', 'M4A'].map((fmt) => (
                    <span
                      key={fmt}
                      className="px-2.5 py-1 rounded-lg bg-[#C8A96A]/8 border border-[#C8A96A]/15 text-[10px] font-bold text-[#C8A96A]/70 tracking-wider"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};
