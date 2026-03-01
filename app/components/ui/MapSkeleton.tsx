/**
 * Componente de loading skeleton para o mapa
 * Melhora UX durante carregamento
 */

import React from 'react';

export function MapSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="p-3 bg-white border-b flex justify-between items-center">
        <div className="flex flex-col space-y-2">
          <div className="h-3 bg-gray-200 rounded w-20"></div>
          <div className="h-2 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>

      {/* Map skeleton */}
      <div className="relative h-[70vh] bg-gray-100">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200">
          {/* Simular grid do mapa */}
          <div className="absolute inset-0 opacity-30">
            <div className="grid grid-cols-8 grid-rows-6 h-full">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="border border-gray-300"></div>
              ))}
            </div>
          </div>
          
          {/* Simular markers */}
          <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-blue-300 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-red-300 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-green-300 rounded-full animate-pulse"></div>
          
          {/* Simular controles do mapa */}
          <div className="absolute top-4 right-4 space-y-2">
            <div className="w-8 h-8 bg-white rounded shadow-md"></div>
            <div className="w-8 h-8 bg-white rounded shadow-md"></div>
          </div>
          
          {/* Simular user location */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-4 h-4 bg-blue-400 rounded-full animate-ping"></div>
            <div className="absolute top-0 left-0 w-4 h-4 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MapControlsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-200 rounded mb-4"></div>
      <div className="grid grid-cols-3 gap-2">
        <div className="h-8 bg-gray-200 rounded"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export function PopupSkeleton() {
  return (
    <div className="animate-pulse w-64">
      <div className="h-28 bg-gray-200 rounded-t-lg"></div>
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="flex space-x-2">
          <div className="h-2 bg-gray-200 rounded w-16"></div>
          <div className="h-2 bg-gray-200 rounded w-20"></div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <div className="h-2 bg-gray-200 rounded w-12"></div>
          <div className="h-2 bg-gray-200 rounded w-8"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}
