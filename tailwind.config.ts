import type { Config } from 'tailwindcss';

/**
 * Tailwind is the single consumer of the CSS custom properties declared in
 * src/app/globals.css. Components never reference raw hex values — they use
 * these semantic names, so retheming (or dark mode) is a token edit only.
 */
const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', sm: '1.5rem', lg: '2.5rem' },
      screens: { '2xl': '1280px' },
    },
    extend: {
      screens: {
        // Figma artboards: mobile 390, tablet 1024, desktop 1425 (1280 content).
        xs: '390px',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          alt: 'hsl(var(--surface-alt))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
          soft: 'hsl(var(--primary-soft))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          hover: 'hsl(var(--secondary-hover))',
          soft: 'hsl(var(--secondary-soft))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          soft: 'hsl(var(--accent-soft))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        subtle: {
          foreground: 'hsl(var(--subtle-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        border: {
          DEFAULT: 'hsl(var(--border))',
          strong: 'hsl(var(--border-strong))',
        },
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          soft: 'hsl(var(--success-soft))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
          soft: 'hsl(var(--warning-soft))',
        },
        error: {
          DEFAULT: 'hsl(var(--error))',
          foreground: 'hsl(var(--error-foreground))',
          soft: 'hsl(var(--error-soft))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          soft: 'hsl(var(--info-soft))',
        },
        lavender: 'hsl(var(--lavender))',
        amber: 'hsl(var(--amber))',
      },
      borderRadius: {
        // Figma radius scale
        control: 'var(--radius-control)', // 5px  — buttons, inputs, chips
        card: 'var(--radius)', // 10px — cards, panels
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 5px)',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      fontFamily: {
        sans: ['var(--font-heebo)', 'system-ui', 'sans-serif'],
        display: ['var(--font-heebo)', 'system-ui', 'sans-serif'],
        ui: ['var(--font-poppins)', 'var(--font-heebo)', 'system-ui', 'sans-serif'],
        arabic: ['var(--font-cairo)', 'var(--font-heebo)', 'sans-serif'],
      },
      fontSize: {
        // Figma type ramp: 12 / 13 / 14 / 16 / 21 / 25 / 28 / 40 / 50 / 80
        '2xs': ['0.6875rem', { lineHeight: '1rem' }], // 11
        xs: ['0.75rem', { lineHeight: '1.375rem' }], // 12 / 22
        sm: ['0.8125rem', { lineHeight: '1.25rem' }], // 13 / 20
        base: ['0.875rem', { lineHeight: '1.375rem' }], // 14 / 22  <- Figma body
        md: ['1rem', { lineHeight: '1.5rem' }], // 16 / 24
        lg: ['1.3125rem', { lineHeight: '1.75rem' }], // 21
        xl: ['1.5625rem', { lineHeight: '2rem' }], // 25
        '2xl': ['1.75rem', { lineHeight: '2.25rem' }], // 28
        '3xl': ['2.125rem', { lineHeight: '2.5rem' }], // 34
        '4xl': ['2.5rem', { lineHeight: '2.875rem' }], // 40
        '5xl': ['3.125rem', { lineHeight: '3.5rem' }], // 50 <- Figma h1
        '6xl': ['4rem', { lineHeight: '4.25rem' }], // 64
        '7xl': ['5rem', { lineHeight: '5.25rem' }], // 80 <- Figma display
      },
      spacing: {
        section: '5.5rem', // vertical rhythm between homepage sections
        'section-sm': '3.5rem',
      },
      boxShadow: {
        // The signature card shadow — 30 occurrences in the Figma.
        card: '0 4px 20px 0 hsl(var(--accent) / 0.10)',
        'card-hover': '0 12px 32px 0 hsl(var(--accent) / 0.18)',
        soft: '0 1px 4px 0 rgb(0 0 0 / 0.05)',
        elevated: '0 20px 30px 0 rgb(0 0 0 / 0.05)',
        navy: '0 17px 40px 0 hsl(var(--secondary) / 0.30)',
        header: '0 1px 0 0 hsl(var(--border)), 0 4px 20px 0 hsl(var(--accent) / 0.06)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.3)', opacity: '0' },
          '100%': { transform: 'scale(1.3)', opacity: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.4s ease-out both',
        shimmer: 'shimmer 1.6s infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('tailwindcss-rtl')],
};

export default config;
