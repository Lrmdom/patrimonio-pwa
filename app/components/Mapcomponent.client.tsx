import React, { useState, useMemo, useEffect } from 'react';
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

// --- Componente Auxiliar: Auto-Centralização ---
// Faz o mapa deslizar suavemente para a posição do utilizador quando esta muda
function RecenterAutomatically({ coords }: { coords: L.LatLngExpression }) {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.setView(coords, map.getZoom(), { animate: true });
        }
    }, [coords, map]);
    return null;
}

// --- Configuração de Ícones ---
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createCustomIcon = (color: string) => {
    return L.divIcon({
        className: `custom-marker`,
        html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, -7],
    });
};

// Ícone Animado para o Utilizador (Pulso Azul)
const userLocationIcon = L.divIcon({
    className: 'user-location-marker',
    html: `<div class="pulse-container">
             <div class="pulse-dot"></div>
             <div class="pulse-ring"></div>
           </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

// --- Helpers ---
const getDescriptionText = (blocks: any[]) => {
    if (!blocks || !Array.isArray(blocks)) return "";
    return blocks.map(b => b.children?.map((c: any) => c.text).join("")).join(" ");
};

// --- COMPONENTE PRINCIPAL ---
export const MapComponentClient: React.FC<MapProps> = ({ limites, bucketData, center, zoom }) => {
    // Estados de Filtros
    const [filterTipo, setFilterTipo] = useState<string>('all');
    const [filterClass, setFilterClass] = useState<string>('all');

    // Estados de Geolocalização
    const [userPos, setUserPos] = useState<L.LatLngExpression | null>(null);
    const [isTracking, setIsTracking] = useState(true); // Permite ao utilizador desligar o "auto-follow"

    // 1. Efeito de Monitorização de GPS (watchPosition)
    useEffect(() => {
        if (typeof window !== "undefined" && "geolocation" in navigator) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setUserPos([latitude, longitude]);
                },
                (err) => console.warn("Erro de geolocalização:", err),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    // 2. Lógica de Filtros para o Património
    const tiposUnicos = useMemo(() =>
            Array.from(new Set(bucketData.map(item => item.tipo?.titulo).filter(Boolean))),
        [bucketData]);

    const classUnicas = useMemo(() =>
            Array.from(new Set(bucketData.map(item => item.classificacao?.titulo).filter(Boolean))),
        [bucketData]);

    const filteredData = useMemo(() => {
        return bucketData.filter(item => {
            const matchesTipo = filterTipo === 'all' || item.tipo?.titulo === filterTipo;
            const matchesClass = filterClass === 'all' || item.classificacao?.titulo === filterClass;
            const hasCoords = item.coordenadas?.lat != null && item.coordenadas?.lng != null;
            return matchesTipo && matchesClass && hasCoords;
        });
    }, [bucketData, filterTipo, filterClass]);

    // 3. Estilos do Mapa
    const styleLimite = (feature: any) => ({
        fillColor: feature.properties?.cor_freguesia || '#B5EAD7',
        weight: 1.5,
        opacity: 0.6,
        color: '#444',
        fillOpacity: 0.2
    });

    return (
        <div className="relative w-full h-full flex flex-col border rounded-lg overflow-hidden bg-white shadow-xl">

            {/* --- Cabeçalho e Filtros --- */}
            <div className="p-4 bg-white border-b flex flex-wrap items-center justify-between gap-4 z-[1000]">
                <div className="flex gap-4">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold uppercase text-gray-400 mb-1">Tipo de Bem</label>
                        <select
                            className="text-sm border rounded-md px-2 py-1.5 bg-gray-50 outline-none focus:border-blue-500"
                            value={filterTipo}
                            onChange={(e) => setFilterTipo(e.target.value)}
                        >
                            <option value="all">Todos</option>
                            {tiposUnicos.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold uppercase text-gray-400 mb-1">Classificação</label>
                        <select
                            className="text-sm border rounded-md px-2 py-1.5 bg-gray-50 outline-none focus:border-blue-500"
                            value={filterClass}
                            onChange={(e) => setFilterClass(e.target.value)}
                        >
                            <option value="all">Todas</option>
                            {classUnicas.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                {/* Botão de Controlo de Seguimento GPS */}
                <button
                    onClick={() => setIsTracking(!isTracking)}
                    className={`px-3 py-2 rounded-md text-xs font-bold transition-colors ${
                        isTracking ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                >
                    {isTracking ? '📍 A Seguir GPS' : '📍 Fixar Mapa'}
                </button>
            </div>

            {/* --- Mapa --- */}
            <div className="relative flex-grow h-[70vh]">
                <MapContainer
                    center={center}
                    zoom={zoom}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Auto-recenter quando em modo tracking */}
                    {userPos && isTracking && <RecenterAutomatically coords={userPos} />}

                    {/* Marcador do Utilizador */}
                    {userPos && (
                        <Marker position={userPos} icon={userLocationIcon} zIndexOffset={1000}>
                            <Popup>Sua localização atual</Popup>
                        </Marker>
                    )}

                    {/* Polígonos GeoJSON */}
                    {limites.map((lim, idx) => lim.geometria && (
                        <GeoJSON
                            key={`geo-${lim.id || idx}`}
                            data={{
                                type: 'Feature',
                                geometry: lim.geometria,
                                properties: { cor_freguesia: lim.cor_area }
                            } as any}
                            style={styleLimite}
                        />
                    ))}

                    {/* Itens do Património (Marcadores) */}
                    {filteredData.map((item) => (
                        <Marker
                            key={item._id}
                            position={[item.coordenadas!.lat, item.coordenadas!.lng]}
                            icon={createCustomIcon(item.classificacao?.titulo === "Monumento Nacional" ? "#e11d48" : "#2563eb")}
                        >
                            <Popup>
                                <div className="p-1 min-w-[180px]">
                                    <h4 className="font-bold text-sm mb-1">{item.designacao}</h4>
                                    <div className="flex gap-1 mb-2">
                                        <span className="text-[9px] bg-gray-100 px-1 py-0.5 rounded text-gray-600 font-bold uppercase">
                                            {item.tipo?.titulo}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 italic mb-2 line-clamp-2">
                                        {getDescriptionText(item.descricao || [])}
                                    </p>
                                    <Link
                                        to={`/heritages/${item._id}`}
                                        className="text-blue-600 font-bold text-xs hover:underline block border-t pt-2"
                                    >
                                        Ver Detalhes &rarr;
                                    </Link>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

export default MapComponentClient;