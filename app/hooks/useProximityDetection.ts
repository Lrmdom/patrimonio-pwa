/**
 * Hook otimizado para deteção de proximidade
 * Usa memoização e algoritmos eficientes para melhor performance
 */

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { MAP_CONFIG, isWithinProximity, hasExitedProximity } from '~/config/map';
import { APP_CONFIG, type ProximityItem } from '~/config/constants';
import { getDistance, getBearing } from '~/utils/geoUtilities';

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

export interface UseProximityDetectionReturn {
  nearbyItems: ProximityItem[];
  activeItemId: string | null;
  hasNearbyItems: boolean;
  checkProximity: (userPos: [number, number]) => void;
  clearActiveItem: () => void;
}

export function useProximityDetection(
  items: HeritageItem[],
  onProximityEnter?: (item: ProximityItem) => void,
  onProximityExit?: (item: ProximityItem) => void
): UseProximityDetectionReturn {
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const lastCheckRef = useRef<number>(0);
  const processedItemsRef = useRef<Set<string>>(new Set());

  // Memoizar items com coordenadas válidas
  const validItems = useMemo(() => {
    return items.filter(item => 
      item.coordenadas && 
      typeof item.coordenadas.lat === 'number' && 
      typeof item.coordenadas.lng === 'number'
    );
  }, [items]);

  // Calcular itens próximos com memoização
  const nearbyItems = useMemo(() => {
    if (!validItems.length) return [];
    
    return validItems.map(item => {
      // Nota: userPos virá do checkProximity
      // Esta memoização será invalidada quando validItems mudar
      return {
        id: item._id,
        distance: 0, // Será calculado em checkProximity
        bearing: 0,   // Será calculado em checkProximity
        item
      };
    });
  }, [validItems]);

  // Função otimizada para verificar proximidade
  const checkProximity = useCallback((userPos: [number, number]) => {
    const now = Date.now();
    
    // Rate limiting para não sobrecarregar
    if (now - lastCheckRef.current < APP_CONFIG.PERFORMANCE.DEBOUNCE_DELAY) {
      return;
    }
    lastCheckRef.current = now;

    if (!userPos || !validItems.length) {
      setActiveItemId(null);
      processedItemsRef.current.clear();
      return;
    }

    const [userLat, userLng] = userPos;
    const currentNearby: ProximityItem[] = [];
    const currentActive = new Set<string>();

    // Processar todos os itens (otimização futura: usar spatial indexing)
    validItems.forEach(item => {
      const distance = getDistance(
        userLat, userLng,
        item.coordenadas!.lat,
        item.coordenadas!.lng
      );

      const bearing = getBearing(
        userLat, userLng,
        item.coordenadas!.lat,
        item.coordenadas!.lng
      );

      const proximityItem: ProximityItem = {
        id: item._id,
        distance,
        bearing,
        item
      };

      // Verificar se está dentro do raio de proximidade
      if (isWithinProximity(distance)) {
        currentNearby.push(proximityItem);
        currentActive.add(item._id);

        // Verificar se é um novo item (entrou na proximidade)
        if (!processedItemsRef.current.has(item._id)) {
          processedItemsRef.current.add(item._id);
          onProximityEnter?.(proximityItem);
        }
      }
    });

    // Verificar itens que saíram da proximidade
    processedItemsRef.current.forEach(itemId => {
      if (!currentActive.has(itemId)) {
        const item = validItems.find(i => i._id === itemId);
        if (item) {
          const distance = getDistance(
            userLat, userLng,
            item.coordenadas!.lat,
            item.coordenadas!.lng
          );
          const bearing = getBearing(
            userLat, userLng,
            item.coordenadas!.lat,
            item.coordenadas!.lng
          );
          
          onProximityExit?.({
            id: itemId,
            distance,
            bearing,
            item
          });
        }
      }
    });

    // Atualizar set de itens processados
    processedItemsRef.current = currentActive;

    // Determinar o item mais próximo para ativação
    if (currentNearby.length > 0) {
      const closest = currentNearby.reduce((prev, curr) => 
        curr.distance < prev.distance ? curr : prev
      );
      setActiveItemId(closest.id);
    } else {
      setActiveItemId(null);
    }

  }, [validItems, onProximityEnter, onProximityExit]);

  // Limpar item ativo
  const clearActiveItem = useCallback(() => {
    setActiveItemId(null);
    processedItemsRef.current.clear();
  }, []);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      processedItemsRef.current.clear();
    };
  }, []);

  return {
    nearbyItems,
    activeItemId,
    hasNearbyItems: nearbyItems.length > 0,
    checkProximity,
    clearActiveItem
  };
}
