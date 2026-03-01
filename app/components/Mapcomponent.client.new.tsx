/**
 * Componente de mapa refatorado e otimizado
 * Usa hooks customizados, memoização e componentes modulares
 */

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import ARPanel from './ARPanel';

// Import otimizados
import { MAP_CONFIG } from '~/config/map';
import { APP_CONFIG } from '~/config/constants';
import { useGeolocation } from '~/hooks/useGeolocation';
import { useProximityDetection } from '~/hooks/useProximityDetection';
import { MapControls, GPSControl, GPSInfo } from './map/MapControls';
import { HeritageMarkers } from './map/HeritageMarkers';
import { ClusteredMarkers } from './map/ClusteredMarkers';
import { MapErrorBoundary } from './ui/MapErrorBoundary';
import { MapSkeleton } from './ui/MapSkeleton';
import { getDistance } from '~/utils/geoUtilities';
import './map/map.css';

export interface LimiteAdministrativo {
    id: number;
    nome_freguesia: string;
    nome_concelho: string;
    codigo_ine: string;
    geometria: GeoJSON.GeometryObject | null;
    cor_area: string | null;
}

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

interface MapProps {
    limites: LimiteAdministrativo[];
    bucketData: HeritageItem[];
    center: L.LatLngExpression;
    zoom: number;
    defaultLayer?: 'osm' | 'satellite' | 'terrain';
}

// Componente para recentrar automaticamente
function RecenterAutomatically({ coords }: { coords: L.LatLngExpression }) {
    const map = useMap();
    React.useEffect(() => {
        if (coords) map.setView(coords, map.getZoom(), { animate: true });
    }, [coords, map]);
    return null;
}

// User location icon memoizado
const userLocationIcon = useMemo(() => L.divIcon({
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
}), []);

