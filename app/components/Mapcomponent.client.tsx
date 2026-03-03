import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
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

// Ícones customizados para tipos de património
const heritageIcons: { [key: string]: string } = {
  "Arquitetura Religiosa": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2"><path d="M10 22V8h4v14h-4zm-2 0V6h8v16H8z"/><path d="M12 6V2l3 4h-6z"/><circle cx="12" cy="12" r="1"/></svg>`,
  "Arquitetura Militar": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2"><path d="M3 21V8h2V6h2V8h2V6h2V8h2V6h2V8h2V6h2V8h2v13H3z"/><path d="M7 12h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"/><path d="M5 10h2v2H5v-2zm4 0h2v2H9v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"/></svg>`,
  "Arquitetura Civil": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2"><path d="M4 6l2 2h2l-1 3h2l1 3h2l1-3h2l-1-3h2l2-2h-2l-1-2h-2l-1 2H9l-1-2H6l-1 2H4z"/></svg>`,
  "Património Arqueológico": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
  "Património Etnográfico": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>`,
  "Património Industrial": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  "Coleção Museológica": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  "Escultura e Estatuária": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2"><path d="M12 2c-1 0-1.5 .5-1.5 1.5v1.5c0 .5 .5 1 1 1s1-.5 1-1V4c0-.5-.5-1-1-1zM10 6v5c0 .5 .5 1 1 1h0.5v-6H10zM14 6v5c0 .5-.5 1-1 1h-0.5v-6H14zM11.5 12v4c0 .5 .5 1 1 1s1-.5 1-1v-4H11.5zM9.5 13v3c0 .5 .5 1 1 1h0.5v-4H9.5zM15.5 13v3c0 .5-.5 1-1 1h-0.5v-4H15.5z"/></svg>`,
  "Festividade e Ritual": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
};

const markerStyles: { [key: string]: { bg: string; stroke: string } } = {
  "Search list": { bg: "#3B82F6", stroke: "#FFFFFF" }, // blue-500
  "Arquitetura Religiosa": { bg: "#1E40AF", stroke: "#FF0000" }, // red
  "Arquitetura Militar": { bg: "#1E3A8A", stroke: "#00FF00" }, // green
  "Arquitetura Civil": { bg: "#2563EB", stroke: "#0000FF" }, // blue
  "Património Arqueológico": { bg: "#1D4ED8", stroke: "#FFFF00" }, // yellow
  "Património Etnográfico": { bg: "#3B82F6", stroke: "#FF00FF" }, // magenta
  "Património Industrial": { bg: "#1E3A8A", stroke: "#00FFFF" }, // cyan
  "Coleção Museológica": { bg: "#2563EB", stroke: "#FFA500" }, // orange
  "Escultura e Estatuária": { bg: "#1D4ED8", stroke: "#800080" }, // purple
  "Festividade e Ritual": { bg: "#3B82F6", stroke: "#FFC0CB" }, // pink
};

