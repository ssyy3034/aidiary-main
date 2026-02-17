/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paper - real notebook paper feel
        linen: '#F7F3ED',
        'linen-dark': '#EDE7DD',
        'linen-deep': '#E2D9CC',

        // Text - rich cocoa brown, not gray
        cocoa: '#5C4033',
        'cocoa-light': '#8B7355',
        'cocoa-muted': '#A69580',

        // Accent - terracotta clay, handmade feel
        terra: '#C67D5B',
        'terra-light': '#E0A88A',
        'terra-dark': '#A8603D',
        'terra-muted': '#D4A088',

        // Supporting
        sage: '#8FA68A',
        'sage-light': '#B5C9B1',
        'sage-dark': '#6B8A65',
        dusty: '#B0A4A0',
        blush: '#C9A0A0',
        ink: '#3D2E24',
      },
      fontFamily: {
        display: ['"Noto Serif KR"', 'Georgia', 'serif'],
        body: ['Pretendard', '"Noto Sans KR"', 'sans-serif'],
      },
      boxShadow: {
        'paper': '2px 3px 8px rgba(60, 46, 36, 0.08)',
        'paper-hover': '3px 5px 14px rgba(60, 46, 36, 0.12)',
        'lifted': '0 8px 24px -4px rgba(60, 46, 36, 0.1), 0 2px 6px -2px rgba(60, 46, 36, 0.06)',
        'pressed': 'inset 0 1px 3px rgba(60, 46, 36, 0.08)',
        'tab': '0 -2px 8px rgba(60, 46, 36, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'wiggle': 'wiggle 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-1deg)' },
          '75%': { transform: 'rotate(1deg)' },
        },
      },
    },
  },
  plugins: [],
}
