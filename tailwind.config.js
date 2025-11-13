/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        nutriBg: "#050608",
        nutriCard: "#0f1014",
        nutriPrimary: "#b8ff3b",
        nutriAccent: "#34d8ff"
      }
    }
  },
  plugins: []
}
