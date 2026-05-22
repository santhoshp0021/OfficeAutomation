/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7a5c1c',
          light: '#b6894a',
          dark: '#5a4010',
        },
        beige: {
          50: '#f5f5dc',
          100: '#e3d9c6',
          200: '#d1c4a3',
        },
      },
      fontFamily: {
        sans: ['Segoe UI', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
