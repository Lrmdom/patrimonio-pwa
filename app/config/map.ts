/**
 * Configuração centralizada para o componente de mapa
 * Melhora maintainability e performance
 */

export const MAP_CONFIG = {
  TILES: {
    OSM: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    SATELLITE: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    TERRAIN: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
  },
  PROXIMITY: {
    RADIUS: 50, // metros
    EXIT_RADIUS: 70,
    CHECK_INTERVAL: 1000
  },
  MARKERS: {
    COLORS: {
      NATIONAL: "#e11d48",
      REGIONAL: "#2563eb", 
      LOCAL: "#10b981"
    },
    SIZES: {
      SMALL: [14, 14],
      MEDIUM: [20, 20],
      LARGE: [30, 30]
    }
  },
  BOUNDS: {
    // Tavira area bounds for optimization
    SOUTHWEST: [37.0, -7.8] as [number, number],
    NORTHEAST: [37.3, -7.5] as [number, number]
  },
  ZOOM: {
    MIN: 10,
    MAX: 18,
    DEFAULT: 15
  }
} as const;

// Helper functions para obter configurações dinamicamente
export const getMarkerColor = (classification?: string): string => {
  switch (classification?.toLowerCase()) {
    case 'monumento nacional':
      return MAP_CONFIG.MARKERS.COLORS.NATIONAL;
    case 'interesse público':
      return MAP_CONFIG.MARKERS.COLORS.REGIONAL;
    default:
      return MAP_CONFIG.MARKERS.COLORS.LOCAL;
  }
};

export const isWithinProximity = (distance: number): boolean => {
  return distance <= MAP_CONFIG.PROXIMITY.RADIUS;
};

export const hasExitedProximity = (distance: number): boolean => {
  return distance > MAP_CONFIG.PROXIMITY.EXIT_RADIUS;
};
