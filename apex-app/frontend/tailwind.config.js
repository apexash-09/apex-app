/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#C0622F', light: '#E8874A', dark: '#9B4B22' },
      },
    },
  },
  plugins: [],
}
