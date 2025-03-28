/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        'neon': '0 0 5px theme(colors.purple.400), 0 0 20px theme(colors.purple.600)',
        'neon-lg': '0 0 10px theme(colors.purple.400), 0 0 30px theme(colors.purple.600), 0 0 50px theme(colors.purple.800)',
      },
    },
  },
  plugins: [],
};