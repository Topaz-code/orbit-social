import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand Identity Palette Tokens
        page: '#171A1C',
        surface: {
          DEFAULT: '#202A2D',
          raised: '#2B3940',
          hover: '#314048',
          border: '#3A4B4D',
        },
        brand: {
          teal: '#496D6B',
          tealHover: '#5A7D78',
          sage: '#71877B',
          sageHover: '#82998C',
          amber: '#D0A56A',
          amberHover: '#E0B779',
          danger: '#B87568',
          dangerHover: '#C98679',
          topNav: '#141819',
        },
        text: {
          primary: '#D9D0B8',
          secondary: '#A8AAA0',
          muted: '#7F8B86',
        },
        orbit: {
          50: '#F5F3ED',
          100: '#E8E3D5',
          200: '#D9D0B8',
          300: '#C7BC9F',
          400: '#B5A886',
          500: '#D0A56A', // Primary Amber
          600: '#B88F55',
          700: '#496D6B', // Teal Accent
          800: '#2B3940',
          900: '#202A2D',
          950: '#171A1C',
        },
      },
      fontFamily: {
        sans: ['Manrope', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
      },

      animation: {
        'heart-burst': 'heartBurst 0.6s cubic-bezier(0.17, 0.89, 0.32, 1.49) forwards',
        'story-spin': 'storySpin 4s linear infinite',
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-dots': 'bounceDots 1.4s infinite ease-in-out both',
      },
      keyframes: {
        heartBurst: {
          '0%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.35)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        storySpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceDots: {
          '0%, 80%, 100%': { transform: 'scale(0.8)', opacity: '0.4' },
          '40%': { transform: 'scale(1.0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
