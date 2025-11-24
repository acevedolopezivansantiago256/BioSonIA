/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bioson: {
          green: '#2ECC71',
          blue: '#3498DB',
          grayLight: '#ECF0F1',
          grayDark: '#34495E',
          red: '#E74C3C'
        }
      }
    },
  },
  plugins: [],
};