// Função para criar icons customizados
const createCustomIcon = (tipo: string | undefined) => {
  const tipoKey = tipo || 'Arquitetura Civil';
  const iconSvg = heritageIcons[tipoKey] || heritageIcons['Arquitetura Civil'];
  const style = markerStyles[tipoKey] || markerStyles['Arquitetura Civil'];
  
  return L.divIcon({
    className: 'custom-heritage-marker',
    html: `
      <div class="marker-container" style="background-color: ${style.bg}; border-color: ${style.stroke};">
        ${iconSvg}
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11]
  });
};

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
    coordenadas: { lat: number; lng: number } | null;
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

// Componente para controlar popups no nível do mapa
const PopupController: React.FC<{ activePopupId: string | null; setActivePopupId: (id: string | null) => void }> = ({ activePopupId, setActivePopupId }) => {
    const map = useMap();
    
    useEffect(() => {
        // Quando o activePopupId muda, fechar todos os popups
        map.eachLayer((layer: any) => {
            if (layer._popup && layer._popup.isOpen()) {
                layer._popup.close();
            }
        });
    }, [activePopupId, map]);
    
    return null;
};

// Componente para recentrar automaticamente
function RecenterAutomatically({ coords }: { coords: L.LatLngExpression }) {
    const map = useMap();
    useEffect(() => {
        if (coords) map.setView(coords, map.getZoom(), { animate: true });
    }, [coords, map]);
    return null;
}

export const MapcomponentClient: React.FC<MapProps> = ({
    limites, 
    bucketData, 
    center, 
    zoom, 
    defaultLayer = 'osm' 
}) => {
    // User location icon memoizado (agora dentro do componente)
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
        iconSize: [30, 30], // Valores fixos para evitar dependência de MAP_CONFIG
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
    }), []);
    // States
    const [isTracking, setIsTracking] = useState(true);
    const [activeARItem, setActiveARItem] = useState<HeritageItem | null>(null);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [currentAudioId, setCurrentAudioId] = useState<string | null>(null);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [activePopupId, setActivePopupId] = useState<string | null>(null);
    const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set(Object.keys(heritageIcons)));
    const [visiblePaths, setVisiblePaths] = useState<Set<string>>(new Set());
    const [routes, setRoutes] = useState<{ [key: string]: [number, number][] }>({});
    const [routingProfile, setRoutingProfile] = useState('walking');
    const [isRecalculatingRoutes, setIsRecalculatingRoutes] = useState(false);
    
    // Refs
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const markersRef = useRef<{ [key: string]: any }>({});

    // Handlers defined before hooks that use them
    const handleAudioPause = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            setCurrentAudioId(null);
            setIsAudioPlaying(false);
        }
    }, []);

    const handleAudioPlay = useCallback((item: HeritageItem) => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.addEventListener('ended', () => {
                setIsAudioPlaying(false);
                setCurrentAudioId(null);
            });
            audioRef.current.addEventListener('pause', () => setIsAudioPlaying(false));
            audioRef.current.addEventListener('play', () => setIsAudioPlaying(true));
        }

        const audio = audioRef.current;
        const audioUrl = `${APP_CONFIG.R2_URL}/${item.audioNarracao!.fileKey}`;

        if (currentAudioId === item._id && isAudioPlaying) {
            audio.pause();
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
            .catch(error => console.warn('Autoplay blocked or error:', error));
    }, [currentAudioId, isAudioPlaying]);

    // Função para alternar visibilidade dos tipos
    const toggleTypeVisibility = useCallback((tipo: string) => {
        setVisibleTypes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(tipo)) {
                newSet.delete(tipo);
            } else {
                newSet.add(tipo);
            }
            return newSet;
        });
    }, []);

    // Função para alternar visibilidade dos percursos
    const togglePathVisibility = useCallback((tipo: string) => {
        setVisiblePaths(prev => {
            const newSet = new Set(prev);
            if (newSet.has(tipo)) {
                newSet.delete(tipo);
            } else {
                newSet.add(tipo);
            }
            return newSet;
        });
    }, []);

    // Função para controlar popup único
    const handlePopupOpen = useCallback((markerId: string) => {
        // Simplesmente definir qual popup deve estar aberto
        setActivePopupId(markerId);
    }, []);

    // Hooks customizados
    const geolocation = useGeolocation();
    const proximityDetection = useProximityDetection(
        bucketData,
        useCallback((data: any) => {
            const item = data.item;
            if (activePopupId !== item._id) {
                setActivePopupId(item._id);
                
                if ("vibrate" in navigator) {
                    try { navigator.vibrate(200); } catch (e) {}
                }

                if (audioEnabled && item.audioNarracao?.fileKey) {
                    handleAudioPlay(item);
                }
            }
        }, [audioEnabled, handleAudioPlay, activePopupId]),
        useCallback((data: any) => {
            const item = data.item;
            if (activePopupId === item._id) {
                setActivePopupId(null);
            }
            if (currentAudioId === item._id) {
                handleAudioPause();
            }
        }, [activePopupId, currentAudioId, handleAudioPause])
    );

    // Memoizar items válidos
    const validItems = useMemo(() => {
        return bucketData.filter(item => 
            item.coordenadas && 
            typeof item.coordenadas.lat === 'number' && 
            typeof item.coordenadas.lng === 'number'
        );
    }, [bucketData]);

    // Handlers rest
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

    // Clear routes when profile changes
    React.useEffect(() => {
        setIsRecalculatingRoutes(true);
        setRoutes({});
    }, [routingProfile]);

    // Fetch routes along streets for visible paths
    React.useEffect(() => {
        let pending = visiblePaths.size;
        if (pending === 0) {
            setIsRecalculatingRoutes(false);
            return;
        }
        
        visiblePaths.forEach(async (tipo) => {
            if (routes[tipo]) {
                pending--;
                if (pending === 0) setIsRecalculatingRoutes(false);
                return; // already fetched
            }

            const points = bucketData.filter(item => 
                item.tipo?.titulo === tipo && 
                item.coordenadas && 
                typeof item.coordenadas.lat === 'number' && 
                typeof item.coordenadas.lng === 'number'
            );
            if (points.length < 2) {
                pending--;
                if (pending === 0) setIsRecalculatingRoutes(false);
                return;
            }

            // sort by distance to gps
            const sortedPoints = points.sort((a, b) => {
                if (!geolocation.position) return a.coordenadas!.lat - b.coordenadas!.lat; // fallback
                const distA = getDistance(geolocation.position[0], geolocation.position[1], a.coordenadas!.lat, a.coordenadas!.lng);
                const distB = getDistance(geolocation.position[0], geolocation.position[1], b.coordenadas!.lat, b.coordenadas!.lng);
                return distA - distB;
            });

            const coords = sortedPoints.map(p => [p.coordenadas!.lng, p.coordenadas!.lat]); // [lng, lat]

            try {
                const response = await fetch('/api/route', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ coordinates: coords, profile: routingProfile })
                });
                if (!response.ok) throw new Error('Proxy error');
                const data = await response.json();
                const geometry = data.features?.[0]?.geometry?.coordinates;
                if (geometry) {
                    const routeCoords: [number, number][] = geometry; // already [lat, lng] from backend
                    setRoutes(prev => ({ ...prev, [tipo]: routeCoords }));
                } else {
                    throw new Error('No geometry');
                }
            } catch (e) {
                console.warn('Route fetch failed for', tipo, e);
                // fallback to straight line
                const positions = sortedPoints.map(p => [p.coordenadas!.lat, p.coordenadas!.lng] as [number, number]);
                setRoutes(prev => ({ ...prev, [tipo]: positions }));
            }
            pending--;
            if (pending === 0) setIsRecalculatingRoutes(false);
        });
    }, [visiblePaths, bucketData, geolocation.position, routes, routingProfile]);

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

    // Memoizar polylines dos percursos
    const pathPolylines = useMemo(() => {
        const elements: React.ReactElement[] = [];
        visiblePaths.forEach(tipo => {
            const routePositions = routes[tipo];
            if (!routePositions || routePositions.length < 2) return;

            const style = markerStyles[tipo] || markerStyles["Arquitetura Civil"];

            // Add polyline
            elements.push(
                <Polyline
                    key={`path-${tipo}`}
                    positions={routePositions}
                    color={style.stroke}
                    weight={3}
                    opacity={0.8}
                    dashArray="5,5"
                />
            );

            // Add direction arrows every 10 points
            const arrowMarkers: React.ReactElement[] = [];
            
            // Function to calculate bearing from north
            const getBearing = (startLat: number, startLng: number, destLat: number, destLng: number) => {
                const dLon = (destLng - startLng) * Math.PI / 180;
                const lat1 = startLat * Math.PI / 180;
                const lat2 = destLat * Math.PI / 180;
                const y = Math.sin(dLon) * Math.cos(lat2);
                const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
                const bearing = Math.atan2(y, x) * 180 / Math.PI;
                return (bearing + 360) % 360;
            };
            
            for (let i = 1; i < routePositions.length; i += 30) {
                const prev = routePositions[i - 1];
                const curr = routePositions[i];
                
                // Calculate bearing from north
                const bearing = getBearing(prev[0], prev[1], curr[0], curr[1]);
                
                arrowMarkers.push(
                    <Marker
                        key={`arrow-${tipo}-${i}`}
                        position={curr}
                        icon={L.divIcon({
                            className: 'path-arrow-marker',
                            html: `<div style="
                                transform: rotate(${bearing}deg);
                                font-size: 12px;
                                color: white;
                                text-shadow: 1px 1px 0px black, -1px -1px 0px black, 1px -1px 0px black, -1px 1px 0px black;
                            ">▲</div>`,
                            iconSize: [10, 10],
                            iconAnchor: [5, 5]
                        })}
                        zIndexOffset={50}
                    />
                );
            }
            elements.push(...arrowMarkers);
        });
        return elements;
    }, [visiblePaths, routes]);

    return (
        <div className="relative w-full h-full border rounded-lg overflow-hidden bg-white shadow-xl" onClick={handleEnableAudio}>

            {/* O mapa é envolvido numa div que apenas ESCONDE (hidden) em vez de ser removida do DOM */}
            <div className={`w-full h-full flex flex-col ${activeARItem ? 'hidden' : 'block'}`}>
                {/* Header com controls */}
                <div className="p-3 bg-white border-b flex justify-end items-center z-[1]">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-blue-600 uppercase">GPS Ativo</span>
                            <span className="text-xs text-gray-400">{geolocation.position ? "Sinal Estável" : "Localizando..."}</span>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsTracking(!isTracking); }}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${isTracking ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                        >
                            {isTracking ? 'Seguir' : 'Livre'}
                        </button>
                    </div>
                </div>

                <div className="relative flex-grow h-[70vh]">
                    <MapContainer 
                        center={center} 
                        zoom={zoom} 
                        maxZoom={MAP_CONFIG.ZOOM.MAX}
                        style={{ height: '100%', width: '100%', zIndex: 1 }}
                        bounds={MAP_CONFIG.BOUNDS.SOUTHWEST && MAP_CONFIG.BOUNDS.NORTHEAST ? [
                            MAP_CONFIG.BOUNDS.SOUTHWEST, 
                            MAP_CONFIG.BOUNDS.NORTHEAST
                        ] : undefined}
                    >
                        {geolocation.position && isTracking && (
                            <RecenterAutomatically coords={geolocation.position} />
                        )}

                        {/* Tile Layer */}
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Controlador de popups */}
                        <PopupController activePopupId={activePopupId} setActivePopupId={setActivePopupId} />

                        {/* Marker da posição do utilizador */}
                        {geolocation.position && (
                            <Marker 
                                position={geolocation.position} 
                                icon={userLocationIcon} 
                                zIndexOffset={1000} 
                            />
                        )}

                        {/* Markers com clustering ou individuais */}
                        {(bucketData?.length || 0) >= 10 ? (
                            // Com clustering
                            <>
                                <div style={{position: 'absolute', top: '10px', right: '10px', background: 'white', padding: '5px', zIndex: 1000, borderRadius: '5px', fontSize: '12px'}}>
                                    Clustering ATIVO ({bucketData?.length || 0} pontos)
                                </div>
                                <MarkerClusterGroup
                                chunkedLoading={true}
                                maxClusterRadius={50}
                                spiderfyOnMaxZoom={true}
                                showCoverageOnHover={false}
                                zoomToBoundsOnClick={true}
                                removeOutsideVisibleBounds={true}
                                animate={true}
                                animateAddingMarkers={true}
                                iconCreateFunction={(cluster: any) => {
                                    const count = cluster.getChildCount();
                                    let bgColor = '#D4AF37'; // Antique gold
                                    let iconSize = [35, 35];
                                    
                                    if (count > 20) {
                                        bgColor = '#D2691E'; // Terracotta
                                        iconSize = [45, 45];
                                    } else if (count > 10) {
                                        bgColor = '#556B2F'; // Olive
                                        iconSize = [40, 40];
                                    } else if (count > 5) {
                                        bgColor = '#8B4513'; // Deep brown
                                        iconSize = [38, 38];
                                    }

                                    return L.divIcon({
                                        html: `<div style="
                                            background: ${bgColor};
                                            width: ${iconSize[0]}px;
                                            height: ${iconSize[1]}px;
                                            border-radius: 50%;
                                            border: 3px solid white;
                                            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            font-weight: bold;
                                            font-size: ${size === 'small' ? '12px' : size === 'medium' ? '14px' : '16px'};
                                            color: white;
                                            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                                        "><span>${count}</span></div>`,
                                        className: '',
                                        iconSize: iconSize as [number, number],
                                        iconAnchor: [iconSize[0]/2, iconSize[1]/2]
                                    });
                                }}
                            >
                                {bucketData.filter((item) => {
    const tipo = item.tipo?.titulo || 'Arquitetura Civil';
    return item.coordenadas && visibleTypes.has(tipo);
}).map((item) => (
                            <Marker
                                key={item._id}
                                position={[item.coordenadas.lat, item.coordenadas.lng]}
                                icon={createCustomIcon(item.tipo?.titulo || 'Arquitetura Civil')}
                                ref={(ref) => {
                                    if (ref) {
                                        markersRef.current[item._id] = ref as any;
                                    }
                                }}
                                eventHandlers={{
                                    click: () => {
                                        handlePopupOpen(item._id);
                                    }
                                }}
                            >
                                <Popup autoClose={false} closeOnClick={false}>
                                    <div className="p-0 w-[220px] flex flex-col overflow-hidden historical-card organic-shadow">
                                        {item.galeria && item.galeria[0]?.url ? (
                                            <div className="w-full h-28 overflow-hidden bg-parchment/30 border-b border-deep-brown/20">
                                                <img src={`${item.galeria[0].url}?w=200&h=200&fit=crop&auto=format&q=75`} alt={item.title} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-full h-2 bg-antique-gold"></div>
                                        )}

                                        <div className="p-2 flex flex-col gap-1">
                                            <div>
                                                <h4 className="historical-heading text-sm leading-tight">{item.title}</h4>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    <span className="text-[7px] bg-olive/10 text-olive px-1.5 py-0.5 rounded uppercase font-bold organic-border">{item.tipo?.titulo || 'Património'}</span>
                                                    {item.classificacao?.titulo && (
                                                        <span className="text-[7px] bg-terracotta/10 text-terracotta px-1.5 py-0.5 rounded uppercase font-bold organic-border">{item.classificacao.titulo}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {item.audioNarracao?.fileKey && (
                                                <div className="bg-olive/10 rounded-lg p-1.5 border border-olive/20 flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (audioRef.current) {
                                                                const isThisActive = audioRef.current.src.includes(item.audioNarracao!.fileKey);
                                                                if (isThisActive && isAudioPlaying) {
                                                                    audioRef.current.pause();
                                                                } else {
                                                                    audioRef.current.src = `${APP_CONFIG.R2_URL}/${item.audioNarracao!.fileKey}`;
                                                                    audioRef.current.play();
                                                                }
                                                            }
                                                        }}
                                                        className="bg-antique-gold text-deep-brown rounded-full p-2 shadow-sm flex-shrink-0 organic-border"
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                                            {isAudioPlaying && audioRef.current?.src.includes(item.audioNarracao.fileKey) ? (
                                                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                                                            ) : (
                                                                <path d="M8 5v14l11-7z"/>
                                                            )}
                                                        </svg>
                                                    </button>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-bold text-deep-brown uppercase">Narração</span>
                                                        <span className="text-[8px] text-olive">Disponível aqui</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-1 pt-1.5 border-t border-deep-brown/20 flex justify-between items-center">
                                                <Link to={`/heritages/${item._id}`} className="text-antique-gold font-black text-[9px] uppercase hover:text-antique-gold/80">Detalhes →</Link>
                                                <span className="text-[9px] font-medium historical-text">
                                                    {geolocation.position ? `${Math.round(getDistance(geolocation.position[0], geolocation.position[1], item.coordenadas!.lat, item.coordenadas!.lng))}m` : '--'}
                                                </span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleOpenAR(item); }}
                                                    className="bg-deep-brown text-parchment px-2 py-1 rounded text-[8px] font-bold flex items-center gap-1 organic-border hover:bg-deep-brown/80"
                                                >
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M7 2h10l3 5v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7l3-5zm1 2l-2 3h12l-2-3H8z"/></svg>
                                                    VER EM AR
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                            </MarkerClusterGroup>
                            </>
                        ) : (
                            // Sem clustering - markers individuais
                            bucketData.map((item) => item.coordenadas && (
                                <Marker
                                    key={item._id}
                                    position={[item.coordenadas.lat, item.coordenadas.lng]}
                                    icon={createCustomIcon(item.tipo?.titulo || 'Arquitetura Civil')}
                                    eventHandlers={{
                                        click: () => {
                                            handlePopupOpen(item._id);
                                        }
                                    }}
                                >
                                    <Popup autoClose={false} closeOnClick={false}>
                                        <div className="p-0 w-[220px] flex flex-col overflow-hidden historical-card organic-shadow">
                                            {item.galeria && item.galeria[0]?.url ? (
                                                <div className="w-full h-28 overflow-hidden bg-parchment/30 border-b border-deep-brown/20">
                                                    <img src={`${item.galeria[0].url}?w=200&h=200&fit=crop&auto=format&q=75`} alt={item.title} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-full h-2 bg-antique-gold"></div>
                                            )}

                                            <div className="p-2 flex flex-col gap-1">
                                                <div>
                                                    <h4 className="historical-heading text-sm leading-tight">{item.title}</h4>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        <span className="text-[7px] bg-olive/10 text-olive px-1.5 py-0.5 rounded uppercase font-bold organic-border">{item.tipo?.titulo || 'Património'}</span>
                                                        {item.classificacao?.titulo && (
                                                            <span className="text-[7px] bg-terracotta/10 text-terracotta px-1.5 py-0.5 rounded uppercase font-bold organic-border">{item.classificacao.titulo}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {item.audioNarracao?.fileKey && (
                                                    <div className="bg-olive/10 rounded-lg p-1.5 border border-olive/20 flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (audioRef.current) {
                                                                    const isThisActive = audioRef.current.src.includes(item.audioNarracao!.fileKey);
                                                                    if (isThisActive && isAudioPlaying) {
                                                                        audioRef.current.pause();
                                                                    } else {
                                                                        audioRef.current.src = `${APP_CONFIG.R2_URL}/${item.audioNarracao!.fileKey}`;
                                                                        audioRef.current.play();
                                                                    }
                                                                }
                                                            }}
                                                            className="bg-antique-gold text-deep-brown rounded-full p-2 shadow-sm flex-shrink-0 organic-border"
                                                        >
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                                                {isAudioPlaying && audioRef.current?.src.includes(item.audioNarracao.fileKey) ? (
                                                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                                                                ) : (
                                                                    <path d="M8 5v14l11-7z"/>
                                                                )}
                                                            </svg>
                                                        </button>
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-bold text-deep-brown uppercase">Narração</span>
                                                            <span className="text-[8px] text-olive">Disponível aqui</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="mt-1 pt-1.5 border-t border-deep-brown/20 flex justify-between items-center">
                                                    <Link to={`/heritages/${item._id}`} className="text-antique-gold font-black text-[9px] uppercase hover:text-antique-gold/80">Detalhes →</Link>
                                                    <span className="text-[9px] font-medium historical-text">
                                                        {geolocation.position ? `${Math.round(getDistance(geolocation.position[0], geolocation.position[1], item.coordenadas!.lat, item.coordenadas!.lng))}m` : '--'}
                                                    </span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleOpenAR(item); }}
                                                        className="bg-deep-brown text-parchment px-2 py-1 rounded text-[8px] font-bold flex items-center gap-1 organic-border hover:bg-deep-brown/80"
                                                    >
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M7 2h10l3 5v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7l3-5zm1 2l-2 3h12l-2-3H8z"/></svg>
                                                        VER EM AR
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))
                        )}

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

                        {/* Percursos dos tipos */}
                        {pathPolylines}
                    </MapContainer>
                    
                    {/* Legenda simples dos tipos de património */}
                    <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
                        <h4 className="text-xs font-bold text-deep-brown mb-2 uppercase">Tipos</h4>
                        
                        {/* Perfil de Roteamento */}
                        <div className="mb-3">
                            <label className="text-xs font-bold text-deep-brown mb-1 block">Perfil de Rota:</label>
                            <select
                                value={routingProfile}
                                onChange={(e) => setRoutingProfile(e.target.value)}
                                className="w-full px-2 py-1 text-xs bg-blue-50 border border-blue-300 rounded"
                            >
                                <option value="walking">🚶 Caminhar</option>
                                <option value="cycling">🚴 Ciclismo</option>
                                <option value="driving">🚗 Carro</option>
                            </select>
                            {isRecalculatingRoutes && (
                                <div className="text-xs text-blue-600 mt-1">Recalculando rotas...</div>
                            )}
                        </div>
                        <div className="space-y-1">
                            {Object.entries(heritageIcons).map(([tipo, svg]) => {
                                const style = markerStyles[tipo] || markerStyles["Arquitetura Civil"];
                                const isVisible = visibleTypes.has(tipo);
                                return (
                                    <div key={tipo} className="flex items-center gap-2 text-xs p-1 rounded transition-colors">
                                        <div className="flex flex-col items-center gap-1">
                                            <div
                                                className={`w-5 h-5 flex items-center justify-center cursor-pointer ${!isVisible ? 'opacity-50' : ''}`}
                                                onClick={() => toggleTypeVisibility(tipo)}
                                                style={{
                                                    backgroundColor: isVisible ? style.bg : '#e5e7eb',
                                                    width: '22px',
                                                    height: '22px',
                                                    borderRadius: '50%',
                                                    border: `2px solid ${isVisible ? style.stroke : '#9ca3af'}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }} 
                                                dangerouslySetInnerHTML={{ __html: svg }}
                                            />
                                            <button
                                                onClick={() => togglePathVisibility(tipo)}
                                                className={`px-1 py-0.5 text-[8px] rounded ${visiblePaths.has(tipo) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                                            >
                                                {visiblePaths.has(tipo) ? 'Percurso' : 'Traçar'}
                                            </button>
                                        </div>
                                        <span className={`text-gray-700 ${!isVisible ? 'line-through' : ''}`}>{tipo}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* O ARPanel é renderizado por cima de tudo */}
            {activeARItem && <ARPanel items={bucketData} onClose={handleCloseAR} />}
        </div>
    );
};

export default MapcomponentClient;
