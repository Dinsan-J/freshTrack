/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'safe': '#22c55e',      
        'warning': '#f59e0b',   
        'danger': '#ef4444',    
        'dark': '#0f172a',      
        'primary': '#6366f1',   
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