export const MapComponentClient: React.FC<MapProps> = ({ 
    limites, 
    bucketData, 
    center, 
    zoom, 
    defaultLayer = 'osm' 
}) => {
    // States
    const [isTracking, setIsTracking] = useState(true);
    const [activeARItem, setActiveARItem] = useState<HeritageItem | null>(null);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [currentAudioId, setCurrentAudioId] = useState<string | null>(null);
    const [audioEnabled, setAudioEnabled] = useState(false);
    
    // Refs
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Hooks customizados
    const geolocation = useGeolocation();
    const proximityDetection = useProximityDetection(
        bucketData,
        useCallback((item: any) => {
            // Entrou na proximidade - abrir popup e tocar áudio
            console.log('Entrou na proximidade:', item.item.title);
            if (audioEnabled && item.item.audioNarracao?.fileKey) {
                handleAudioPlay(item.item);
            }
        }, [audioEnabled]),
        useCallback((item: any) => {
            // Saiu da proximidade - parar áudio
            console.log('Saiu da proximidade:', item.item.title);
            if (currentAudioId === item.item._id) {
                handleAudioPause();
            }
        }, [currentAudioId])
    );

    // Memoizar items válidos
    const validItems = useMemo(() => {
        return bucketData.filter(item => 
            item.coordenadas && 
            typeof item.coordenadas.lat === 'number' && 
            typeof item.coordenadas.lng === 'number'
        );
    }, [bucketData]);

    // Handlers
    const handleAudioPlay = useCallback((item: HeritageItem) => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.preload = 'none';

            audioRef.current.addEventListener('ended', () => {
                setIsAudioPlaying(false);
                setCurrentAudioId(null);
            });

            audioRef.current.addEventListener('pause', () => {
                setIsAudioPlaying(false);
            });

            audioRef.current.addEventListener('play', () => {
                setIsAudioPlaying(true);
            });
        }

        const audio = audioRef.current;
        const audioUrl = `${APP_CONFIG.R2_URL}/${item.audioNarracao!.fileKey}`;

        if (currentAudioId === item._id && isAudioPlaying) {
            audio.pause();
            setCurrentAudioId(null);
            setIsAudioPlaying(false);
            return;
        }

        if (currentAudioId && currentAudioId !== item._id) {
            audio.pause();
        }

        if (audio.src !== audioUrl) {
            audio.src = audioUrl;
        }

        audio.play()
            .then(() => {
                setCurrentAudioId(item._id);
                setIsAudioPlaying(true);
            })
            .catch(error => {
                console.error('Erro áudio:', error);
            });
    }, [currentAudioId, isAudioPlaying]);

    const handleAudioPause = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            setCurrentAudioId(null);
            setIsAudioPlaying(false);
        }
    }, []);

    const handleEnableAudio = useCallback(() => {
        if (!audioEnabled && audioRef.current) {
            audioRef.current.play().then(() => {
                audioRef.current?.pause();
                setAudioEnabled(true);
            }).catch(() => console.log("Interação necessária"));
        }
    }, [audioEnabled]);

    const handleOpenAR = useCallback((item: HeritageItem) => {
        setActiveARItem(item);
    }, []);

    const handleCloseAR = useCallback(() => {
        setActiveARItem(null);
    }, []);

    const handleMarkerClick = useCallback((item: HeritageItem) => {
        console.log('Marker clicked:', item.title);
        // Lógica adicional para clique no marker
    }, []);

    // Verificar proximidade quando a posição GPS mudar
    React.useEffect(() => {
        if (geolocation.position) {
            proximityDetection.checkProximity(geolocation.position);
        }
    }, [geolocation.position, proximityDetection]);

    // Memoizar GeoJSON features
    const geoJSONFeatures = useMemo(() => {
        return limites.map((lim) => {
            if (!lim.geometria) return null;
            
            const feature = {
                type: 'Feature' as const,
                geometry: lim.geometria,
                properties: { 
                    nome: lim.nome_freguesia, 
                    cor_fundo: lim.cor_area || MAP_CONFIG.MARKERS.COLORS.LOCAL 
                }
            };
            return feature;
        }).filter(Boolean);
    }, [limites]);

    // Loading state
    if (geolocation.isLoading) {
        return <MapSkeleton />;
    }

    // Error state
    if (geolocation.error) {
        return (
            <MapErrorBoundary>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="text-red-800 font-semibold">Erro de Geolocalização</h3>
                    <p className="text-red-600 text-sm mt-1">{geolocation.error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded text-sm"
                    >
                        Recarregar
                    </button>
                </div>
            </MapErrorBoundary>
        );
    }

    return (
        <MapErrorBoundary>
            <div className="relative w-full h-full border rounded-lg overflow-hidden bg-white shadow-xl">
                {/* O mapa é envolvido numa div que apenas ESCONDE (hidden) em vez de ser removida do DOM */}
                <div className={`w-full h-full flex flex-col ${activeARItem ? 'hidden' : 'block'}`}>
                    {/* Header com controls */}
                    <div className="p-3 bg-white border-b flex justify-between items-center z-[1000]">
                        <GPSControl
                            isActive={isTracking}
                            onToggle={() => setIsTracking(!isTracking)}
                            userPosition={geolocation.position}
                        />
                    </div>

                    {/* Container do mapa */}
                    <div className="relative flex-grow h-[70vh]">
                        <MapContainer 
                            center={center} 
                            zoom={zoom} 
                            style={{ height: '100%', width: '100%' }}
                            bounds={MAP_CONFIG.BOUNDS.SOUTHWEST && MAP_CONFIG.BOUNDS.NORTHEAST ? [
                                MAP_CONFIG.BOUNDS.SOUTHWEST, 
                                MAP_CONFIG.BOUNDS.NORTHEAST
                            ] : undefined}
                        >
                            {/* Controles do mapa */}
                            <MapControls 
                                showLayers={true} 
                                showScale={true} 
                                defaultLayer={defaultLayer}
                            />

                            {/* Auto-recenter se tracking ativo */}
                            {geolocation.position && isTracking && (
                                <RecenterAutomatically coords={geolocation.position} />
                            )}

                            {/* Marker da posição do utilizador */}
                            {geolocation.position && (
                                <Marker 
                                    position={geolocation.position} 
                                    icon={userLocationIcon} 
                                    zIndexOffset={1000} 
                                />
                            )}

                            {/* Markers do património com clustering automático */}
                            <ClusteredMarkers
                                items={validItems}
                                userPosition={geolocation.position}
                                onMarkerClick={handleMarkerClick}
                                onAudioPlay={handleAudioPlay}
                                onAudioPause={handleAudioPause}
                                isAudioPlaying={isAudioPlaying}
                                currentAudioId={currentAudioId}
                                enableClustering={validItems.length >= APP_CONFIG.PERFORMANCE.MAX_MARKERS_BEFORE_CLUSTERING}
                                maxZoom={MAP_CONFIG.ZOOM.MAX}
                            />

                            {/* Limites administrativos */}
                            {geoJSONFeatures.map((feature, index) => (
                                feature && (
                                    <GeoJSON
                                        key={`geo-${index}`}
                                        data={feature}
                                        style={() => ({
                                            fillColor: feature.properties.cor_fundo,
                                            color: '#444444',
                                            weight: 1,
                                            fillOpacity: 0.4,
                                            dashArray: '5,5'
                                        })}
                                    />
                                )
                            ))}
                        </MapContainer>

                        {/* GPS Info Overlay */}
                        <GPSInfo
                            position={geolocation.position}
                            accuracy={geolocation.accuracy}
                            isLoading={geolocation.isLoading}
                            error={geolocation.error}
                        />
                    </div>
                </div>

                {/* AR Panel */}
                {activeARItem && (
                    <ARPanel 
                        items={validItems} 
                        onClose={handleCloseAR} 
                    />
                )}

                {/* Audio enable overlay */}
                {!audioEnabled && (
                    <div 
                        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]"
                        onClick={handleEnableAudio}
                    >
                        <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
                            <div className="text-blue-600 text-4xl mb-4">🎵</div>
                            <h3 className="text-lg font-semibold mb-2">Ativar Áudio</h3>
                            <p className="text-gray-600 text-sm mb-4">
                                Clique em qualquer lugar para ativar as narrações de áudio do património
                            </p>
                            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                Ativar Áudio
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </MapErrorBoundary>
    );
};

export default MapComponentClient;
