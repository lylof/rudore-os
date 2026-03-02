/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        rudore: {
          bg: 'var(--app-bg)',
          panel: 'var(--panel-bg)',
          sidebar: 'var(--sidebar-bg)',
          text: 'var(--text-main)',
          'text-secondary': 'var(--text-secondary)',
          'text-disabled': 'var(--text-disabled)',
          orange: '#FC532A',
          'orange-hover': '#FF6B42',
          'orange-active': '#E43B12',
          success: 'var(--rudore-success)',
          warning: 'var(--rudore-warning)',
          error: 'var(--rudore-error)',
          info: 'var(--rudore-info)',
        }
      },
      fontFamily: {
        sans: ['"Google Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        header: ['"Bricolage Grotesque"', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        'page-title': ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '800' }],
        'section-title': ['14px', { lineHeight: '1.5', letterSpacing: '0.1em', fontWeight: '400' }],
        'card-title': ['11px', { lineHeight: '1.5', letterSpacing: '0.12em', fontWeight: '400' }],
        'large-value': ['48px', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '800' }],
        'medium-value': ['36px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
        'body-text': ['14px', { lineHeight: '1.6', letterSpacing: '0', fontWeight: '400' }],
        'caption-label': ['11px', { lineHeight: '1.4', letterSpacing: '0.08em', fontWeight: '300' }],
      },
      borderRadius: {
        none: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        badge: '2px',
      },
      boxShadow: {
        'simple': '0 4px 12px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
