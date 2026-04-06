/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          black: '#0B0B0B',
          dark: '#111111',
          card: '#161616',
          border: '#222222',
        },
        accent: {
          beige: '#F5E6D3',
          gold: '#C8A96A',
          'gold-light': '#D4B97A',
          'gold-dark': '#A88B4A',
          silver: '#C0C0C0',
          'silver-light': '#D8D8D8',
          'silver-dark': '#8A8A8A',
        },
        status: {
          success: '#4CCD89',
          error: '#E74C5E',
          warning: '#F5A623',
          info: '#5B9BD5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(200, 169, 106, 0.1) 0%, rgba(11, 11, 11, 0.8) 100%)',
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(200, 169, 106, 0.3)',
        'glow-gold-lg': '0 0 40px rgba(200, 169, 106, 0.4)',
        'glow-silver': '0 0 20px rgba(192, 192, 192, 0.2)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'wave': 'wave 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'shimmer': 'shimmer 2.5s linear infinite',
        'border-glow': 'borderGlow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(200, 169, 106, 0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(200, 169, 106, 0.5)' },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(1.5)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        borderGlow: {
          '0%': { borderColor: 'rgba(200, 169, 106, 0.3)' },
          '50%': { borderColor: 'rgba(192, 192, 192, 0.4)' },
          '100%': { borderColor: 'rgba(200, 169, 106, 0.3)' },
        },
      },
    },
  },
  plugins: [],
};
