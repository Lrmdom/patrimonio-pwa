import { precacheAndRoute } from 'workbox-precaching';

// O Vite injeta aqui os ficheiros para a app funcionar offline
precacheAndRoute(self.__WB_MANIFEST);

// OUVIR a notificação que vem do Hono/Backend
self.addEventListener('push', (event) => {
    const data = event.data.json();

    self.registration.showNotification(data.title, {
        body: data.message,
        icon: '/pwa-192x192.png'
    });
});