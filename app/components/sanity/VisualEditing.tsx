/**
 * Visual Editing Component para Sanity
 * Implementa overlays de edição interativos
 */

'use client';

import { useEffect, useState } from 'react';
import { SANITY_CONFIG } from '~/config/sanity';

interface VisualEditingProps {
  children: React.ReactNode;
  className?: string;
}

export function VisualEditing({ children, className = '' }: VisualEditingProps) {
  const [isDraftMode, setIsDraftMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Usa a configuração centralizada
    setIsDraftMode(SANITY_CONFIG.isDraftMode());
  }, []);

  // Só renderiza em draft mode e se estiver habilitado
  if (!SANITY_CONFIG.VISUAL_EDITING_ENABLED || !isDraftMode || !mounted) {
    return <>{children}</>;
  }

  return (
    <div className={`visual-editing-wrapper ${className}`}>
      {/* Overlay de indicação de modo edição */}
      <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5 5 5-5 5-5-5-5 5-5 5 5 5 5z"/>
        </svg>
        <span className="text-sm font-medium">Modo Visual Editing</span>
      </div>

      {/* Overlay principal */}
      <div className="fixed inset-0 pointer-events-none z-40">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
      </div>

      {/* Conteúdo com overlays de edição */}
      <div className="relative">
        {children}
        
        {/* Instructions flutuantes */}
        <div className="fixed bottom-4 left-4 z-50 bg-white rounded-lg shadow-xl p-4 max-w-sm border border-blue-200">
          <h3 className="font-bold text-sm text-gray-800 mb-2">Como usar Visual Editing:</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">1.</span>
              <span>Clica em qualquer elemento editável para editar diretamente</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">2.</span>
              <span>Usa o painel lateral para navegar entre documentos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">3.</span>
              <span>As alterações são sincronizadas automaticamente</span>
            </li>
          </ul>
          <div className="mt-3 space-y-2">
            <button 
              onClick={() => window.open(SANITY_CONFIG.buildStudioUrl(), '_blank')}
              className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Abrir Sanity Studio
            </button>
            <button 
              onClick={() => {
                SANITY_CONFIG.disableDraftMode();
                window.location.reload();
              }}
              className="w-full bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Sair do Modo Edição
            </button>
          </div>
        </div>
      </div>

      {/* Estilos inline para evitar conflitos */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .visual-editing-wrapper {
            position: relative;
          }

          .visual-editing-wrapper [data-sanity-editable] {
            position: relative;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .visual-editing-wrapper [data-sanity-editable]:hover {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
            background: rgba(59, 130, 246, 0.05);
            border-radius: 4px;
          }

          .visual-editing-wrapper [data-sanity-editable="true"] {
            outline: 2px dashed #10b981;
            background: rgba(16, 185, 129, 0.1);
          }

          .visual-editing-wrapper [data-sanity-editable="false"] {
            outline: 2px solid #ef4444;
            background: rgba(239, 68, 68, 0.05);
          }

          /* Animações de entrada */
          @keyframes visualEditPulse {
            0% {
              transform: scale(1);
              opacity: 0.8;
            }
            50% {
              transform: scale(1.02);
              opacity: 1;
            }
            100% {
              transform: scale(1);
              opacity: 0.8;
            }
          }

          .visual-editing-wrapper [data-sanity-editable] {
            animation: visualEditPulse 2s ease-in-out infinite;
          }

          /* Overlay de edição para elementos específicos */
          .visual-editing-wrapper .heritage-title {
            min-height: 44px;
            display: flex;
            align-items: center;
            padding: 8px 12px;
            border-radius: 8px;
            margin: 4px 0;
          }

          .visual-editing-wrapper .heritage-description {
            min-height: 100px;
            padding: 12px;
            border-radius: 8px;
            margin: 8px 0;
            line-height: 1.6;
          }

          .visual-editing-wrapper .heritage-image {
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          /* Indicadores de edição */
          .visual-editing-wrapper [data-sanity-editable]::before {
            content: '✏️';
            position: absolute;
            top: -8px;
            right: -8px;
            background: #3b82f6;
            color: white;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            z-index: 10;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }

          /* Responsivo */
          @media (max-width: 768px) {
            .visual-editing-wrapper [data-sanity-editable]::before {
              width: 16px;
              height: 16px;
              font-size: 8px;
              top: -6px;
              right: -6px;
            }
          }
        `
      }} />
    </div>
  );
}

// Componente para elementos editáveis
interface EditableElementProps {
  children: React.ReactNode;
  field: string;
  documentId: string;
  className?: string;
}

export function EditableElement({ 
  children, 
  field, 
  documentId, 
  className = '' 
}: EditableElementProps) {
  const [isDraftMode, setIsDraftMode] = useState(false);

  useEffect(() => {
    setIsDraftMode(SANITY_CONFIG.isDraftMode());
  }, []);

  if (!SANITY_CONFIG.VISUAL_EDITING_ENABLED || !isDraftMode) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div 
      className={className}
      data-sanity-editable="true"
      data-sanity-field={field}
      data-sanity-document={documentId}
      onClick={() => {
        // Abre o campo no Sanity Studio usando a configuração centralizada
        window.open(SANITY_CONFIG.buildStudioUrl(`heritage/${documentId}?field=${field}`), '_blank');
      }}
    >
      {children}
    </div>
  );
}
