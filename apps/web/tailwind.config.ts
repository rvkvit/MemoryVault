import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // ── Color system from DESIGN_SPEC.md ──────────────────────────────────
      colors: {
        'space-black': '#050810',
        'deep-navy': '#080D1A',
        'void-blue': '#0A1128',
        'ms-blue': '#0078D4',
        'electric-blue': '#00A8E8',
        'copilot-teal': '#00D4B8',
        'luminous-cyan': '#60EFFF',
        'warm-gold': '#F0B429',
        'soft-violet': '#8B7CF8',
        'blush-rose': '#F472B6',
        'success': '#22D3A5',
      },

      // ── Typography ────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['"Segoe UI Variable"', '"Segoe UI"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Cascadia Code"', '"Fira Code"', 'monospace'],
      },
      fontSize: {
        'display-xl': ['4.5rem', { lineHeight: '1.0', letterSpacing: '-0.04em', fontWeight: '300' }],
        'display-l':  ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '300' }],
        'display-m':  ['2.5rem', { lineHeight: '1.1',  letterSpacing: '-0.02em', fontWeight: '400' }],
        'heading-l':  ['1.75rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '500' }],
        'heading-m':  ['1.375rem', { lineHeight: '1.3', fontWeight: '500' }],
        'heading-s':  ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-l':     ['1.0625rem', { lineHeight: '1.7', fontWeight: '400' }],
        'body-m':     ['0.9375rem', { lineHeight: '1.65', fontWeight: '400' }],
        'body-s':     ['0.8125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'label-l':    ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.06em', fontWeight: '600' }],
        'label-s':    ['0.625rem', { lineHeight: '1.4', letterSpacing: '0.10em', fontWeight: '700' }],
      },

      // ── Backdrop blur scale ────────────────────────────────────────────────
      backdropBlur: {
        'glass-sm': '16px',
        'glass-md': '24px',
        'glass-lg': '40px',
        'glass-xl': '60px',
      },

      // ── Border radius scale ────────────────────────────────────────────────
      borderRadius: {
        'glass': '16px',
        'glass-lg': '24px',
        'glass-xl': '32px',
      },

      // ── Box shadows ────────────────────────────────────────────────────────
      boxShadow: {
        'glow-teal': '0 0 24px rgba(0, 212, 184, 0.4)',
        'glow-blue': '0 0 24px rgba(0, 120, 212, 0.4)',
        'glow-teal-sm': '0 0 12px rgba(0, 212, 184, 0.3)',
        'card': '0 40px 120px rgba(0, 0, 0, 0.6)',
        'card-sm': '0 20px 60px rgba(0, 0, 0, 0.5)',
      },

      // ── Animations ────────────────────────────────────────────────────────
      animation: {
        'shimmer': 'shimmer 1.5s linear infinite',
        'float': 'float 3s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
        'ring-expand': 'ring-expand 2s ease-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'drift': 'drift 40s linear infinite',
        'scroll-chevron': 'scroll-chevron 1.8s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        'ring-expand': {
          '0%':   { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.8' },
          '50%':      { opacity: '1.0' },
        },
        drift: {
          '0%':   { transform: 'translate(0px, 0px)' },
          '25%':  { transform: 'translate(30px, -20px)' },
          '50%':  { transform: 'translate(0px, 0px)' },
          '75%':  { transform: 'translate(-20px, 30px)' },
          '100%': { transform: 'translate(0px, 0px)' },
        },
        'scroll-chevron': {
          '0%, 100%': { opacity: '0.3', transform: 'translateY(0)' },
          '50%':      { opacity: '0.8', transform: 'translateY(4px)' },
        },
      },

      // ── Spacing ───────────────────────────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '100': '25rem',
        '120': '30rem',
      },

      // ── Max widths ─────────────────────────────────────────────────────────
      maxWidth: {
        'page': '1440px',
        'prose': '680px',
        'card': '760px',
      },
    },
  },
  plugins: [],
}

export default config
