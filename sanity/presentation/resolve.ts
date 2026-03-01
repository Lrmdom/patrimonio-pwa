/**
 * Resolve configuration for Sanity Presentation Tool
 * Define onde os documentos aparecem no frontend
 */

import { defineLocations, PresentationPluginOptions } from 'sanity/presentation';

export const resolve: PresentationPluginOptions['resolve'] = {
  locations: {
    // Heritage Items - páginas individuais de património
    heritageItem: defineLocations({
      select: { 
        title: 'title', 
        slug: 'slug.current' 
      },
      resolve: (doc: any) => ({
        locations: [
          { 
            title: doc?.title || 'Património sem título', 
            href: `/heritage/${doc?.slug?.current || doc?._id}` 
          },
          { 
            title: 'Ver no Mapa', 
            href: `/?focus=${doc?._id}` 
          },
          { 
            title: 'Experiência AR', 
            href: `/ar/${doc?.slug?.current || doc?._id}` 
          },
        ],
      }),
    }),

    // Páginas genéricas (home, sobre, etc.)
    page: defineLocations({
      select: { 
        title: 'title', 
        slug: 'slug.current' 
      },
      resolve: (doc: any) => ({
        locations: [
          { 
            title: doc?.title || 'Página sem título', 
            href: `/${doc?.slug?.current || ''}` 
          },
          { 
            title: 'Ver no Mapa', 
            href: '/mapa' 
          },
        ],
      }),
    }),

    // Rotas turísticas
    tour: defineLocations({
      select: { 
        title: 'title', 
        slug: 'slug.current' 
      },
      resolve: (doc: any) => ({
        locations: [
          { 
            title: doc?.title || 'Rota sem título', 
            href: `/tour/${doc?.slug?.current || doc?._id}` 
          },
          { 
            title: 'Iniciar Tour', 
            href: `/tour/${doc?.slug?.current || doc?._id}/start` 
          },
        ],
      }),
    }),
  },
};
