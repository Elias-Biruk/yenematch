import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#E8F5F0',
          100: '#D0EBE0',
          200: '#A1D6C1',
          300: '#72C1A2',
          400: '#43AC83',
          500: '#006B4F',
          600: '#005540',
          700: '#004031',
          800: '#002A22',
          900: '#001511',
        },
        burgundy: {
          50: '#FCE8EC',
          100: '#F8D2D9',
          200: '#F0A5B3',
          300: '#E8788D',
          400: '#E04B67',
          500: '#7A1235',
          600: '#620E2B',
          700: '#4B0A20',
          800: '#330616',
          900: '#1A030B',
        },
        gold: {
          50: '#FDF8E8',
          100: '#FBEFCC',
          200: '#F7E09D',
          300: '#F3D16E',
          400: '#EFC23F',
          500: '#C9A227',
          600: '#A1811F',
          700: '#796017',
          800: '#51400F',
          900: '#292007',
        },
        cream: {
          50: '#FFFEFA',
          100: '#FFFCF4',
          200: '#FBF7E8',
          300: '#F7F2E8',
          400: '#F3EDE0',
          500: '#EFE8D8',
          600: '#D1C9BF',
          700: '#B3AAA6',
          800: '#958B8D',
          900: '#776D74',
        },
        ink: {
          50: '#F7F7F7',
          100: '#E8E8E8',
          200: '#D4D4D4',
          300: '#B0B0B0',
          400: '#8C8C8C',
          500: '#686868',
          600: '#4D4D4D',
          700: '#323232',
          800: '#232323',
          900: '#171717',
        },
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
