/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base colors - Aged paper / Vintage notebook
        paper: '#FAF6F0',
        'paper-dark': '#EDE6DB',

        // Primary - Deep Olive Green (자연스럽고 따뜻한 그린)
        primary: '#5C6B4D',
        'primary-light': '#7A8B68',
        'primary-dark': '#3F4A36',

        // Secondary - Warm Mustard (포인트 컬러)
        secondary: '#C9A961',
        'secondary-light': '#DBBF7A',
        'secondary-dark': '#A88B43',

        // Accent - Burnt Sienna (세피아 느낌)
        accent: '#A67B5B',
        'accent-light': '#C49A7A',
        'accent-dark': '#8A5F42',

        // Text colors - Sepia toned ink
        ink: {
          light: '#7A6F64',
          DEFAULT: '#3D352E',
          dark: '#2A241F',
        },

        // Neutral - Warm beige
        sand: '#E8DFD3',
        'sand-dark': '#D4C8B8',

        // Status colors - 톤 다운된 자연스러운 색상
        success: '#6B8E5A',
        error: '#B85C50',
        warning: '#C9A961',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Lora', 'Georgia', 'serif'],
        sans: ['Pretendard', 'Nunito', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(61, 53, 46, 0.06)',
        'card': '0 10px 30px -5px rgba(61, 53, 46, 0.1)',
        'float': '0 20px 40px -10px rgba(61, 53, 46, 0.15)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(61, 53, 46, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'gentle-pulse': 'gentlePulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        gentlePulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
      },
      backgroundImage: {
        'paper-texture': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%235C6B4D' fill-opacity='0.02' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E\")",
        'notebook-lines': "repeating-linear-gradient(transparent, transparent 31px, #E8DFD3 31px, #E8DFD3 32px)",
      }
    },
  },
  plugins: [],
}
