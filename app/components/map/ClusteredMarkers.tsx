/**
 * Componente de clustering para markers
 * Melhora performance quando há muitos pontos
 */

import React, { useMemo } from 'react';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { MAP_CONFIG, getMarkerColor } from '~/config/map';
import { APP_CONFIG, formatDistance } from '~/config/constants';
import { getDistance } from '~/utils/geoUtilities';

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

interface ClusteredMarkersProps {
  items: HeritageItem[];
  userPosition?: [number, number] | null;
  onMarkerClick?: (item: HeritageItem) => void;
  onAudioPlay?: (item: HeritageItem) => void;
  onAudioPause?: () => void;
  isAudioPlaying?: boolean;
  currentAudioId?: string | null;
  enableClustering?: boolean;
  maxZoom?: number;
}

export function ClusteredMarkers({
  items,
  userPosition,
  onMarkerClick,
  onAudioPlay,
  onAudioPause,
  isAudioPlaying = false,
  currentAudioId = null,
  enableClustering = true,
  maxZoom = 15
}: ClusteredMarkersProps) {
  // Memoizar items válidos
  const validItems = useMemo(() => {
    return items.filter(item => 
      item.coordenadas && 
      typeof item.coordenadas.lat === 'number' && 
      typeof item.coordenadas.lng === 'number'
    );
  }, [items]);

  // Memoizar icons customizados
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
        popupAnchor: [0, -10]
      });
    });

    return icons;
  }, []);

  // Custom icon para clusters
  const createClusterIcon = (cluster: any) => {
    const count = cluster.getChildCount();
    let size = 'small';
    let className = 'cluster-small';
    
    if (count > 20) {
      size = 'large';
      className = 'cluster-large';
    } else if (count > 10) {
      size = 'medium';
      className = 'cluster-medium';
    }

    return L.divIcon({
      html: `<div class="${className}">
        <span>${count}</span>
      </div>`,
      className: 'marker-cluster',
      iconSize: size === 'small' ? [30, 30] : size === 'medium' ? [40, 40] : [50, 50],
      iconAnchor: [15, 15]
    });
  };

  // Handler para clique no marker
  const handleMarkerClick = (item: HeritageItem) => {
    onMarkerClick?.(item);
  };

  // Handler para áudio
  const handleAudioToggle = (e: React.MouseEvent, item: HeritageItem) => {
    e.stopPropagation();
    
    if (currentAudioId === item._id && isAudioPlaying) {
      onAudioPause?.();
    } else {
      onAudioPlay?.(item);
    }
  };

  // Renderizar markers individuais
  const renderMarkers = () => {
    return validItems.map((item) => {
      const color = getMarkerColor(item.classificacao?.titulo);
      const icon = customIcons[color] || customIcons.local;
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
    });
  };

  // Se clustering não estiver habilitado ou tiver poucos pontos, renderizar normalmente
  if (!enableClustering || validItems.length < APP_CONFIG.PERFORMANCE.MAX_MARKERS_BEFORE_CLUSTERING) {
    return <>{renderMarkers()}</>;
  }

  // Com clustering
  return (
    <MarkerClusterGroup
      chunkedLoading={true}
      maxClusterRadius={40}
      spiderfyOnMaxZoom={true}
      showCoverageOnHover={true}
      zoomToBoundsOnClick={true}
      iconCreateFunction={createClusterIcon}
      spiderfyDistanceMultiplier={2}
      maxZoom={maxZoom}
    >
      {renderMarkers()}
    </MarkerClusterGroup>
  );
}

// CSS para clusters (adicionar ao map.css)
export const clusterCSS = `
.marker-cluster {
  background: rgba(37, 99, 235, 0.8);
  border-radius: 50%;
  color: white;
  font-weight: bold;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.marker-cluster:hover {
  transform: scale(1.1);
  background: rgba(37, 99, 235, 1);
}

.cluster-small {
  width: 30px;
  height: 30px;
  font-size: 12px;
}

.cluster-medium {
  width: 40px;
  height: 40px;
  font-size: 14px;
  background: rgba(239, 68, 68, 0.8);
}

.cluster-medium:hover {
  background: rgba(239, 68, 68, 1);
}

.cluster-large {
  width: 50px;
  height: 50px;
  font-size: 16px;
  background: rgba(16, 185, 129, 0.8);
}

.cluster-large:hover {
  background: rgba(16, 185, 129, 1);
}
`;
