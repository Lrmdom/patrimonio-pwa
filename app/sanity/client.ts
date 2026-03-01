import { createClient } from "@sanity/client";

declare global {
  interface Window {
    ENV: {
      PUBLIC_SANITY_PROJECT_ID: string;
      PUBLIC_SANITY_DATASET: string;
      PUBLIC_SANITY_STUDIO_URL: string;
    };
  }
}

const env = typeof document === "undefined" ? process.env : window.ENV;

console.log('🔧 Sanity client config:', {
  projectId: env?.PUBLIC_SANITY_PROJECT_ID || import.meta.env.VITE_SANITY_STUDIO_PROJECT_ID,
  dataset: env?.PUBLIC_SANITY_DATASET || import.meta.env.VITE_SANITY_STUDIO_DATASET,
  studioUrl: env?.PUBLIC_SANITY_STUDIO_URL || import.meta.env.VITE_SANITY_STUDIO_URL,
});

export const client = createClient({
  projectId: env?.PUBLIC_SANITY_PROJECT_ID || import.meta.env.VITE_SANITY_STUDIO_PROJECT_ID,
  dataset: env?.PUBLIC_SANITY_DATASET || import.meta.env.VITE_SANITY_STUDIO_DATASET,
  apiVersion: "2024-03-07",
  useCdn: false,
  stega: {
    studioUrl: env?.PUBLIC_SANITY_STUDIO_URL || import.meta.env.VITE_SANITY_STUDIO_URL,
    // Força Stega a codificar tudo em desenvolvimento
    enabled: import.meta.env.DEV,
    // Configuração adicional para Visual Editing
    filter: (props: any) => {
      // Permite que todos os elementos sejam editáveis
      console.log('🎨 Stega filter called with:', props);
      return true;
    },
  },
});
