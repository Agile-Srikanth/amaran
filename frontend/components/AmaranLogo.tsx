'use client';

import { motion } from 'framer-motion';

export const AmaranLogo = ({ size = 36 }: { size?: number }) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      whileHover={{ rotate: [0, -5, 5, 0] }}
      transition={{ duration: 0.5 }}
    >
      {/* Background circle with gold-silver gradient border */}
      <circle cx="50" cy="50" r="47" fill="url(#logoGrad)" />
      <circle cx="50" cy="50" r="47" stroke="url(#borderGrad)" strokeWidth="3" fill="none" />

      {/* Guitar body (shaped like a gun grip/silhouette) */}
      {/* Guitar neck = barrel */}
      <rect x="55" y="12" width="6" height="40" rx="2" fill="#F5E6D3" />
      {/* Fret lines */}
      <line x1="56" y1="20" x2="60" y2="20" stroke="#0B0B0B" strokeWidth="1.2" />
      <line x1="56" y1="26" x2="60" y2="26" stroke="#0B0B0B" strokeWidth="1.2" />
      <line x1="56" y1="32" x2="60" y2="32" stroke="#0B0B0B" strokeWidth="1.2" />
      <line x1="56" y1="38" x2="60" y2="38" stroke="#0B0B0B" strokeWidth="1.2" />

      {/* Guitar body */}
      <ellipse cx="52" cy="62" rx="18" ry="14" fill="#F5E6D3" />
      <ellipse cx="52" cy="62" rx="14" ry="10" fill="#0B0B0B" opacity="0.3" />
      <circle cx="52" cy="62" r="6" fill="#0B0B0B" opacity="0.6" />

      {/* Upper bout */}
      <ellipse cx="52" cy="50" rx="12" ry="7" fill="#F5E6D3" />

      {/* Bridge */}
      <rect x="49" y="68" width="6" height="10" rx="1" fill="#C8A96A" />

      {/* Headstock */}
      <rect x="53" y="8" width="10" height="6" rx="2" fill="#C8A96A" />
      <circle cx="55" cy="10" r="1.5" fill="#F5E6D3" />
      <circle cx="59" cy="10" r="1.5" fill="#F5E6D3" />
      <circle cx="55" cy="13" r="1.5" fill="#F5E6D3" />
      <circle cx="59" cy="13" r="1.5" fill="#F5E6D3" />

      {/* Strings */}
      <line x1="56" y1="14" x2="50" y2="68" stroke="#C8A96A" strokeWidth="0.6" opacity="0.8" />
      <line x1="58" y1="14" x2="52" y2="68" stroke="#C0C0C0" strokeWidth="0.6" opacity="0.6" />
      <line x1="60" y1="14" x2="54" y2="68" stroke="#C8A96A" strokeWidth="0.6" opacity="0.8" />

      {/* BULLETS — silver tipped */}
      <ellipse cx="22" cy="20" rx="2.5" ry="5" fill="#C8A96A" transform="rotate(-30 22 20)" />
      <ellipse cx="22" cy="16" rx="2.5" ry="2" fill="#C0C0C0" transform="rotate(-30 22 16)" />

      <ellipse cx="14" cy="45" rx="2.5" ry="5" fill="#C8A96A" transform="rotate(-60 14 45)" />
      <ellipse cx="11.5" cy="42" rx="2.5" ry="2" fill="#C0C0C0" transform="rotate(-60 11.5 42)" />

      <ellipse cx="20" cy="80" rx="2.5" ry="5" fill="#C8A96A" transform="rotate(20 20 80)" />
      <ellipse cx="21" cy="76" rx="2.5" ry="2" fill="#C0C0C0" transform="rotate(20 21 76)" />

      <ellipse cx="82" cy="22" rx="2.5" ry="5" fill="#C8A96A" transform="rotate(40 82 22)" />
      <ellipse cx="84" cy="18.5" rx="2.5" ry="2" fill="#C0C0C0" transform="rotate(40 84 18.5)" />

      <ellipse cx="88" cy="55" rx="2.5" ry="5" fill="#C8A96A" transform="rotate(70 88 55)" />
      <ellipse cx="90" cy="52" rx="2.5" ry="2" fill="#C0C0C0" transform="rotate(70 90 52)" />

      <ellipse cx="80" cy="82" rx="2.5" ry="5" fill="#C8A96A" transform="rotate(-15 80 82)" />
      <ellipse cx="79" cy="78" rx="2.5" ry="2" fill="#C0C0C0" transform="rotate(-15 79 78)" />

      {/* MUSICAL NOTES */}
      <g transform="translate(30, 15) scale(0.8)">
        <ellipse cx="4" cy="10" rx="4" ry="3" fill="#C8A96A" transform="rotate(-20 4 10)" />
        <rect x="7" y="-2" width="2" height="13" fill="#C8A96A" />
        <path d="M9,-2 Q14,-4 9,3" fill="#C8A96A" />
      </g>

      <g transform="translate(32, 82) scale(0.7)">
        <ellipse cx="4" cy="10" rx="4" ry="3" fill="#C0C0C0" transform="rotate(-20 4 10)" />
        <rect x="7" y="0" width="2" height="11" fill="#C0C0C0" />
      </g>

      <g transform="translate(76, 38) scale(0.7)">
        <ellipse cx="0" cy="12" rx="3.5" ry="2.5" fill="#C8A96A" transform="rotate(-20 0 12)" />
        <rect x="3" y="0" width="1.5" height="13" fill="#C8A96A" />
        <ellipse cx="10" cy="10" rx="3.5" ry="2.5" fill="#C8A96A" transform="rotate(-20 10 10)" />
        <rect x="13" y="-2" width="1.5" height="13" fill="#C8A96A" />
        <rect x="3" y="0" width="12" height="2" fill="#C8A96A" rx="1" />
      </g>

      <g transform="translate(8, 65) scale(0.65)">
        <ellipse cx="4" cy="10" rx="4" ry="3" fill="#C0C0C0" transform="rotate(-20 4 10)" />
        <rect x="7" y="-1" width="2" height="12" fill="#C0C0C0" />
        <path d="M9,-1 Q13,-3 9,4" fill="#C0C0C0" />
      </g>

      {/* Gradients */}
      <defs>
        <radialGradient id="logoGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0B0B0B" />
        </radialGradient>
        <linearGradient id="borderGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C8A96A" />
          <stop offset="50%" stopColor="#C0C0C0" />
          <stop offset="100%" stopColor="#C8A96A" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
};
