import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // TAEK brand colours (from product plan)
        primary: {
          DEFAULT: '#C0392B', // TAEK red — primary actions
          hover: '#A93226',
          light: '#E74C3C',
        },
        surface: {
          DEFAULT: '#1A252F', // deep navy — surfaces & sidebars
          light: '#2C3E50',
          muted: '#34495E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
