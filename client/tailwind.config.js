/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F19',
        card: 'rgba(255, 255, 255, 0.05)',
        cardBorder: 'rgba(255, 255, 255, 0.1)',
        primary: '#4F46E5', // Indigo 600
        secondary: '#10B981', // Emerald 500
        accent: '#8B5CF6', // Violet 500
        text: '#F3F4F6', // Gray 100
        textSubtle: '#9CA3AF', // Gray 400
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
