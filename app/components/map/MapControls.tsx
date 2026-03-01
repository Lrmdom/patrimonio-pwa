/**
 * Componente de controles do mapa
 * Centraliza controls e melhora UX
 */

import React from 'react';
import { LayersControl, ScaleControl } from 'react-leaflet';
import { TileLayer } from 'react-leaflet';
import { MAP_CONFIG } from '~/config/map';

interface MapControlsProps {
  showLayers?: boolean;
  showScale?: boolean;
  defaultLayer?: 'osm' | 'satellite' | 'terrain';
}

export function MapControls({ 
  showLayers = true, 
  showScale = true, 
  defaultLayer = 'osm' 
}: MapControlsProps) {
  return (
    <>
      {/* Layer Controls */}
      {showLayers && (
        <LayersControl position="topright">
          <LayersControl.BaseLayer 
            checked={defaultLayer === 'osm'} 
            name="OpenStreetMap"
          >
            <TileLayer 
              url={MAP_CONFIG.TILES.OSM}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer 
            checked={defaultLayer === 'satellite'} 
            name="Satélite"
          >
            <TileLayer 
              url={MAP_CONFIG.TILES.SATELLITE}
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer 
            checked={defaultLayer === 'terrain'} 
            name="Terreno"
          >
            <TileLayer 
              url={MAP_CONFIG.TILES.TERRAIN}
              attribution='&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>'
            />
          </LayersControl.BaseLayer>
        </LayersControl>
      )}

      {/* Scale Control */}
      {showScale && (
        <ScaleControl 
          position="bottomleft" 
          metric={true} 
          imperial={false}
        />
      )}
    </>
  );
}

// Componente para controle de GPS tracking
interface GPSControlProps {
  isActive: boolean;
  onToggle: () => void;
  userPosition?: [number, number] | null;
}

export function GPSControl({ isActive, onToggle, userPosition }: GPSControlProps) {
  return (
    <div className="leaflet-control-gps leaflet-bar">
      <button
        onClick={onToggle}
        className={`
          px-3 py-2 text-xs font-bold uppercase transition-all
          ${isActive 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
          }
        `}
        title={isActive ? "Parar seguimento" : "Iniciar seguimento GPS"}
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${userPosition ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          {isActive ? 'Seguindo' : 'GPS'}
        </div>
      </button>
    </div>
  );
}

// Componente para informações de GPS
interface GPSInfoProps {
  position?: [number, number] | null;
  accuracy?: number | null;
  isLoading?: boolean;
  error?: string | null;
}

export function GPSInfo({ position, accuracy, isLoading, error }: GPSInfoProps) {
  if (error) {
    return (
      <div className="absolute top-4 left-4 bg-red-50 border border-red-200 rounded-lg p-3 max-w-xs z-[1000]">
        <div className="flex items-center gap-2 text-red-700">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-sm font-medium">Erro GPS</span>
        </div>
        <p className="text-xs text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="absolute top-4 left-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-xs z-[1000]">
        <div className="flex items-center gap-2 text-yellow-700">
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">A obter localização...</span>
        </div>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="absolute top-4 left-4 bg-gray-50 border border-gray-200 rounded-lg p-3 max-w-xs z-[1000]">
        <div className="flex items-center gap-2 text-gray-700">
          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          <span className="text-sm font-medium">GPS não disponível</span>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-4 left-4 bg-green-50 border border-green-200 rounded-lg p-3 max-w-xs z-[1000]">
      <div className="flex items-center gap-2 text-green-700">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium">GPS Ativo</span>
      </div>
      <div className="text-xs text-green-600 mt-1">
        <div>Lat: {position[0].toFixed(6)}</div>
        <div>Lng: {position[1].toFixed(6)}</div>
        {accuracy && (
          <div>Precisão: ±{Math.round(accuracy)}m</div>
        )}
      </div>
    </div>
  );
}
