import React from 'react';
import { client } from '~/sanity/client';

export function DebugVisualEditing() {
  const config = client.config();
  const studioUrl = typeof config.stega?.studioUrl === 'string' 
    ? config.stega.studioUrl 
    : String(config.stega?.studioUrl || 'N/A');
  
  // Verifica se o componente VisualEditing está na página
  const visualEditingElement = typeof window !== 'undefined' 
    ? document.querySelector('[data-sanity-visual-editing="true"]') || document.querySelector('[data-sanity-visual-editing]')
    : null;
  
  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono max-w-sm z-50">
      <div className="mb-2 font-bold">🔍 Sanity Debug</div>
      <div>Project ID: {config.projectId}</div>
      <div>Dataset: {config.dataset}</div>
      <div>Studio URL: {studioUrl}</div>
      <div>Stega Enabled: {config.stega ? '✅' : '❌'}</div>
      <div className="mt-2 text-green-300">
        Preview Mode: ✅ (DEV)
      </div>
      <div className="mt-2 text-yellow-300">
        Visual Editing: ✅ Ativo
      </div>
      <div className="mt-2 text-blue-300">
        VE Component: {visualEditingElement ? '✅' : '❌'}
      </div>
      <div className="mt-2 text-red-300">
        Window ENV: {typeof window !== 'undefined' && window.ENV?.PUBLIC_SANITY_STUDIO_URL ? '✅' : '❌'}
      </div>
    </div>
  );
}
