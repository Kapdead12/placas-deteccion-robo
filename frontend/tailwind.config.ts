import type { Config } from 'tailwindcss';

// Lenguaje visual: consola de escaneo de placas (ANPR / cámara de seguridad).
// Fondo grafito tipo sala de control, ámbar para estado normal,
// rojo para placa reportada, verde para "sin reportes".
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: '#0a0b0d',
          900: '#111318',
          800: '#181b22',
          700: '#22262f',
          600: '#2e333f',
          500: '#3d4351',
        },
        amber: {
          400: '#ffb020',
          500: '#f59e0b',
        },
        alert: {
          DEFAULT: '#ef4444',
          soft: '#f871714d',
        },
        clear: {
          DEFAULT: '#22c55e',
          soft: '#22c55e4d',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Roboto Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      keyframes: {
        scanline: {
          '0%': { top: '0%' },
          '50%': { top: '100%' },
          '100%': { top: '0%' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        scanline: 'scanline 1.8s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
