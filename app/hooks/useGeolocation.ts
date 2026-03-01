/**
 * Hook otimizado para geolocalização
 * Substitui o useSmartGPS com melhor performance e type safety
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { APP_CONFIG, type GPSPosition } from '~/config/constants';

export interface UseGeolocationReturn {
  position: [number, number] | null;
  accuracy: number | null;
  error: string | null;
  isLoading: boolean;
  isHighAccuracy: boolean;
  lastUpdate: number | null;
}

export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<UseGeolocationReturn>({
    position: null,
    accuracy: null,
    error: null,
    isLoading: true,
    isHighAccuracy: false,
    lastUpdate: null
  });

  const watchIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef<GPSPosition | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    const now = Date.now();
    const newPosition: GPSPosition = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: now
    };

    // Verificar se a mudança é significativa (economiza recursos)
    if (lastPositionRef.current) {
      const distance = calculateDistance(
        lastPositionRef.current.latitude,
        lastPositionRef.current.longitude,
        newPosition.latitude,
        newPosition.longitude
      );
      
      const timeSinceLastUpdate = now - lastUpdateRef.current;
      
      // Só atualiza se: moveu distância mínima OU passou tempo máximo
      if (distance < APP_CONFIG.GPS.MIN_DISTANCE && 
          timeSinceLastUpdate < APP_CONFIG.GPS.MAX_TIME) {
        return; // Ignorar update desnecessário
      }
    }

    lastPositionRef.current = newPosition;
    lastUpdateRef.current = now;

    setState(prev => ({
      ...prev,
      position: [newPosition.latitude, newPosition.longitude],
      accuracy: newPosition.accuracy,
      error: null,
      isLoading: false,
      isHighAccuracy: newPosition.accuracy <= APP_CONFIG.GPS.DESIRED_ACCURACY,
      lastUpdate: now
    }));
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    setState(prev => ({
      ...prev,
      error: getErrorMessage(error.code),
      isLoading: false
    }));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocalização não suportada neste dispositivo',
        isLoading: false
      }));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: APP_CONFIG.GPS.TIMEOUT,
      maximumAge: APP_CONFIG.GPS.MAX_AGE
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handleError,
      options
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [handlePositionUpdate, handleError]);

  return state;
}

// Helper functions
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

function getErrorMessage(code: number): string {
  switch (code) {
    case GeolocationPositionError.PERMISSION_DENIED:
      return 'Permissão de geolocalização negada. Ative nas configurações do dispositivo.';
    case GeolocationPositionError.POSITION_UNAVAILABLE:
      return 'Informação de localização indisponível.';
    case GeolocationPositionError.TIMEOUT:
      return 'Timeout ao obter localização. Tente novamente.';
    default:
      return 'Erro desconhecido ao obter localização.';
  }
}
