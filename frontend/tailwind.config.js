/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          500: '#0284c7',
          600: '#0265d6',
          900: '#0f172a',
        },
        card: '#1e293b',
        panel: '#0f172a',
        accent: '#10b981',
      },
    },
  },
  plugins: [],
}
