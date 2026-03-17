/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
         'ruet-blue': '#1E70C3',
         'ruet-dark': '#171F32',
      }
    },
  },
  plugins: [],
}
