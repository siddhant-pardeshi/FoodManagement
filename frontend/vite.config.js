import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forward /api calls to the local API server (npm run dev:api).
    proxy: {
      '/api': 'http://localhost:3005',
    },
  },
})
