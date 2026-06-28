import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  return {
    base: isProd ? '/tiropago/' : '/',
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['apple-touch-icon.png', 'icon-512.png'],
        manifest: {
          name: 'TIRO22',
          short_name: 'TIRO22',
          description: 'Entrenamientos de tiro olímpico con pistola y carabina .22 LR.',
          theme_color: '#081016',
          background_color: '#081016',
          display: 'standalone',
          orientation: 'portrait',
          start_url: isProd ? '/tiropago/' : '/',
          scope: isProd ? '/tiropago/' : '/',
          icons: [
            {
              src: isProd ? '/tiropago/icon-512.png' : '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'tiro22-pages'
              }
            },
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'tiro22-api',
                networkTimeoutSeconds: 3
              }
            }
          ]
        }
      })
    ],
    server: {
      host: '0.0.0.0',
      port: 5173
    }
  };
});
