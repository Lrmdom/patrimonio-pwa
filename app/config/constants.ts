/**
 * Constantes centralizadas da aplicação Heritage Catalog
 * Melhora maintainability e evita hardcoded values
 */

export const APP_CONFIG = {
  // Cloudflare R2 CDN
  R2_URL: import.meta.env.VITE_R2_URL || "https://pub-72037178c35c4cb1b3448777a2c80f0a.r2.dev",
  
  // GPS Configuration
  GPS: {
    MIN_DISTANCE: 10, // metros
    MIN_TIME: 3000, // ms
    MAX_TIME: 15000, // ms
    DESIRED_ACCURACY: 10, // metros
    TIMEOUT: 10000, // ms
    MAX_AGE: 5000 // ms
  },
  
  // AR Configuration
  AR: {
    SUPPORTED_DEVICES: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
    MIN_ZOOM_LEVEL: 15,
    MAX_DISTANCE_MARKERS: 1000, // metros
    ORIENTATION_UPDATE_INTERVAL: 100 // ms
  },
  
  // Audio Configuration
  AUDIO: {
    AUTOPLAY_ENABLED: false, // Browser blocks autoplay
    FADE_DURATION: 300, // ms
    PRELOAD_ENABLED: true
  },
  
  // Performance Configuration
  PERFORMANCE: {
    MAX_MARKERS_BEFORE_CLUSTERING: 5, // Ativa clustering com 5+ markers
    DEBOUNCE_DELAY: 300, // ms
    CACHE_DURATION: 300000, // 5 minutes em ms
    LAZY_LOAD_THRESHOLD: 100 // ms
  },
  
  // UI Configuration
  UI: {
    TOAST_DURATION: 3000, // ms
    ANIMATION_DURATION: 200, // ms
    DEBOUNCE_SEARCH_DELAY: 500 // ms
  }
} as const;

// Types para melhor type safety
export type DeviceOrientation = {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  heading: number | null;
};

export type GPSPosition = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

export type ProximityItem = {
  id: string;
  distance: number;
  bearing: number;
  item: any; // HeritageItem
};

// Helper functions
export const isDeviceARCapable = (): boolean => {
  return APP_CONFIG.AR.SUPPORTED_DEVICES && 'deviceorientation' in window;
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

export const formatCoordinates = (lat: number, lng: number): string => {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};
