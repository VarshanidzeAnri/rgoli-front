/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      // In dev the SPA calls /api on its own origin; Vite forwards to Laravel.
      proxy: {
        '/api': { target: env.VITE_PROXY_TARGET || 'http://localhost:8000', changeOrigin: true },
        '/storage': { target: env.VITE_PROXY_TARGET || 'http://localhost:8000', changeOrigin: true },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'charts'
            if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) return 'map'
            return undefined
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
      coverage: { provider: 'v8', include: ['src/**/*.{ts,tsx}'], exclude: ['src/test/**', 'src/**/*.test.*', 'src/i18n/locales/**'] },
    },
  }
})
