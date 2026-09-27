import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Tailwind v3.3.5 is handled via PostCSS — no Vite plugin needed
export default defineConfig({
  plugins: [react()],
  server: {
    // No port forced — Vite auto-picks 5173 (or 5174 if busy)
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
