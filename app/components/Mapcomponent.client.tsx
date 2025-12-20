import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link } from 'react-router-dom';

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
    descricao?: any[];
}

interface MapProps {
    limites: LimiteAdministrativo[];
    bucketData: HeritageItem[];
    center: L.LatLngExpression;
    zoom: number;
}

// --- UTIL: Cálculo de Distância (Haversine) ---
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

const userLocationIcon = L.divIcon({
    className: 'user-location-marker',
    html: `<div style="position: relative; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">
             <div class="pulse-ring"></div>
             <div class="pulse-dot"></div>
           </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

// --- COMPONENTE PRINCIPAL ---
export const MapComponentClient: React.FC<MapProps> = ({ limites, bucketData, center, zoom }) => {
    const [userPos, setUserPos] = useState<[number, number] | null>(null);
    const [isTracking, setIsTracking] = useState(true);
    const [activePopupId, setActivePopupId] = useState<string | null>(null);

    // Referência para aceder aos métodos dos marcadores (open/close popup)
    const markersRef = useRef<{ [key: string]: L.Marker }>({});

    // 1. Monitorizar GPS
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

    // 2. Lógica de Proximidade: Abrir e FECHAR popups
    useEffect(() => {
        if (!userPos || !bucketData) return;

        const PROXIMITY_RADIUS = 50; // metros para abrir
        const EXIT_RADIUS = 60;      // metros para fechar (margem de erro para evitar oscilação)

        bucketData.forEach(item => {
            if (!item.coordenadas) return;

            const dist = getDistance(
                userPos[0], userPos[1],
                item.coordenadas.lat, item.coordenadas.lng
            );

            const marker = markersRef.current[item._id];
            if (!marker) return;

            // LÓGICA DE ENTRADA: Se estiver perto e não for a popup ativa atual
            if (dist <= PROXIMITY_RADIUS && activePopupId !== item._id) {
                marker.openPopup();
                setActivePopupId(item._id);
                if ("vibrate" in navigator) navigator.vibrate(200);
            }

            // LÓGICA DE SAÍDA: Se se afastar e for a popup que estava aberta
            else if (dist > EXIT_RADIUS && activePopupId === item._id) {
                marker.closePopup();
                setActivePopupId(null);
            }
        });
    }, [userPos, bucketData, activePopupId]);

    return (
        <div className="relative w-full h-full flex flex-col border rounded-lg overflow-hidden bg-white shadow-xl">
            <div className="p-3 bg-white border-b flex justify-between items-center z-[1000]">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-blue-600 uppercase">Exploração em tempo real</span>
                    <span className="text-xs text-gray-400">{userPos ? "Sinal GPS Estável" : "A aguardar GPS..."}</span>
                </div>
                <button
                    onClick={() => setIsTracking(!isTracking)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        isTracking ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500'
                    }`}
                >
                    {isTracking ? 'Seguir utilizador' : 'Mapa Livre'}
                </button>
            </div>

            <div className="relative flex-grow h-[70vh]">
                <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {userPos && isTracking && <RecenterAutomatically coords={userPos} />}

                    {/* Utilizador */}
                    {userPos && (
                        <Marker position={userPos} icon={userLocationIcon} zIndexOffset={1000} />
                    )}

                    {/* Património */}
                    {bucketData.map((item) => {
                        if (!item.coordenadas) return null;
                        return (
                            <Marker
                                key={item._id}
                                ref={(el) => { if (el) markersRef.current[item._id] = el; }}
                                position={[item.coordenadas.lat, item.coordenadas.lng]}
                                icon={createCustomIcon(item.classificacao?.titulo === "Monumento Nacional" ? "#e11d48" : "#2563eb")}
                            >
                                <Popup autoClose={false} closeOnClick={false}>
                                    <div className="p-1 max-w-[150px]">
                                        <h4 className="font-bold text-sm leading-tight text-gray-800">{item.designacao}</h4>
                                        <div className="mt-2 pt-2 border-t flex justify-between items-center">
                                            <Link to={`/heritages/${item._id}`} className="text-blue-600 font-black text-[10px] uppercase">
                                                Ver Guia
                                            </Link>
                                            <span className="text-[9px] text-gray-400 italic">50m de si</span>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {/* Limites Freguesias */}
                    {limites.map((lim, idx) => lim.geometria && (
                        <GeoJSON
                            key={`geo-${lim.id || idx}`}
                            data={{ type: 'Feature', geometry: lim.geometria } as any}
                            style={() => ({ color: '#666', weight: 0.5, fillOpacity: 0.03, dashArray: '5,5' })}
                        />
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

export default MapComponentClient;