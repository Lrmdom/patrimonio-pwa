import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link } from 'react-router-dom';

// URL Público para o áudio
const R2_PUBLIC_URL = "https://pub-72037178c35c4cb1b3448777a2c80f0a.r2.dev";

// --- Interfaces ---
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
    designacao: string;
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
}

// --- UTIL: Cálculo de Distância ---
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
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

function RecenterAutomatically({ coords }: { coords: L.LatLngExpression }) {
    const map = useMap();
    useEffect(() => {
        if (coords) map.setView(coords, map.getZoom(), { animate: true });
    }, [coords, map]);
    return null;
}

const createCustomIcon = (color: string) => L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7],
});

// NOVO ICON DE POSIÇÃO: Boneco com pulsação
// NOVO ICON DE POSIÇÃO: Versão Mini e Discreta
const userLocationIcon = L.divIcon({
    className: 'user-location-marker',
    html: `
        <div style="position: relative; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">
            <div class="pulse-ring" style="position: absolute; width: 30px; height: 30px; background: rgba(37, 99, 235, 0.25); border-radius: 50%; animation: pulse 2s infinite;"></div>
            
            <div style="background-color: #2563eb; width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.3); z-index: 10;">
                <svg viewBox="0 0 24 24" width="10" height="10" fill="white">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
            </div>
        </div>
        <style>
            @keyframes pulse {
                0% { transform: scale(0.6); opacity: 0.8; }
                100% { transform: scale(1.2); opacity: 0; }
            }
        </style>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});
export const MapComponentClient: React.FC<MapProps> = ({ limites, bucketData, center, zoom }) => {
    const [userPos, setUserPos] = useState<[number, number] | null>(null);
    const [isTracking, setIsTracking] = useState(true);
    const [activePopupId, setActivePopupId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const markersRef = useRef<{ [key: string]: L.Marker }>({});

    useEffect(() => {
        audioRef.current = new Audio();
        const handleAudioState = () => {
            if (audioRef.current) setIsPlaying(!audioRef.current.paused);
        };
        audioRef.current.addEventListener('play', handleAudioState);
        audioRef.current.addEventListener('pause', handleAudioState);
        audioRef.current.addEventListener('ended', handleAudioState);

        return () => {
            audioRef.current?.removeEventListener('play', handleAudioState);
            audioRef.current?.removeEventListener('pause', handleAudioState);
            audioRef.current?.removeEventListener('ended', handleAudioState);
            audioRef.current?.pause();
            audioRef.current = null;
        };
    }, []);

    const handleEnableAudio = () => {
        if (!audioEnabled && audioRef.current) {
            audioRef.current.play().then(() => {
                audioRef.current?.pause();
                setAudioEnabled(true);
            }).catch(() => console.log("Interação necessária"));
        }
    };

    useEffect(() => {
        if (typeof window !== "undefined" && "geolocation" in navigator) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
                (err) => console.warn(err),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    useEffect(() => {
        if (!userPos || !bucketData) return;
        const PROXIMITY_RADIUS = 50;
        const EXIT_RADIUS = 70;

        bucketData.forEach(item => {
            if (!item.coordenadas) return;
            const dist = getDistance(userPos[0], userPos[1], item.coordenadas.lat, item.coordenadas.lng);
            const marker = markersRef.current[item._id];

            if (dist <= PROXIMITY_RADIUS && activePopupId !== item._id) {
                setActivePopupId(item._id);
                marker?.openPopup();
                if ("vibrate" in navigator) navigator.vibrate(200);
                if (audioEnabled && audioRef.current && item.audioNarracao?.fileKey) {
                    const publicUrl = `${R2_PUBLIC_URL}/${item.audioNarracao.fileKey}`;
                    if (audioRef.current.src !== publicUrl) {
                        audioRef.current.src = publicUrl;
                        audioRef.current.play().catch(e => console.error("Erro Playback", e));
                    }
                }
            } else if (dist > EXIT_RADIUS && activePopupId === item._id) {
                marker?.closePopup();
                setActivePopupId(null);
                audioRef.current?.pause();
            }
        });
    }, [userPos, bucketData, activePopupId, audioEnabled]);

    return (
        <div className="relative w-full h-full flex flex-col border rounded-lg overflow-hidden bg-white shadow-xl" onClick={handleEnableAudio}>
            <div className="p-3 bg-white border-b flex justify-between items-center z-[1000]">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-blue-600 uppercase">GPS Ativo</span>
                    <span className="text-xs text-gray-400">{userPos ? "Sinal Estável" : "Localizando..."}</span>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); setIsTracking(!isTracking); }}
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${isTracking ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                    {isTracking ? 'Seguir' : 'Livre'}
                </button>
            </div>

            <div className="relative flex-grow h-[70vh]">
                <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {userPos && isTracking && <RecenterAutomatically coords={userPos} />}

                    {/* ICON DE POSIÇÃO ATUALIZADO */}
                    {userPos && <Marker position={userPos} icon={userLocationIcon} zIndexOffset={1000} />}

                    {bucketData.map((item) => item.coordenadas && (
                        <Marker
                            key={item._id}
                            ref={(el) => { if (el) markersRef.current[item._id] = el; }}
                            position={[item.coordenadas.lat, item.coordenadas.lng]}
                            icon={createCustomIcon(item.classificacao?.titulo === "Monumento Nacional" ? "#e11d48" : "#2563eb")}
                        >
                            <Popup autoClose={false} closeOnClick={false}>
                                <div className="p-0 w-[220px] flex flex-col overflow-hidden bg-white rounded-lg border-none shadow-none">
                                    {item.galeria && item.galeria[0]?.url ? (
                                        <div className="w-full h-28 overflow-hidden bg-gray-100 border-b">
                                            <img src={`${item.galeria[0].url}?w=200&h=200&fit=crop&auto=format&q=75`} alt={item.designacao} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-2 bg-blue-600"></div>
                                    )}

                                    <div className="p-3 flex flex-col gap-2">
                                        <div>
                                            <h4 className="font-bold text-sm leading-tight text-gray-800">{item.designacao}</h4>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                <span className="text-[7px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase font-bold">{item.tipo?.titulo || 'Património'}</span>
                                                {item.classificacao?.titulo && (
                                                    <span className="text-[7px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded uppercase font-bold">{item.classificacao.titulo}</span>
                                                )}
                                            </div>
                                        </div>

                                        {item.audioNarracao?.fileKey && (
                                            <div className="bg-blue-50/50 rounded-lg p-2 border border-blue-100 flex items-center gap-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (audioRef.current) {
                                                            const isThisActive = audioRef.current.src.includes(item.audioNarracao!.fileKey);
                                                            if (isThisActive && isPlaying) {
                                                                audioRef.current.pause();
                                                            } else {
                                                                audioRef.current.src = `${R2_PUBLIC_URL}/${item.audioNarracao!.fileKey}`;
                                                                audioRef.current.play();
                                                            }
                                                        }
                                                    }}
                                                    className="bg-blue-600 text-white rounded-full p-2 shadow-sm flex-shrink-0"
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                                        {isPlaying && audioRef.current?.src.includes(item.audioNarracao.fileKey) ? (
                                                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                                                        ) : (
                                                            <path d="M8 5v14l11-7z"/>
                                                        )}
                                                    </svg>
                                                </button>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-blue-900 uppercase">Narração</span>
                                                    <span className="text-[8px] text-blue-600">Disponível aqui</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-1 pt-2 border-t border-gray-100 flex justify-between items-center">
                                            <Link to={`/heritages/${item._id}`} className="text-blue-600 font-black text-[9px] uppercase">Detalhes →</Link>
                                            <span className="text-[9px] font-medium text-gray-400">
                                                {userPos ? `${Math.round(getDistance(userPos[0], userPos[1], item.coordenadas!.lat, item.coordenadas!.lng))}m` : '--'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                    {limites.map((lim, idx) => {
                        if (!lim.geometria) return null;

                        // Criamos uma cópia limpa da geometria sem o campo CRS
                        const { crs, ...geometriaLimpa } = lim.geometria;
debugger;
                        const feature = {
                            type: 'Feature',
                            geometry: geometriaLimpa,
                            properties: { nome: lim.nome_freguesia }, // Útil para popups depois
                            // 🟢 AQUI: Passamos a cor do banco para a feature
                            cor_fundo: lim.cor_area || '#666666'
                        };

                        return (
                            <GeoJSON
                                key={`geo-${lim.id}`}
                                data={feature as any}
                                style={(feature) => ({
                                    // 🟢 AQUI: O Leaflet acede à cor que injetamos acima
                                    fillColor: feature?.cor_fundo,
                                    color: '#444444',      // Cor da linha de contorno
                                    weight: 1,             // Espessura da linha
                                    fillOpacity: 0.4,      // Opacidade do preenchimento (ajuste a gosto)
                                    dashArray: '5,5'       // Linha tracejada
                                })}
                            />
                        );
                    })}
                </MapContainer>
            </div>
        </div>
    );
};

export default MapComponentClient;