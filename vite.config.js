import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'SIMPATIK - Imunisasi',
        short_name: 'SIMPATIK',
        description: 'Sistem Informasi Imunisasi',
        theme_color: '#0f460b',
        background_color: '#f8f9fa',
        display: 'standalone',
        icons: [
          { src: '/favicon.ico', sizes: '64x64', type: 'image/x-icon' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 5
            }
          }
        ]
      }
    })
  ]
})
