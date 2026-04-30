import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Surface tokens
        canvas: 'hsl(var(--canvas))',
        surface: 'hsl(var(--surface))',
        'surface-2': 'hsl(var(--surface-2))',
        border: 'hsl(var(--border))',
        ring: 'hsl(var(--ring))',
        // Text tokens
        ink: 'hsl(var(--ink))',
        'ink-muted': 'hsl(var(--ink-muted))',
        'ink-soft': 'hsl(var(--ink-soft))',
        // Brand
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          foreground: 'hsl(var(--brand-foreground))',
          soft: 'hsl(var(--brand-soft))',
        },
        // Accents used by KPI cards / chart
        violet: { DEFAULT: '#6F5CFF', soft: '#8B7CFF' },
        sky: { DEFAULT: '#27C0DE', soft: '#5BD3EA' },
        indigo: { DEFAULT: '#5B7BFF', soft: '#7E97FF' },
        coral: { DEFAULT: '#F47A6F', soft: '#FF9C92' },
        emerald: { DEFAULT: '#22C58B' },
        amber: { DEFAULT: '#F2B544' },
      },
      borderRadius: {
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.04)',
        pop: '0 8px 32px rgba(15, 23, 42, 0.08)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
      },
    },
  },
  plugins: [],
}

export default config
