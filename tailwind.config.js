/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nutriBg: "#0B0F14",
        nutriPrimary: "#B8FF5A",
        nutriAccent: "#7CFFB2",
      },
    },
  },
  plugins: [],
}
