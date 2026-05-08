import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        severity: {
          info: 'hsl(var(--severity-info) / <alpha-value>)',
          low: 'hsl(var(--severity-low) / <alpha-value>)',
          medium: 'hsl(var(--severity-medium) / <alpha-value>)',
          high: 'hsl(var(--severity-high) / <alpha-value>)',
          critical: 'hsl(var(--severity-critical) / <alpha-value>)',
        },
        truth: {
          real: 'hsl(var(--truth-real) / <alpha-value>)',
          sample: 'hsl(var(--truth-sample) / <alpha-value>)',
          ai: 'hsl(var(--truth-ai) / <alpha-value>)',
          heuristic: 'hsl(var(--truth-heuristic) / <alpha-value>)',
          review: 'hsl(var(--truth-review) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        hero: ['1.5rem', { lineHeight: '1.5', fontWeight: '400' }],
      },
    },
  },
  plugins: [animate],
} satisfies Config;
