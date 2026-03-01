import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';
import './i18n'; // Initialize i18n

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});

// Isto regista automaticamente o sw.js que o Vite gera a partir do teu src/sw.js
if (import.meta.env.PROD) {
    registerSW({
        onNeedRefresh() {
            console.log('Nova versão disponível!');
        },
        onOfflineReady() {
            console.log('App pronta para trabalhar offline.');
        },
    });
}

