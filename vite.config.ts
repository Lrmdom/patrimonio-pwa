import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths(),
    VitePWA({
      devOptions: {
        enabled: true, // Permite testar o PWA no modo 'npm run dev'
        type: 'module',
      },
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg','pwa-512-512.png','pwa-192-192.png'],
      manifest: {
        name: 'Catalogo Patrimonio',
        short_name: 'C-Patrimonio',
        description: 'Aplicação Catalog patrimonio',
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
            purpose: 'any'
          },
          {
            src: 'pwa-512-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: 'screenshot-desktop.png', // Deve estar na pasta /public
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Vista de Desktop do Catálogo'
          },
          {
            src: 'screenshot-mobile.png', // Deve estar na pasta /public
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Vista de Telemóvel do Catálogo'
          }
        ]
      },
      workbox: {
        sourcemap: true, // Isso ajuda MUITO no debug sem quebrar o tipo
        cleanupOutdatedCaches: true, // Recomendado para evitar conflitos de versão
        navigateFallback: null,
        globPatterns: ['**/*.{js,css,html,png,svg,ico,json,woff,woff2}'],
        runtimeCaching: [
          {
            // 3. Captura qualquer navegação de página (ex: /dashboard, /perfil)
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkOnly', // Tenta sempre o servidor antes, para ter o HTML atualizado
            options: {
              backgroundSync: {
                name: 'htmlCacheQueue',
                options: {
                  maxRetentionTime: 24 * 60
                }
              },
              cacheName: 'html-cache',
              //networkTimeoutSeconds: 3, // Se o servidor demorar, ele desiste e tenta cache
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.data'),
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'routerCacheQueue',
                options: {
                  maxRetentionTime: 24 * 60
                }
              },
              cacheName: 'router-data-cache',
            },
          },
        ],
      }
    })
  ],
  server: {
    host: true
  }
});
