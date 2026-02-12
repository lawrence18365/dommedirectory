const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Body font - Inter
        sans: ['var(--font-body)', ...defaultTheme.fontFamily.sans],
        // Heading font - Cinzel
        heading: ['var(--font-heading)', 'Georgia', 'serif'],
        // Display font (same as heading for consistency)
        display: ['var(--font-heading)', 'Georgia', 'serif'],
      },
      colors: {
        // Custom colors for dark theme
        dark: {
          50: '#0a0a0a',
          100: '#0d0d0d',
          200: '#141414',
          300: '#1a1a1a',
          400: '#1f1f1f',
          500: '#262626',
        },
        // Brand purple colors
        brand: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
      },
      letterSpacing: {
        'widest': '0.25em',
        'hero': '0.15em',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
