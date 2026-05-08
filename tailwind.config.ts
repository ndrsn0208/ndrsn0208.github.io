import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Theme-aware tokens — driven by CSS vars so light/dark switching
        // happens at the data-theme attribute, no Tailwind dark: variants
        // needed. The `<alpha-value>` placeholder lets text-ink/80, bg-bg/85
        // etc. still work with opacity in either theme.
        ink: {
          DEFAULT: 'rgb(var(--ink-rgb) / <alpha-value>)',
          dim: 'rgb(var(--ink-dim-rgb) / <alpha-value>)',
          deep: 'rgb(var(--ink-deep-rgb) / <alpha-value>)',
        },
        bg: {
          DEFAULT: 'rgb(var(--bg-rgb) / <alpha-value>)',
          surface: 'rgb(var(--bg-soft-rgb) / <alpha-value>)',
        },
        line: 'rgb(var(--line-rgb) / <alpha-value>)',
        // Decorative palettes (foil panels, haze, accents) — fixed across
        // themes; saturated colors read on either base.
        warm: {
          pink: '#FF6B6B',
          rose: '#F43F5E',
          coral: '#FCA5A5',
          orange: '#FFA94D',
          amber: '#F59E0B',
          peach: '#FFD7B5',
          cream: '#FFE3D8',
          magenta: '#C026D3',
          fuchsia: '#DB2777',
        },
        cool: {
          lav: '#A78BFA',
          lav2: '#C4B5FD',
        },
      },
      fontFamily: {
        // Display: Bricolage Grotesque first (variable, warm contemporary
        // grotesque used by indie design studios in 2024–25). Geist + Inter
        // remain as fallbacks. Use `font-serif` for editorial accents
        // (loaded but not the default).
        display: ['"Bricolage Grotesque"', 'Geist', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        'super-tight': '-0.04em',
        'tightest': '-0.03em',
        'wider-2': '0.18em',
        'wider-3': '0.22em',
        'wider-4': '0.28em',
      },
      keyframes: {
        iri: {
          '0%':   { 'background-position': '0% 50%' },
          '100%': { 'background-position': '-220% 50%' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        iri: 'iri 12s linear infinite',
        'fade-up': 'fade-up 600ms cubic-bezier(.2,.8,.2,1) both',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(.34, 1.56, .64, 1)',
        smooth: 'cubic-bezier(.2, .8, .2, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config
