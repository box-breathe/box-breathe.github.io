/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        calm: {
          // User-requested palette:
          // #03684A (Deep Forest Green / Primary)
          // #15D59C (Vibrant Mint Jade / Active Highlight)
          // #66E1BC (Soft Seafoam / Secondary Accent)
          // #E5F6F1 (Ultra-soft Mint Tint / Surface)
          primary: '#03684A',
          primaryHover: '#02523A',
          mint: '#15D59C',
          softMint: '#66E1BC',
          tint: '#E5F6F1',
          
          // Semantic mappings
          lightBg: '#F8FAF9',
          lightSurface: '#E5F6F1',
          teal: '#03684A',
          tealHover: '#02523A',
          tealLight: '#15D59C',
          sky: '#66E1BC',
          skyDark: '#15D59C',
          darkBg: '#091512',
          darkSurface: '#10221D',
          darkBorder: '#1A3830',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Open Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
      boxShadow: {
        'glow-teal': '0 0 30px -4px rgba(21, 213, 156, 0.45)',
        'glow-mint': '0 0 35px -5px rgba(21, 213, 156, 0.5)',
        'glow-primary': '0 0 30px -5px rgba(3, 104, 74, 0.35)',
        'glow-dark': '0 0 45px -5px rgba(21, 213, 156, 0.3)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
