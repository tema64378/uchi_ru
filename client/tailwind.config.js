/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#765fde', hover: '#6349d5', light: '#eae6ff' },
        brand:     { DEFAULT: '#ff6170', light: '#ffe8ea' },
        text:      { DEFAULT: '#2f2f45', muted: '#7a7a95' },
        bg:        { DEFAULT: '#f5f6f7', card: '#ffffff' },
        success:   { DEFAULT: '#74c336', light: '#e8f7db' },
        error:     { DEFAULT: '#e93017', light: '#fde8e4' },
        yellow:    { DEFAULT: '#fbcc3c', light: '#fffaeb' },
        coral:     { DEFAULT: '#ff6170', '80': '#ff909b' },
        blue:      { DEFAULT: '#3aafff', light: '#e5f5ff' },
        orange:    { DEFAULT: '#ff8811', light: '#fff0e0' },
        mint:      { DEFAULT: '#5ecfb1', light: '#e4f9f4' },
        violet:    { DEFAULT: '#765fde', '80': '#9180e4', '20': '#f0eeff' },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'h1': ['40px', { lineHeight: '46px', fontWeight: '800' }],
        'h2': ['32px', { lineHeight: '38px', fontWeight: '700' }],
        'h3': ['24px', { lineHeight: '30px', fontWeight: '700' }],
        'h4': ['20px', { lineHeight: '24px', fontWeight: '700' }],
        'body-lg': ['18px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '16px', fontWeight: '400' }],
      },
      borderRadius: {
        'card': '20px',
        'btn':  '100px',
        'sm':   '12px',
        'tag':  '8px',
      },
      boxShadow: {
        'card':  '0 2px 12px rgba(47,47,69,0.08)',
        'hover': '0 4px 20px rgba(47,47,69,0.14)',
        'btn':   '0 4px 12px rgba(118,95,222,0.28)',
      },
      keyframes: {
        bounce_soft: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-8px)' },
        },
        pop_in: {
          '0%':   { transform: 'scale(0.8)', opacity: '0' },
          '70%':  { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-12px)' },
        },
      },
      animation: {
        bounce_soft: 'bounce_soft 2s ease-in-out infinite',
        pop_in:      'pop_in 0.4s ease-out forwards',
        float:       'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
