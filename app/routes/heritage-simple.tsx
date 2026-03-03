/**
 * Página de Teste - Lista de Bens Culturais com Sanity Visual Editing Oficial
 */

import React from 'react';
import { type LoaderFunctionArgs, useLoaderData, Link } from 'react-router';
import { useQuery } from '@sanity/react-loader';
import { getPreviewData } from '~/sanity/session';
import { loadQuery } from '~/sanity/loader.server';
import { client } from '~/sanity/client';
import { DebugVisualEditing } from '~/components/DebugVisualEditing';
import { VisualEditing } from '@sanity/visual-editing/react-router';
import { useTranslation } from 'react-i18next';

// Interface para os dados do Sanity (schema bemCultural)
interface BemCultural {
  _id: string;
  _type: string;
  title?: string;
  descricao?: string;
  codigoInventario?: string;
  tipo?: {
    _type: string;
    title: string;
  };
  nivelProtecao?: {
    _type: string;
    title: string;
  };
  localizacao?: {
    _type: string;
    title: string;
  };
  coordenadas?: {
    lat: number;
    lng: number;
  };
}

// Query GROQ para buscar bens culturais (com correção para arrays internacionalizados)
const BENS_CULTURAIS_QUERY = `
  *[_type == "bemCultural"] | order(_createdAt desc) {
    _id, _type,
    // Busca o valor em 'pt' no array internacionalizado para evitar erro React
    "title": coalesce(title[_key == "pt"][0].value, "Sem título"),
    // Converte o conteúdo do bloco (Portable Text) para texto simples
    "descricao": coalesce(pt::text(descricao[_key == "pt"][0].value), ""),
    codigoInventario, tipo->{_type, title},
    nivelProtecao->{_type, title},
    localizacao->{_type, title},
    coordenadas, _createdAt
  }
`;

// Loader usando o sistema oficial do Sanity
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { options } = await getPreviewData(request);
  const data = await loadQuery<BemCultural[]>(BENS_CULTURAIS_QUERY, {}, options);
  const { projectId, dataset } = client.config();

  return {
    initial: data,
    projectId,
    dataset,
  };
};

// Componente principal
export default function HeritageSimplePage() {
  const { initial, projectId, dataset } = useLoaderData<typeof loader>();
  const { data: heritageItems } = useQuery<BemCultural[]>(BENS_CULTURAIS_QUERY, {}, { initial });
  const { t } = useTranslation();

  return (
    <>
      <div className="min-h-screen bg-parchment parchment-texture p-8">
        <DebugVisualEditing />
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="historical-card p-6 mb-6 organic-shadow">
          <h1 className="text-2xl historical-heading mb-2">
            🏛️ {t('heritageSimple.title')}
          </h1>
          <div className="text-sm historical-text">
            <p>Project ID: <span className="font-mono text-antique-gold">{projectId}</span></p>
            <p>Dataset: <span className="font-mono text-olive">{dataset}</span></p>
            <p className="mt-2 text-xs text-olive bg-olive/10 p-2 rounded organic-border">
              🎨 {t('heritageSimple.visualEditingNote')}
            </p>
          </div>
          
          {/* Botão de status do Visual Editing */}
          <div className="mt-4">
            <div className="inline-flex items-center px-4 py-2 bg-olive/10 text-olive rounded-lg organic-border">
              <span className="w-2 h-2 bg-olive rounded-full mr-2"></span>
              {t('heritageSimple.visualEditingActive')}
            </div>
            <span className="ml-3 text-xs historical-text">
              {t('heritageSimple.devModeNote')}
            </span>
          </div>
        </div>

        {/* Lista de itens */}
        <div className="historical-card organic-shadow">
          <div className="px-6 py-4 border-b border-deep-brown/20">
            <h2 className="text-lg historical-heading">
              📋 {t('heritageSimple.itemsFound')} ({heritageItems?.length || 0})
            </h2>
          </div>

          {(!heritageItems || heritageItems.length === 0) ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🏛️</div>
              <h3 className="text-lg font-medium historical-text mb-2">
                {t('common.noItems')}
              </h3>
              <p className="historical-text mb-4">
                {t('common.addInStudio')}
              </p>
              <a
                href="https://catalogopatrimonio.sanity.studio/bemCultural"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-antique-gold text-deep-brown rounded-lg hover:bg-antique-gold/80 transition-colors organic-border"
              >
                📝 {t('common.openStudio')}
              </a>
            </div>
          ) : (
            <div className="divide-y divide-deep-brown/10">
              {heritageItems.map((item: BemCultural) => (
                <div key={item._id} className="p-6 hover:bg-parchment/30 transition-colors">
                  <div>
                    <h3 className="text-lg historical-heading mb-2">
                      {item.title || t('common.noTitle')}
                    </h3>
                    
                    {item.tipo && (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-olive/10 text-olive rounded-full mb-2 organic-border">
                        {item.tipo.title}
                      </span>
                    )}
                    
                    {item.descricao && (
                      <p className="historical-text mb-3 line-clamp-3">
                        {item.descricao}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm historical-text">
                      {item.coordenadas && (
                        <span>📍 {item.coordenadas.lat?.toFixed(4)}, {item.coordenadas.lng?.toFixed(4)}</span>
                      )}
                      
                      <a
                        href={`https://catalogopatrimonio.sanity.studio/bemCultural/${item._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-antique-gold hover:text-antique-gold/80 hover:underline"
                      >
                        {t('common.editInStudio')} →
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Links úteis */}
        <div className="mt-6 flex gap-4">
          <Link
            to="/"
            className="px-4 py-2 bg-deep-brown text-parchment rounded-lg hover:bg-deep-brown/80 transition-colors organic-border"
          >
            🏠 {t('common.backToHome')}
          </Link>
          <a
            href="https://catalogopatrimonio.sanity.studio"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-antique-gold text-deep-brown rounded-lg hover:bg-antique-gold/80 transition-colors organic-border"
          >
            📝 {t('common.sanityStudio')}
          </a>
        </div>
        </div>
      </div>
      <VisualEditing data-sanity-visual-editing="true" />
    </>
  );
}
