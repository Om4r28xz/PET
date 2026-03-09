import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/nutrition': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/medical': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
