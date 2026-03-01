/**
 * Componente otimizado para markers do património
 * Usa memoização e icons customizados eficientes
 */

import React, { useMemo, useCallback } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { MAP_CONFIG, getMarkerColor } from '~/config/map';
import { APP_CONFIG, formatDistance } from '~/config/constants';

interface HeritageItem {
  _id: string;
  title: string;
  coordenadas?: { lat: number; lng: number } | null;
  tipo?: { titulo: string };
  classificacao?: { titulo: string };
  audioNarracao?: {
    fileKey: string;
    contentType: string;
    url: string;
  };
  galeria?: Array<{
    _key: string;
    url?: string;
    ficheiro?: { asset: { _ref: string } }
  }>;
}

interface HeritageMarkersProps {
  items: HeritageItem[];
  userPosition?: [number, number] | null;
  onMarkerClick?: (item: HeritageItem) => void;
  onAudioPlay?: (item: HeritageItem) => void;
  onAudioPause?: () => void;
  isAudioPlaying?: boolean;
  currentAudioId?: string | null;
  activeMarkerId?: string | null;
}

export function HeritageMarkers({
  items,
  userPosition,
  onMarkerClick,
  onAudioPlay,
  onAudioPause,
  isAudioPlaying = false,
  currentAudioId = null,
  activeMarkerId = null
}: HeritageMarkersProps) {
  // Memoizar icons para performance
  const customIcons = useMemo(() => {
    const icons: Record<string, L.DivIcon> = {};
    
    Object.entries(MAP_CONFIG.MARKERS.COLORS).forEach(([key, color]) => {
      icons[key] = L.divIcon({
        className: `heritage-marker heritage-marker-${key}`,
        html: `
          <div class="marker-container">
            <div class="marker-dot" style="background-color: ${color};"></div>
            <div class="marker-ring" style="border-color: ${color};"></div>
          </div>
        `,
        iconSize: [...MAP_CONFIG.MARKERS.SIZES.MEDIUM] as [number, number],
        iconAnchor: [10, 10],
        popupAnchor: [0, -10],
        tooltipAnchor: [0, -10]
      });
    });

    // Icon especial para user location
    icons.user = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div class="user-location-container">
          <div class="pulse-ring"></div>
          <div class="user-dot">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="white">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [...MAP_CONFIG.MARKERS.SIZES.LARGE] as [number, number],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });

    return icons;
  }, []);

  // Memoizar items válidos
  const validItems = useMemo(() => {
    return items.filter(item => 
      item.coordenadas && 
      typeof item.coordenadas.lat === 'number' && 
      typeof item.coordenadas.lng === 'number'
    );
  }, [items]);

  // Handler para clique no marker
  const handleMarkerClick = useCallback((item: HeritageItem) => {
    onMarkerClick?.(item);
  }, [onMarkerClick]);

  // Handler para áudio
  const handleAudioToggle = useCallback((e: React.MouseEvent, item: HeritageItem) => {
    e.stopPropagation();
    
    if (currentAudioId === item._id && isAudioPlaying) {
      onAudioPause?.();
    } else {
      onAudioPlay?.(item);
    }
  }, [currentAudioId, isAudioPlaying, onAudioPlay, onAudioPause]);

  return (
    <>
      {validItems.map((item) => {
        const color = getMarkerColor(item.classificacao?.titulo);
        const icon = customIcons[color] || customIcons.local;
        const isActive = activeMarkerId === item._id;
        const distance = userPosition ? 
          Math.round(getDistance(userPosition[0], userPosition[1], item.coordenadas!.lat, item.coordenadas!.lng)) : 
          null;

        return (
          <Marker
            key={item._id}
            position={[item.coordenadas!.lat, item.coordenadas!.lng]}
            icon={icon}
            eventHandlers={{
              click: () => handleMarkerClick(item)
            }}
            zIndexOffset={isActive ? 1000 : 0}
          >
            <Popup 
              autoClose={false}
              closeOnClick={false}
              className="heritage-popup"
            >
              <div className="w-64 bg-white rounded-lg overflow-hidden shadow-lg">
                {/* Imagem */}
                {item.galeria && item.galeria[0]?.url ? (
                  <div className="w-full h-28 overflow-hidden bg-gray-100">
                    <img 
                      src={`${item.galeria[0].url}?w=300&h=200&fit=crop&auto=format&q=75`} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="w-full h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                )}

                {/* Conteúdo */}
                <div className="p-3">
                  <div className="mb-2">
                    <h4 className="font-bold text-sm leading-tight text-gray-800 mb-1">
                      {item.title}
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[7px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase font-bold">
                        {item.tipo?.titulo || 'Património'}
                      </span>
                      {item.classificacao?.titulo && (
                        <span className="text-[7px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded uppercase font-bold">
                          {item.classificacao.titulo}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Áudio */}
                  {item.audioNarracao?.fileKey && (
                    <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 mb-2">
                      <button
                        onClick={(e) => handleAudioToggle(e, item)}
                        className="w-full flex items-center gap-3 text-left"
                      >
                        <div className="bg-blue-600 text-white rounded-full p-2 shadow-sm flex-shrink-0">
                          {currentAudioId === item._id && isAudioPlaying ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                            </svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] font-bold text-blue-900 uppercase">Narração</span>
                          <span className="text-[8px] text-blue-600 truncate">
                            {currentAudioId === item._id && isAudioPlaying ? 'A reproduzir...' : 'Ouvir história'}
                          </span>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <Link 
                      to={`/heritages/${item._id}`}
                      className="text-blue-600 font-black text-[9px] uppercase hover:text-blue-700 transition-colors"
                    >
                      Detalhes →
                    </Link>
                    
                    {distance !== null && (
                      <span className="text-[9px] font-medium text-gray-400">
                        {formatDistance(distance)}
                      </span>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // AR functionality will be added later
                        console.log('AR view for:', item._id);
                      }}
                      className="bg-black text-white px-2 py-1 rounded text-[8px] font-bold flex items-center gap-1 hover:bg-gray-800 transition-colors"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                        <path d="M7 2h10l3 5v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7l3-5zm1 2l-2 3h12l-2-3H8z"/>
                      </svg>
                      VER EM AR
                    </button>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

// Helper function para cálculo de distância (se não existir no geoUtilities)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
