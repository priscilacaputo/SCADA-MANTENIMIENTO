/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#eff6ff', 500: '#0066CC', 700: '#003087', 900: '#001a4d' },
      },
    },
  },
  plugins: [],
};
