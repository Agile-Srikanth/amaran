'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn } from 'lucide-react';

interface SpectrogramViewerProps {
  src: string;
  title: string;
  alt: string;
}

export const SpectrogramViewer = ({ src, title, alt }: SpectrogramViewerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <div className="rounded-2xl backdrop-blur-md bg-gradient-to-br from-[#0B0B0B]/60 to-[#0B0B0B]/40 border border-[#C8A96A]/20 p-6 shadow-2xl shadow-[#C8A96A]/10 group cursor-pointer"
          onClick={() => setIsExpanded(true)}
        >
          {/* Title */}
          <div className="mb-4">
            <p className="text-[#F5E6D3] font-semibold text-lg">{title}</p>
          </div>

          {/* Image Container */}
          <div className="relative rounded-xl overflow-hidden bg-[#0B0B0B]/40 border border-[#C8A96A]/10">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <img
                src={src}
                alt={alt}
                className="w-full h-auto object-cover"
              />

              {/* Hover Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-gradient-to-br from-[#C8A96A]/20 to-transparent flex items-center justify-center"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="bg-[#C8A96A]/80 hover:bg-[#C8A96A] p-3 rounded-full transition-colors duration-300"
                >
                  <ZoomIn className="w-6 h-6 text-[#0B0B0B]" />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Modal / Lightbox */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-4xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsExpanded(false)}
                className="absolute -top-12 right-0 z-60 bg-[#C8A96A]/20 hover:bg-[#C8A96A]/40 border border-[#C8A96A]/40 rounded-full p-2 transition-all duration-300"
              >
                <X className="w-6 h-6 text-[#C8A96A]" />
              </motion.button>

              {/* Image */}
              <div className="rounded-2xl overflow-hidden bg-[#0B0B0B] border border-[#C8A96A]/20">
                <img
                  src={src}
                  alt={alt}
                  className="w-full h-auto object-cover max-h-[85vh]"
                />
              </div>

              {/* Title in Modal */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mt-4 text-center"
              >
                <p className="text-[#F5E6D3] font-semibold text-lg">{title}</p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
