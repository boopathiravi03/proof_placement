/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        card: 'var(--card)',
        ink: 'var(--ink)',
        mut: 'var(--mut)',
        line: 'var(--line)',
        pri: 'var(--pri)',
        pt: 'var(--pt)',
        ok: 'var(--ok)',
        okt: 'var(--okt)',
        warn: 'var(--warn)',
        wt: 'var(--wt)',
        bad: 'var(--bad)',
        bt: 'var(--bt)',
        blu: 'var(--blu)',
        blt: 'var(--blt)',
        side: 'var(--side)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
