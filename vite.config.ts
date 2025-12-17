import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from 'vite-plugin-pwa';
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths(),
    mkcert(),
    VitePWA({
      base: '/',
      devOptions: {
        enabled: true, // Permite testar o PWA no modo 'npm run dev'
        type: 'module',
      },
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg','pwa-512-512.png','pwa-192-192.png'],
      manifest: {
        name: 'Catalogo Patrimonio',
        short_name: 'RR-App',
        description: 'Aplicação construída com React Router Framework Mode',
        theme_color: '#000000', // Cor da barra de status no mobile
        background_color: '#ffffff', // Cor de fundo do splash screen
        display: 'standalone', // Faz o app abrir sem a barra do navegador
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        sourcemap: true, // Isso ajuda MUITO no debug sem quebrar o tipo
        cleanupOutdatedCaches: true, // Recomendado para evitar conflitos de versão
        navigateFallback: null,
        globPatterns: ['**/*.{js,css,png,svg,ico,json,woff,woff2}'],
        runtimeCaching: [
          {
            // 3. Captura qualquer navegação de página (ex: /dashboard, /perfil)
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst', // Tenta sempre o servidor antes, para ter o HTML atualizado
            options: {
              cacheName: 'html-cache',
              networkTimeoutSeconds: 3, // Se o servidor demorar, ele desiste e tenta cache
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.data'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'router-data-cache',
            },
          },
        ],
      }
    })
  ],
});
