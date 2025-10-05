import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Detect if running locally or on Vercel
const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: !isProduction
      ? {
        '/predict': 'http://127.0.0.1:5001', // local Flask backend
      }
      : undefined,
  },
})
