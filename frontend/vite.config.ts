import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy only in development — on Vercel, rewrites handle /api/* routing
    proxy: mode === 'development' ? {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:8000', changeOrigin: true },
    } : {},
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
}))
