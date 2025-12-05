/** @type {import('tailwindcss').Config} */
const Size = {
  xtiny: ['0.625rem', { lineHeight: '1rem' }], // 10px
  tiny: ['0.75rem', { lineHeight: '1rem' }], // 12px  ← most people call this "xs"

  // Official modern scale (recommended)
  xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
  sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
  base: ['1rem', { lineHeight: '1.5rem' }], // 16px ← default body
  lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
  xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
  '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
  '5xl': ['3rem', { lineHeight: '1' }], // 48px (no leading)
  '6xl': ['3.75rem', { lineHeight: '1' }], // 60px
  '7xl': ['4.5rem', { lineHeight: '1' }], // 72px
  '8xl': ['6rem', { lineHeight: '1' }], // 96px
  '9xl': ['8rem', { lineHeight: '1' }], // 128px

  // Extra ones many teams add
  '2xs': ['0.6875rem', { lineHeight: '1rem' }], // 11px (for captions)
  '3xs': ['0.625rem', { lineHeight: '1rem' }] // 10px
}
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--ev-c-accent)', // Using accent for all for now to ensure visibility
          100: 'var(--ev-c-accent)',
          200: 'var(--ev-c-accent)',
          300: 'var(--ev-c-accent)',
          400: 'var(--ev-c-accent)',
          500: 'var(--ev-c-accent)', // Main primary color
          600: 'var(--ev-c-accent-hover)',
          700: 'var(--ev-c-accent-hover)',
          800: 'var(--ev-c-accent-hover)',
          900: 'var(--ev-c-accent-hover)'
        },
        // We can also map slate/backgrounds if we want full control
        slate: {
          50: 'var(--color-background-soft)',
          100: 'var(--color-background-mute)',
          800: 'var(--color-background-mute)',
          900: 'var(--color-background)'
        },
        red: {
          50: '#ff938a',
          100: '#ff7f75',
          200: '#ff6a60',
          300: '#ff554c',
          400: '#ff4037',
          500: '#ff2b23',
          600: '#e6241f',
          700: '#b31c18',
          800: '#801210',
          900: '#4c0808'
        }
      },
      fontSize: Size,
      spacing: Size,

      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        }
      }
    }
  },
  plugins: []
}
