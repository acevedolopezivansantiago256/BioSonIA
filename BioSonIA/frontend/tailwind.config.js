/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bioson: {
          green: '#2ECC71',
          blue: '#3498DB',
          grayLight: '#ECF0F1',
          grayDark: '#34495E',
          red: '#E74C3C'
        },
        primary: "#22c55e", // Green 500
        secondary: "#15803d", // Green 700
        accent: "#f59e0b", // Amber 500
        "background-light": "#fcfdfc",
        "background-dark": "#0a0f0a",
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "12px",
        "xl": "18px",
        "2xl": "24px",
      }
    },
  },
  plugins: [],
};