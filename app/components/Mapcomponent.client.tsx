/**
 * Componente de mapa refatorado e otimizado
 * Usa hooks customizados, memoização e componentes modulares
 */

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, Polyline, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { useFetcher } from "react-router";
import { client } from "~/sanity/client";
import ARPanel from './ARPanel';
import { useTranslation } from 'react-i18next';

// Import otimizados
import { MAP_CONFIG } from '~/config/map';
import { APP_CONFIG } from '~/config/constants';
import { useGeolocation } from '~/hooks/useGeolocation';
import { useProximityDetection } from '~/hooks/useProximityDetection';
import { getDistance } from '~/utils/geoUtilities';
import './map/map.css';

// Função para criar icons customizados
const createCustomIcon = (tipo: string | undefined, heritageIcons: { [key: string]: string }, markerStyles: { [key: string]: { bg: string; stroke: string } }, defaultKey: string) => {
  const tipoKey = tipo || defaultKey;
  const iconSvg = heritageIcons[tipoKey] || heritageIcons[defaultKey];
  const style = markerStyles[tipoKey] || markerStyles[defaultKey];
  
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

interface Event {
  _id: string;
  titulo: { pt: string } | { [key: string]: string };
  dataInicio: string;
  dataFim?: string;
  tipo: { _ref: string; titulo: { pt: string } | { [key: string]: string } };
  categorias?: { _key: string; value: string }[];
  descricao?: any;
  localizacao?: { lat: number; lng: number };
  endereco?: { pt: string } | { [key: string]: string };
  imagem?: any;
  link?: string;
  startDate?: Date;
  endDate?: Date;
  isMultiDay?: boolean;
}

interface EventsResponse {
  events: Event[];
  year: number;
  month: number;
  total: number;
  error?: string;
}

interface MapProps {
    limites: LimiteAdministrativo[];
    bucketData: HeritageItem[];
    center: L.LatLngExpression;
    zoom: number;
    defaultLayer?: 'osm' | 'satellite' | 'terrain';
    locale?: string;
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
    defaultLayer = 'osm',
    locale
}) => {
    // Translation hook
    const { t, i18n } = useTranslation();

    // Current language for audio
    const currentLanguage = i18n.language;

    // Reverse mapping from translated titles to English keys
    const reverseHeritageTypes = useMemo(() => {
        const map: { [key: string]: string } = {};
        const types = [
            'religiousArchitecture',
            'militaryArchitecture',
            'civilArchitecture',
            'archaeologicalHeritage',
            'ethnographicHeritage',
            'industrialHeritage',
            'museumCollection',
            'sculptureAndStatuary',
            'festivityAndRitual'
        ];
        types.forEach(key => {
            map[t(`heritageTypes.${key}`)] = key;
        });
        return map;
    }, [t]);

    // Translated keys for heritage types
    const defaultTypeKey = t("heritageTypes.civilArchitecture");

    // Custom icons for heritage types (using English keys for robustness)
    const heritageIcons = useMemo(() => ({
        religiousArchitecture: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2"><path d="M10 22V8h4v14h-4zm-2 0V6h8v16H8z"/><path d="M12 6V2l3 4h-6z"/><circle cx="12" cy="12" r="1"/></svg>`,
        militaryArchitecture: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2"><path d="M3 21V8h2V6h2V8h2V6h2V8h2V6h2V8h2V6h2V8h2v13H3z"/><path d="M7 12h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"/><path d="M5 10h2v2H5v-2zm4 0h2v2H9v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"/></svg>`,
        civilArchitecture: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2"><path d="M4 6l2 2h2l-1 3h2l1 3h2l1-3h2l-1-3h2l2-2h-2l-1-2h-2l-1 2H9l-1-2H6l-1 2H4z"/></svg>`,
        archaeologicalHeritage: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
        ethnographicHeritage: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>`,
        industrialHeritage: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
        museumCollection: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
        sculptureAndStatuary: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2"><path d="M12 2c-1 0-1.5 .5-1.5 1.5v1.5c0 .5 .5 1 1 1s1-.5 1-1V4c0-.5-.5-1-1-1zM10 6v5c0 .5 .5 1 1 1h0.5v-6H10zM14 6v5c0 .5-.5 1-1 1h-0.5v-6H14zM11.5 12v4c0 .5 .5 1 1 1s1-.5 1-1v-4H11.5zM9.5 13v3c0 .5 .5 1 1 1h0.5v-4H9.5zM15.5 13v3c0 .5-.5 1-1 1h-0.5v-4H15.5z"/></svg>`,
        festivityAndRitual: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
    }), []);

    const markerStyles: { [key: string]: { bg: string; stroke: string } } = useMemo(() => ({
        "Search list": { bg: "#3B82F6", stroke: "#FFFFFF" }, // blue-500
        religiousArchitecture: { bg: "#1E40AF", stroke: "#FF0000" }, // red
        militaryArchitecture: { bg: "#1E3A8A", stroke: "#00FF00" }, // green
        civilArchitecture: { bg: "#2563EB", stroke: "#0000FF" }, // blue
        archaeologicalHeritage: { bg: "#1D4ED8", stroke: "#FFFF00" }, // yellow
        ethnographicHeritage: { bg: "#3B82F6", stroke: "#FF00FF" }, // magenta
        industrialHeritage: { bg: "#1E3A8A", stroke: "#00FFFF" }, // cyan
        museumCollection: { bg: "#2563EB", stroke: "#FFA500" }, // orange
        sculptureAndStatuary: { bg: "#1D4ED8", stroke: "#800080" }, // purple
        festivityAndRitual: { bg: "#3B82F6", stroke: "#FFC0CB" }, // pink
    }), []);

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
    const [isTracking, setIsTracking] = useState(false);
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
    const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
    const [isTerritorioOpen, setIsTerritorioOpen] = useState(false);
    const [isConservacaoOpen, setIsConservacaoOpen] = useState(false);
    const [isUrbanizacaoOpen, setIsUrbanizacaoOpen] = useState(false);
    const [isMunicipalOpen, setIsMunicipalOpen] = useState(false);
    const [isFestivaisOpen, setIsFestivaisOpen] = useState(false);
    const [isFeirasOpen, setIsFeirasOpen] = useState(false);
    const [isEspectaculosOpen, setIsEspectaculosOpen] = useState(false);
    const [isDesportivosOpen, setIsDesportivosOpen] = useState(false);
    const [isOutrosEventosOpen, setIsOutrosEventosOpen] = useState(false);
    const [isAlojamentoOpen, setIsAlojamentoOpen] = useState(false);
    const [isRestauracaoOpen, setIsRestauracaoOpen] = useState(false);
    const [isTransportesOpen, setIsTransportesOpen] = useState(false);
    const [isServicosOpen, setIsServicosOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    // State for mutually exclusive accordions
    const [activeAccordion, setActiveAccordion] = useState<string>('legend');
    // Calendar state
    const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [showDayEvents, setShowDayEvents] = useState(false);

    // Event data loading
    const eventsFetcher = useFetcher<EventsResponse>();
    const [eventsData, setEventsData] = useState<Event[]>([]);

    // Load events when calendar month changes or component mounts or calendar opens
    useEffect(() => {
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth() + 1;
        
        console.log(`🗓️ Loading events for ${year}-${month.toString().padStart(2, '0')}`);
        console.log(`🗓️ Current calendar date:`, currentCalendarDate);
        eventsFetcher.load(`/api/events?year=${year}&month=${month}`);
    }, [currentCalendarDate]);
    
    // Also load events when calendar is opened
    useEffect(() => {
        if (isCalendarOpen) {
            const year = currentCalendarDate.getFullYear();
            const month = currentCalendarDate.getMonth() + 1;
            
            console.log(`🗓️ Calendar opened, loading events for ${year}-${month.toString().padStart(2, '0')}`);
            eventsFetcher.load(`/api/events?year=${year}&month=${month}`);
        }
    }, [isCalendarOpen, currentCalendarDate]);

    // Update events data when fetcher data changes
    useEffect(() => {
        if (eventsFetcher.data?.events) {
            console.log(`📅 Updated events data: ${eventsFetcher.data.events.length} events`);
            setEventsData(eventsFetcher.data.events);
        }
    }, [eventsFetcher.data]);

    // Group events by date for calendar badges
    const eventsByDate = useMemo(() => {
        const grouped: Record<string, Event[]> = {};
        console.log(`🗓️ Processing ${eventsData.length} events for calendar`);
        
        eventsData.forEach(event => {
            const startDate = new Date(event.dataInicio);
            const endDate = event.dataFim ? new Date(event.dataFim) : startDate;
            
            console.log(`🗓️ Processing event: ${(event.titulo as any)?.pt || (event.titulo as any)?.en || 'Sem título'}, Start: ${startDate.toISOString()}, End: ${endDate?.toISOString()}`);
            
            // Add event for each day it spans
            const currentDay = new Date(startDate);
            while (currentDay <= endDate) {
                const dateKey = currentDay.toISOString().split('T')[0];
                if (!grouped[dateKey]) grouped[dateKey] = [];
                grouped[dateKey].push(event);
                currentDay.setDate(currentDay.getDate() + 1);
            }
        });
        
        console.log(`🗓️ Grouped events by date:`, Object.keys(grouped));
        return grouped;
    }, [eventsData]);
    
    // Event type icons mapping
    const getEventIcon = useCallback((eventType: string) => {
        const icons: Record<string, string> = {
            'gastronomia': '�️',
            'gastronomy': '🍽️',
            'música': '�',
            'music': '�',
            'cultura': '🏛️',
            'culture': '�️',
            'artes': '🎨',
            'arts': '🎨',
            'natureza': '�',
            'nature': '🌿',
            'cinema': '�',
            'desporto': '⚽',
            'sports': '⚽',
            'artesanato': '�',
            'crafts': '�',
            'fotografia': '📷',
            'photography': '📷'
        };
        return icons[eventType.toLowerCase()] || '📅';
    }, []);
    
    // Day click handler
    const handleDayClick = useCallback((dateKey: string, dayEvents: Event[]) => {
        if (dayEvents.length > 0) {
            setSelectedDate(dateKey);
            setShowDayEvents(true);
            console.log(`📅 Selected date: ${dateKey}, Events: ${dayEvents.length}`);
        }
    }, []);
    
    // Close events display
    const closeDayEvents = useCallback(() => {
        setShowDayEvents(false);
        setSelectedDate(null);
    }, []);
    
    // Format date for display
    const formatDate = useCallback((dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('pt-PT', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }, []);
    
    // Get events for selected date
    const selectedDateEvents = useMemo(() => {
        if (!selectedDate) return [];
        return eventsByDate[selectedDate] || [];
    }, [selectedDate, eventsByDate]);
    
    // Helper functions to safely access multilingual properties
    const getEventTitle = useCallback((titulo: any) => {
        if (typeof titulo === 'string') return titulo;
        if (titulo?.pt) return titulo.pt;
        if (titulo?.en) return titulo.en;
        return 'Sem título';
    }, []);
    
    const getEventTypeName = useCallback((tipo: any) => {
        if (!tipo?.titulo) return '';
        if (typeof tipo.titulo === 'string') return tipo.titulo;
        if (tipo.titulo.pt) return tipo.titulo.pt;
        if (tipo.titulo.en) return tipo.titulo.en;
        return '';
    }, []);
    
    // Helper to get event category name from categorias array
    const getEventCategoryName = useCallback((categorias: any[]) => {
        if (!categorias || !categorias.length) return '';
        const ptCategory = categorias.find((cat: any) => cat._key === 'pt');
        return ptCategory?.value || categorias[0]?.value || '';
    }, []);
    
    // Função para controlar popup único
    const handlePopupOpen = useCallback((markerId: string) => {
        setActivePopupId(markerId);
    }, []);
    
    // Create event marker icon
    const createEventIcon = useCallback((eventType: string) => {
        const icon = getEventIcon(eventType);
        return L.divIcon({
            className: 'event-marker',
            html: `
                <div class="event-marker-container" style="background-color: #10B981; border-color: #FFFFFF; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                    ${icon}
                </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12]
        });
    }, [getEventIcon]);
    
    // Generate event markers for selected date
    const eventMarkers = useMemo(() => {
        if (!showDayEvents || !selectedDateEvents.length) return [];
        
        return selectedDateEvents.map((event) => {
            // Use real event coordinates if available
            const eventLocation = event.localizacao ? [event.localizacao.lat, event.localizacao.lng] as [number, number] : center;
            const categoryName = getEventCategoryName(event.categorias || []);
            
            console.log(`🗓️ Event marker: ${getEventTitle(event.titulo)}, Location: ${eventLocation}, Coords:`, event.localizacao);
            
            return (
                <Marker
                    key={`event-${event._id}`}
                    position={eventLocation}
                    icon={createEventIcon(categoryName)}
                    eventHandlers={{ click: () => handlePopupOpen(`event-${event._id}`) }}
                    zIndexOffset={900} // Above heritage markers but below user location
                >
                    <Popup autoClose={false} closeOnClick={false}>
                        <div className="p-2 min-w-[200px]">
                            <div className="flex items-center space-x-2 mb-2">
                                <span className="text-lg">{getEventIcon(categoryName)}</span>
                                <h3 className="font-bold text-sm">{getEventTitle(event.titulo)}</h3>
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                                <div>🕐 {formatDate(event.dataInicio)}</div>
                                {event.dataFim && event.dataFim !== event.dataInicio && (
                                    <div>🕐 {formatDate(event.dataFim)}</div>
                                )}
                                {event.endereco && (
                                    <div>📍 {getEventTitle(event.endereco)}</div>
                                )}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            );
        });
    }, [showDayEvents, selectedDateEvents, center, createEventIcon, getEventCategoryName, getEventIcon, getEventTitle, formatDate, handlePopupOpen]);
    
    // Funções para navegar no calendário
    const nextMonth = useCallback(() => {
        setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }, []);

    const prevMonth = useCallback(() => {
        setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }, []);

    // Formatação do nome do mês atual
    const currentMonthName = useMemo(() => {
        return currentCalendarDate.toLocaleString('pt-PT', { month: 'long', year: 'numeric' });
    }, [currentCalendarDate]);

    // Lógica para gerar os dias dinamicamente
    const calendarDays = useMemo(() => {
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        return { firstDayOfMonth, daysInMonth };
    }, [currentCalendarDate]);
    
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
        const audioData = (item.audioNarracao as any)?.[currentLanguage];
        if (!audioData) return;

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
        const audioUrl = `${APP_CONFIG.R2_URL}/${audioData.fileKey}`;

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
    }, [currentAudioId, isAudioPlaying, currentLanguage]);

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
            const wasVisible = newSet.has(tipo);
            
            if (wasVisible) {
                newSet.delete(tipo);
            } else {
                newSet.add(tipo);
                setIsLoadingRoutes(true);
            }
            
            return newSet;
        });
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
            setIsLoadingRoutes(false);
            return;
        }
        
        visiblePaths.forEach(async (tipo) => {
            if (routes[tipo]) {
                pending--;
                if (pending === 0) {
                    setIsRecalculatingRoutes(false);
                    setIsLoadingRoutes(false);
                }
                return;
            }

            const points = bucketData.filter(item => 
                item.tipo?.titulo === tipo && 
                item.coordenadas && 
                typeof item.coordenadas.lat === 'number' && 
                typeof item.coordenadas.lng === 'number'
            );
            if (points.length < 2) {
                pending--;
                if (pending === 0) {
                    setIsRecalculatingRoutes(false);
                    setIsLoadingRoutes(false);
                }
                return;
            }

            const sortedPoints = points.sort((a, b) => {
                if (!geolocation.position) return a.coordenadas!.lat - b.coordenadas!.lat;
                const distA = getDistance(geolocation.position[0], geolocation.position[1], a.coordenadas!.lat, a.coordenadas!.lng);
                const distB = getDistance(geolocation.position[0], geolocation.position[1], b.coordenadas!.lat, b.coordenadas!.lng);
                return distA - distB;
            });

            const coords = sortedPoints.map(p => [p.coordenadas!.lng, p.coordenadas!.lat]);

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
                    const routeCoords: [number, number][] = geometry;
                    setRoutes(prev => ({ ...prev, [tipo]: routeCoords }));
                } else {
                    throw new Error('No geometry');
                }
            } catch (e) {
                console.warn('Route fetch failed for', tipo, e);
                const positions = sortedPoints.map(p => [p.coordenadas!.lat, p.coordenadas!.lng] as [number, number]);
                setRoutes(prev => ({ ...prev, [tipo]: positions }));
            }
            pending--;
            if (pending === 0) {
                setIsRecalculatingRoutes(false);
                setIsLoadingRoutes(false);
            }
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

            const englishKey = reverseHeritageTypes[tipo] || 'civilArchitecture';
            const style = markerStyles[englishKey] || markerStyles['civilArchitecture'];

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
        });
        return elements;
    }, [visiblePaths, routes, reverseHeritageTypes, markerStyles]);

    return (
        <div className="relative w-full h-full border rounded-lg overflow-hidden bg-white shadow-xl" onClick={handleEnableAudio}>
            <div className={`w-full h-full flex flex-col ${activeARItem ? 'hidden' : 'block'}`}>
                <div className="relative flex-grow">
                    {(isRecalculatingRoutes || isLoadingRoutes) && (
                        <div className="absolute inset-0 flex items-center justify-center z-[1000]">
                            <div className="bg-parchment/90 border border-deep-brown/20 rounded-lg shadow-md p-3 flex items-center gap-2 organic-shadow">
                                <div className="animate-spin rounded-full h-4 w-4 border border-antique-gold/30 border-t-antique-gold"></div>
                                <div className="text-xs font-serif text-deep-brown">
                                    {isRecalculatingRoutes ? 'A recalcular percursos...' : 'A traçar rota...'}
                                </div>
                            </div>
                        </div>
                    )}

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

                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <PopupController activePopupId={activePopupId} setActivePopupId={setActivePopupId} />

                        {geolocation.position && (
                            <Marker position={geolocation.position} icon={userLocationIcon} zIndexOffset={1000} />
                        )}

                        <div className="absolute top-[10px] right-[10px] bg-white p-[5px] z-[1000] rounded-[5px] border border-gray-200 shadow-sm">
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

                        {(bucketData?.length || 0) >= 10 ? (
                            <MarkerClusterGroup
                                chunkedLoading={true}
                                maxClusterRadius={50}
                                spiderfyOnMaxZoom={true}
                                showCoverageOnHover={false}
                                zoomToBoundsOnClick={true}
                                removeOutsideVisibleBounds={true}
                                iconCreateFunction={(cluster: any) => {
                                    const count = cluster.getChildCount();
                                    let bgColor = '#D4AF37';
                                    let iconSize = [35, 35];
                                    if (count > 20) { bgColor = '#D2691E'; iconSize = [45, 45]; }
                                    else if (count > 10) { bgColor = '#556B2F'; iconSize = [40, 40]; }
                                    return L.divIcon({
                                        html: `<div style="background: ${bgColor}; width: ${iconSize[0]}px; height: ${iconSize[1]}px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; color: white;"><span>${count}</span></div>`,
                                        className: '',
                                        iconSize: iconSize as [number, number],
                                        iconAnchor: [iconSize[0]/2, iconSize[1]/2]
                                    });
                                }}
                            >
                                {bucketData.filter((item) => {
                                    const tipo = item.tipo?.titulo || defaultTypeKey;
                                    const englishKey = reverseHeritageTypes[tipo] || 'civilArchitecture';
                                    return item.coordenadas && visibleTypes.has(englishKey);
                                }).map((item) => {
                                    const tipo = item.tipo?.titulo || defaultTypeKey;
                                    const englishKey = reverseHeritageTypes[tipo] || 'civilArchitecture';
                                    return (
                                        <Marker
                                            key={item._id}
                                            position={[item.coordenadas!.lat, item.coordenadas!.lng]}
                                            icon={createCustomIcon(englishKey, heritageIcons, markerStyles, 'civilArchitecture')}
                                            ref={(ref) => { if (ref) markersRef.current[item._id] = ref as any; }}
                                            eventHandlers={{ click: () => handlePopupOpen(item._id) }}
                                        >
                                            <Popup autoClose={false} closeOnClick={false}>
                                                <div className="p-0 w-[220px] flex flex-col overflow-hidden historical-card organic-shadow">
                                                    {item.galeria && item.galeria[0]?.url ? (
                                                        <div className="w-full h-28 overflow-hidden bg-parchment/30 border-b border-deep-brown/20">
                                                            <img src={`${item.galeria[0].url}?w=200&h=200&fit=crop&auto=format&q=75`} alt={item.title} className="w-full h-full object-cover" />
                                                        </div>
                                                    ) : <div className="w-full h-2 bg-antique-gold"></div>}
                                                    <div className="p-2 flex flex-col gap-1">
                                                        <h4 className="historical-heading text-sm leading-tight">{item.title}</h4>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            <span className="text-[7px] bg-olive/10 text-olive px-1.5 py-0.5 rounded uppercase font-bold organic-border">{item.tipo?.titulo || 'Património'}</span>
                                                        </div>
                                                        <div className="mt-1 pt-1.5 border-t border-deep-brown/20 flex justify-between items-center">
                                                            <Link to={`/heritages/${item._id}`} className="text-antique-gold font-black text-[9px] uppercase">Detalhes →</Link>
                                                            <button onClick={(e) => { e.stopPropagation(); handleOpenAR(item); }} className="bg-deep-brown text-parchment px-2 py-1 rounded text-[8px] font-bold">AR</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    );
                                })}
                            </MarkerClusterGroup>
                        ) : (
                            bucketData.filter((item) => {
                                const tipo = item.tipo?.titulo || defaultTypeKey;
                                const englishKey = reverseHeritageTypes[tipo] || 'civilArchitecture';
                                return item.coordenadas && visibleTypes.has(englishKey);
                            }).map((item) => {
                                const tipo = item.tipo?.titulo || defaultTypeKey;
                                const englishKey = reverseHeritageTypes[tipo] || 'civilArchitecture';
                                return (
                                    <Marker
                                        key={item._id}
                                        position={[item.coordenadas!.lat, item.coordenadas!.lng]}
                                        icon={createCustomIcon(englishKey, heritageIcons, markerStyles, 'civilArchitecture')}
                                        eventHandlers={{ click: () => handlePopupOpen(item._id) }}
                                    >
                                        <Popup autoClose={false} closeOnClick={false}>
                                            <div className="p-2 w-[200px] historical-card">{item.title}</div>
                                        </Popup>
                                    </Marker>
                                );
                            })
                        )}

                        {geoJSONFeatures.map((feature, index) => feature && (
                            <GeoJSON key={`geo-${index}`} data={feature} style={() => ({ fillColor: feature.properties.cor_fundo, color: '#444444', weight: 1, fillOpacity: 0.4, dashArray: '5,5' })} />
                        ))}

                        {pathPolylines}
                        
                        {/* Event markers for selected date */}
                        {eventMarkers}
                        
                    </MapContainer>
            </div>

            {/* Accordions container - absolute top left */}
            <div className="absolute top-4 left-4 flex flex-col z-[1000]">
                {/* Legenda do Mapa accordion */}
                <div className="w-64 bg-parchment border border-deep-brown/20 rounded-lg shadow-md organic-shadow">
                    <button
                        onClick={() => setActiveAccordion(activeAccordion === 'legend' ? '' : 'legend')}
                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-deep-brown/5 transition-colors rounded-t-lg"
                    >
                        <span className="text-xs font-serif font-bold text-deep-brown">
                            {activeAccordion === 'legend' ? 'Legenda do Mapa' : 'Património'}
                        </span>
                        <svg className={`w-4 h-4 text-deep-brown transition-transform ${activeAccordion === 'legend' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <div className={`transition-all duration-300 ease-in-out ${activeAccordion === 'legend' ? 'max-h-[500px] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        <div className="px-3 pb-3">
                            <div className="mb-3 pt-2">
                                <label className="text-xs font-serif font-bold text-deep-brown mb-1 block">Perfil de Rota:</label>
                                <select value={routingProfile} onChange={(e) => setRoutingProfile(e.target.value)} className="w-full px-2 py-1 text-xs bg-cream/50 border border-deep-brown/30 rounded">
                                    <option value="walking">🚶 Caminhar</option>
                                    <option value="cycling">🚴 Ciclismo</option>
                                    <option value="driving">🚗 Carro</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                {Object.entries(heritageIcons).map(([englishKey, svg]) => {
                                    const style = markerStyles[englishKey] || markerStyles['civilArchitecture'];
                                    const isVisible = visibleTypes.has(englishKey);
                                    const translatedTitle = t(`heritageTypes.${englishKey}`);
                                    return (
                                        <div key={englishKey} className="flex items-center gap-2 text-xs p-1 rounded hover:bg-deep-brown/5">
                                            <div className="flex flex-col items-center gap-1">
                                                <div
                                                    className={`w-5 h-5 flex items-center justify-center cursor-pointer ${!isVisible ? 'opacity-50' : ''}`}
                                                    onClick={() => toggleTypeVisibility(englishKey)}
                                                    style={{ backgroundColor: isVisible ? style.bg : '#e5e7eb', borderRadius: '50%', border: `2px solid ${isVisible ? style.stroke : '#9ca3af'}` }} 
                                                    dangerouslySetInnerHTML={{ __html: svg }}
                                                />
                                                <button onClick={() => togglePathVisibility(translatedTitle)} className={`px-1 py-0.5 text-[8px] rounded ${visiblePaths.has(translatedTitle) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                    {visiblePaths.has(translatedTitle) ? 'Percurso' : 'Traçar'}
                                                </button>
                                            </div>
                                            <span className={`text-gray-700 ${!isVisible ? 'line-through' : ''}`}>{translatedTitle}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Eventos accordion */}
                <div className="w-64 bg-parchment border border-deep-brown/20 rounded-lg shadow-md organic-shadow">
                    <button onClick={() => setActiveAccordion(activeAccordion === 'eventos' ? '' : 'eventos')} className="w-full px-3 py-2 flex items-center justify-between hover:bg-deep-brown/5 transition-colors rounded-t-lg">
                        <span className="text-xs font-serif font-bold text-deep-brown">{activeAccordion === 'eventos' ? 'Eventos' : '🎭 Mostrar Eventos'}</span>
                        <svg className={`w-4 h-4 text-deep-brown transition-transform ${activeAccordion === 'eventos' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <div className={`transition-all duration-300 ease-in-out ${activeAccordion === 'eventos' ? 'max-h-[600px] overflow-y-auto opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}>
                        <div className="px-3 pb-3">
                            {/* Calendar subsection - closed by default */}
                            <div className="mb-2 bg-blue-50 border border-blue-200 rounded-lg">
                                <button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className="w-full px-3 py-2 flex items-center justify-between">
                                    <span className="text-xs font-serif font-bold text-blue-800">📅 Calendário de Eventos</span>
                                    <svg className={`w-3 h-3 text-blue-800 transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                
                                <div className={`transition-all ${isCalendarOpen ? 'max-h-96 opacity-100 p-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                    <div className="text-xs text-blue-700">
                                        {/* Header de Navegação */}
                                        <div className="flex items-center justify-between mb-3 px-1">
                                            <button onClick={(e) => { e.stopPropagation(); prevMonth(); }} className="p-1 hover:bg-blue-200 rounded">◀</button>
                                            <span className="font-bold capitalize text-[10px]">{currentMonthName}</span>
                                            <button onClick={(e) => { e.stopPropagation(); nextMonth(); }} className="p-1 hover:bg-blue-200 rounded">▶</button>
                                        </div>

                                        {/* Grid do Calendário */}
                                        <div className="grid grid-cols-7 gap-1 text-center">
                                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                                                <div key={`weekday-${i}`} className="text-[8px] font-bold opacity-60">{d}</div>
                                            ))}
                                            
                                            {/* Células vazias para o início do mês */}
                                            {Array.from({ length: calendarDays.firstDayOfMonth }).map((_, i) => (
                                                <div key={`empty-${i}`} className="text-[8px] p-1"></div>
                                            ))}
                                            
                                            {/* Dias do mês com badges de eventos */}
                                            {Array.from({ length: calendarDays.daysInMonth }).map((_, i) => {
                                                const day = i + 1;
                                                const dateKey = `${currentCalendarDate.getFullYear()}-${(currentCalendarDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                                                const dayEvents = eventsByDate[dateKey] || [];
                                                const isToday = new Date().getDate() === day && 
                                                                new Date().getMonth() === currentCalendarDate.getMonth() &&
                                                                new Date().getFullYear() === currentCalendarDate.getFullYear();
                                                
                                                return (
                                                    <div 
                                                        key={day} 
                                                        className={`text-[8px] p-1 rounded cursor-pointer transition-colors relative
                                                            ${isToday ? 'bg-blue-500 text-white font-bold' : 'hover:bg-blue-50'}
                                                            ${selectedDate === dateKey ? 'bg-green-500 text-white font-bold' : ''}`}
                                                        onClick={() => handleDayClick(dateKey, dayEvents)}
                                                    >
                                                        {day}
                                                        {dayEvents.length > 0 && (
                                                            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[6px] rounded-full w-3 h-3 flex items-center justify-center font-bold">
                                                                {dayEvents.length}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <p className="mt-2 text-[8px] text-center text-blue-600">
                                            {eventsData.length > 0 ? `${eventsData.length} eventos este mês` : 'Selecione um dia para ver eventos'}
                                        </p>
                                        
                                        {/* Events display for selected date */}
                                        {showDayEvents && selectedDateEvents.length > 0 && (
                                            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-xs font-bold text-green-800">
                                                        📅 {formatDate(selectedDate!)}
                                                    </h4>
                                                    <button 
                                                        onClick={closeDayEvents}
                                                        className="text-xs text-green-600 hover:text-green-800"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                                    {selectedDateEvents.map((event) => (
                                                        <div key={event._id} className="p-2 bg-white rounded border border-green-100">
                                                            <div className="flex items-start space-x-2">
                                                                <span className="text-lg">
                                                                    {getEventIcon(getEventTypeName(event.tipo))}
                                                                </span>
                                                                <div className="flex-1">
                                                                    <h5 className="text-xs font-bold text-gray-800">
                                                                        {getEventTitle(event.titulo)}
                                                                    </h5>
                                                                    <div className="text-[10px] text-gray-600 mt-1">
                                                                        <div>🕐 {formatDate(event.dataInicio)}</div>
                                                                        {event.dataFim && event.dataFim !== event.dataInicio && (
                                                                            <div>🕐 {formatDate(event.dataFim)}</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Festivais subsection */}
                            <div className="mb-2 bg-purple-50 border border-purple-200 rounded-lg">
                                <button onClick={() => setIsFestivaisOpen(!isFestivaisOpen)} className="w-full px-3 py-2 flex items-center justify-between">
                                    <span className="text-xs font-serif font-bold text-purple-800">Festivais</span>
                                    <svg className={`w-3 h-3 text-purple-800 transition-transform ${isFestivaisOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                <div className={`transition-all ${isFestivaisOpen ? 'max-h-40 opacity-100 p-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                    <p className="text-xs">Conteúdo para festivais...</p>
                                </div>
                            </div>

                            {/* Feiras subsection */}
                            <div className="mb-2 bg-orange-50 border border-orange-200 rounded-lg">
                                <button onClick={() => setIsFeirasOpen(!isFeirasOpen)} className="w-full px-3 py-2 flex items-center justify-between">
                                    <span className="text-xs font-serif font-bold text-orange-800">Feiras</span>
                                    <svg className={`w-3 h-3 text-orange-800 transition-transform ${isFeirasOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                <div className={`transition-all ${isFeirasOpen ? 'max-h-40 opacity-100 p-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                    <p className="text-xs">Conteúdo para feiras...</p>
                                </div>
                            </div>

                            {/* Espetáculos subsection */}
                            <div className="mb-2 bg-pink-50 border border-pink-200 rounded-lg">
                                <button onClick={() => setIsEspectaculosOpen(!isEspectaculosOpen)} className="w-full px-3 py-2 flex items-center justify-between">
                                    <span className="text-xs font-serif font-bold text-pink-800">Espetáculos</span>
                                    <svg className={`w-3 h-3 text-pink-800 transition-transform ${isEspectaculosOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                <div className={`transition-all ${isEspectaculosOpen ? 'max-h-40 opacity-100 p-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                    <p className="text-xs">Conteúdo para espetáculos...</p>
                                </div>
                            </div>

                            {/* Desportivos subsection */}
                            <div className="mb-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                                <button onClick={() => setIsDesportivosOpen(!isDesportivosOpen)} className="w-full px-3 py-2 flex items-center justify-between">
                                    <span className="text-xs font-serif font-bold text-indigo-800">Desportivos</span>
                                    <svg className={`w-3 h-3 text-indigo-800 transition-transform ${isDesportivosOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                <div className={`transition-all ${isDesportivosOpen ? 'max-h-40 opacity-100 p-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                    <p className="text-xs">Conteúdo para eventos desportivos...</p>
                                </div>
                            </div>

                            {/* Outros eventos subsection */}
                            <div className="mb-2 bg-gray-50 border border-gray-200 rounded-lg">
                                <button onClick={() => setIsOutrosEventosOpen(!isOutrosEventosOpen)} className="w-full px-3 py-2 flex items-center justify-between">
                                    <span className="text-xs font-serif font-bold text-gray-800">Outros eventos</span>
                                    <svg className={`w-3 h-3 text-gray-800 transition-transform ${isOutrosEventosOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                <div className={`transition-all ${isOutrosEventosOpen ? 'max-h-40 opacity-100 p-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                    <p className="text-xs">Conteúdo para outros tipos de eventos...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Informações turísticas accordion */}
                <div className="w-64 bg-parchment border border-deep-brown/20 rounded-lg shadow-md organic-shadow">
                    <button onClick={() => setActiveAccordion(activeAccordion === 'turisticas' ? '' : 'turisticas')} className="w-full px-3 py-2 flex items-center justify-between hover:bg-deep-brown/5">
                        <span className="text-xs font-serif font-bold text-deep-brown">{activeAccordion === 'turisticas' ? 'Informações turísticas' : '🏨 Mostrar Informações'}</span>
                        <svg className={`w-4 h-4 text-deep-brown transition-transform ${activeAccordion === 'turisticas' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <div className={`transition-all duration-300 ease-in-out ${activeAccordion === 'turisticas' ? 'max-h-[600px] opacity-100' : 'max-h-0 overflow-hidden'}`}>
                        <div className="px-3 pb-3">
                            {/* Alojamento subsection */}
                            <div className="mb-2 bg-teal-50 border border-teal-200 rounded-lg">
                                <button onClick={() => setIsAlojamentoOpen(!isAlojamentoOpen)} className="w-full px-3 py-2 flex items-center justify-between">
                                    <span className="text-xs font-serif font-bold text-teal-800">Alojamento</span>
                                    <svg className={`w-3 h-3 text-teal-800 transition-transform ${isAlojamentoOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                <div className={`transition-all ${isAlojamentoOpen ? 'max-h-40 opacity-100 p-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                    <p className="text-xs">Conteúdo para alojamento...</p>
                                </div>
                            </div>

                            {/* Restauração subsection */}
                            <div className="mb-2 bg-lime-50 border border-lime-200 rounded-lg">
                                <button onClick={() => setIsRestauracaoOpen(!isRestauracaoOpen)} className="w-full px-3 py-2 flex items-center justify-between">
                                    <span className="text-xs font-serif font-bold text-lime-800">Restauração</span>
                                    <svg className={`w-3 h-3 text-lime-800 transition-transform ${isRestauracaoOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                <div className={`transition-all ${isRestauracaoOpen ? 'max-h-40 opacity-100 p-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                    <p className="text-xs">Conteúdo para restauração...</p>
                                </div>
                            </div>

                            {/* Transportes subsection */}
                            <div className="mb-2 bg-cyan-50 border border-cyan-200 rounded-lg">
                                <button onClick={() => setIsTransportesOpen(!isTransportesOpen)} className="w-full px-3 py-2 flex items-center justify-between">
                                    <span className="text-xs font-serif font-bold text-cyan-800">Transportes</span>
                                    <svg className={`w-3 h-3 text-cyan-800 transition-transform ${isTransportesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                <div className={`transition-all ${isTransportesOpen ? 'max-h-40 opacity-100 p-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                    <p className="text-xs">Conteúdo para transportes...</p>
                                </div>
                            </div>

                            {/* Serviços subsection */}
                            <div className="mb-2 bg-amber-50 border border-amber-200 rounded-lg">
                                <button onClick={() => setIsServicosOpen(!isServicosOpen)} className="w-full px-3 py-2 flex items-center justify-between">
                                    <span className="text-xs font-serif font-bold text-amber-800">Serviços</span>
                                    <svg className={`w-3 h-3 text-amber-800 transition-transform ${isServicosOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                <div className={`transition-all ${isServicosOpen ? 'max-h-40 opacity-100 p-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                    <p className="text-xs">Conteúdo para serviços...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Planos online accordion */}
                <div className="w-64 bg-parchment border border-deep-brown/20 rounded-lg shadow-md organic-shadow">
                    <button onClick={() => setActiveAccordion(activeAccordion === 'planos' ? '' : 'planos')} className="w-full px-3 py-2 flex items-center justify-between hover:bg-deep-brown/5">
                        <span className="text-xs font-serif font-bold text-deep-brown">{activeAccordion === 'planos' ? 'Planos online' : '📋 Mostrar Planos'}</span>
                        <svg className={`w-4 h-4 text-deep-brown transition-transform ${activeAccordion === 'planos' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <div className={`transition-all duration-300 ease-in-out ${activeAccordion === 'planos' ? 'max-h-[600px] opacity-100' : 'max-h-0 overflow-hidden'}`}>
                        <div className="px-3 pb-3">
                            <div className="mb-2 bg-blue-50 border border-blue-200 rounded-lg">
                                <button onClick={() => setIsTerritorioOpen(!isTerritorioOpen)} className="w-full px-3 py-2 text-xs font-bold text-blue-800">Territorio</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

            {activeARItem && <ARPanel items={bucketData} onClose={handleCloseAR} />}
        </div>
    );
};

export default MapcomponentClient;
