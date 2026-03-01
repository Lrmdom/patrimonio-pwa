/**
 * Sanity Configuration - Centraliza variáveis de ambiente
 * Garante type safety e fallbacks seguros
 */

export const SANITY_CONFIG = {
  // Project Configuration
  PROJECT_ID: import.meta.env.VITE_SANITY_STUDIO_PROJECT_ID || 'ow7bBpvHZ',
  DATASET: import.meta.env.VITE_SANITY_STUDIO_DATASET || 'production',
  
  // API Configuration
  API_VERSION: import.meta.env.VITE_SANITY_API_VERSION || '2024-03-07',
  USE_CDN: import.meta.env.NODE_ENV === 'production',
  CDN_URL: import.meta.env.VITE_SANITY_CDN_URL || 'https://cdn.sanity.io',
  
  // Studio URLs
  STUDIO_URL: import.meta.env.VITE_SANITY_STUDIO_URL || 'https://moto-rent-studio.sanity.studio/',
  
  // Visual Editing Configuration
  VISUAL_EDITING_ENABLED: import.meta.env.VITE_SANITY_VISUAL_EDITING_ENABLED === 'true',
  STEGA_ENABLED: import.meta.env.VITE_SANITY_STUDIO_STEGA_ENABLED === 'true',
  
  // Preview URLs
  PREVIEW_URL: import.meta.env.VITE_SANITY_PREVIEW_URL || 'http://localhost:5173',
  PRODUCTION_URL: import.meta.env.VITE_SANITY_PRODUCTION_URL || 'https://heritage-catalog.vercel.app',
  
  // Draft Mode Configuration
  DRAFT_MODE_URL: import.meta.env.VITE_SANITY_DRAFT_MODE_URL || 'http://localhost:5173/api/draft-mode',
  DRAFT_MODE_ENABLE: `${import.meta.env.VITE_SANITY_DRAFT_MODE_URL || 'http://localhost:5173/api/draft-mode'}/enable`,
  DRAFT_MODE_DISABLE: `${import.meta.env.VITE_SANITY_DRAFT_MODE_URL || 'http://localhost:5173/api/draft-mode'}/disable`,
  
  // Authentication
  VIEWER_TOKEN: import.meta.env.SANITY_VIEWER_TOKEN,
  
  // Helper functions
  isDraftMode: () => {
    if (typeof window === 'undefined') return false;
    return window.location.search.includes('draft=true') || 
           localStorage.getItem('sanity-draft-mode') === 'true';
  },
  
  enableDraftMode: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sanity-draft-mode', 'true');
    }
  },
  
  disableDraftMode: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sanity-draft-mode');
    }
  },
  
  // URL builders
  buildStudioUrl: (path?: string) => {
    const baseUrl = SANITY_CONFIG.STUDIO_URL.replace(/\/$/, '');
    return path ? `${baseUrl}/${path.replace(/^\//, '')}` : baseUrl;
  },
  
  buildPreviewUrl: (path?: string) => {
    const baseUrl = SANITY_CONFIG.PREVIEW_URL.replace(/\/$/, '');
    const draftParam = SANITY_CONFIG.isDraftMode() ? '?draft=true' : '';
    return path ? `${baseUrl}/${path.replace(/^\//, '')}${draftParam}` : `${baseUrl}${draftParam}`;
  },
  
  // Content source map configuration
  stegaConfig: {
    enabled: SANITY_CONFIG.STEGA_ENABLED,
    studioUrl: SANITY_CONFIG.STUDIO_URL,
    logger: import.meta.env.NODE_ENV === 'development',
  },
} as const;

// Type exports
export type SanityConfig = typeof SANITY_CONFIG;
export type DraftModeStatus = boolean;

// Environment validation
export const validateSanityConfig = () => {
  const required = ['PROJECT_ID', 'DATASET', 'VIEWER_TOKEN'];
  const missing = required.filter(key => !SANITY_CONFIG[key as keyof typeof SANITY_CONFIG]);
  
  if (missing.length > 0) {
    console.warn('Missing Sanity configuration:', missing);
    return false;
  }
  
  return true;
};

// Development helpers
if (import.meta.env.NODE_ENV === 'development') {
  console.log('Sanity Configuration:', {
    projectId: SANITY_CONFIG.PROJECT_ID,
    dataset: SANITY_CONFIG.DATASET,
    visualEditingEnabled: SANITY_CONFIG.VISUAL_EDITING_ENABLED,
    stegaEnabled: SANITY_CONFIG.STEGA_ENABLED,
    previewUrl: SANITY_CONFIG.PREVIEW_URL,
  });
}
