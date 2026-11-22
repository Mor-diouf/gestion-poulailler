/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        foret: { DEFAULT: '#1F5130', 50: '#EEF4EF', 100: '#DCE9DF', 600: '#1F5130', 700: '#183F26', 800: '#12301D' },
        creme: '#FAF7F0',
        ambre: { DEFAULT: '#E3A008', 50: '#FDF6E3', 100: '#FBEBC2', 700: '#8A6205' },
        brique: { DEFAULT: '#B42318', 50: '#FBEDEC', 100: '#F6D5D2' },
        encre: '#1C2421',
        gris: '#6B7280',
        ligne: '#ECE8DF',
      },
      fontFamily: {
        titre: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        carte: '0 1px 2px rgba(28,36,33,0.04), 0 4px 16px -6px rgba(28,36,33,0.08)',
        haute: '0 12px 40px -12px rgba(28,36,33,0.25)',
      },
      keyframes: {
        monte: { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        glisse: { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        fondu: { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        monte: 'monte 260ms cubic-bezier(0.32,0.72,0,1)',
        glisse: 'glisse 260ms cubic-bezier(0.32,0.72,0,1)',
        fondu: 'fondu 200ms ease-out',
      },
    },
  },
  plugins: [],
}
