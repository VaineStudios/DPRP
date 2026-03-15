import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'DPRP Find Shelter',
        short_name: 'Find Shelter',
        description: 'Find your nearest emergency shelter',
        theme_color: '#dc2626',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html}'],
        runtimeCaching: [
          {
            urlPattern: /\/api\/recommend/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'shelter-recommendations',
              expiration: { maxEntries: 5, maxAgeSeconds: 3600 },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5175,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
