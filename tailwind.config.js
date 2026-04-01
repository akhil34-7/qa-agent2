/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        surface: '#12121a',
        border: '#1e1e2e',
        accent: '#6c63ff',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        text: {
          primary: '#e2e8f0',
          muted: '#64748b'
        },
        phase: {
          analyst: '#6c63ff',
          architect: '#06b6d4',
          engineer: '#10b981',
          sentinel: '#f59e0b',
          executor: '#3b82f6',
          healer: '#ec4899',
          scribe: '#8b5cf6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
