/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Orbit Brand Identity Palette Tokens
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
      }
    },
  },
  plugins: [],
}
