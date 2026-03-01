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

// Interface para os dados do Sanity (schema bemCultural)
interface BemCultural {
  _id: string;
  _type: string;
  designacao?: string;
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
    _id, _type, designacao,
    // Busca o valor em 'pt' no array internacionalizado para evitar erro React
    "title": coalesce(title[_key == "pt"][0].value, designacao, "Sem título"),
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

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-8">
        <DebugVisualEditing />
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🏛️ Bens Culturais - Sanity Visual Editing Oficial
          </h1>
          <div className="text-sm text-gray-600">
            <p>Project ID: <span className="font-mono text-blue-600">{projectId}</span></p>
            <p>Dataset: <span className="font-mono text-green-600">{dataset}</span></p>
            <p className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded">
              🎨 Visual Editing Ativo por Padrão - Passe o mouse sobre elementos para editar
            </p>
          </div>
          
          {/* Botão de status do Visual Editing */}
          <div className="mt-4">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Visual Editing Ativo
            </div>
            <span className="ml-3 text-xs text-gray-500">
              (Modo desenvolvimento - Visual Editing sempre ativo)
            </span>
          </div>
        </div>

        {/* Lista de itens */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              📋 Bens Encontrados ({heritageItems?.length || 0})
            </h2>
          </div>

          {(!heritageItems || heritageItems.length === 0) ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🏛️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum bem cultural encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                Adicione itens no Sanity Studio
              </p>
              <a
                href="https://catalogopatrimonio.sanity.studio/bemCultural"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📝 Abrir Sanity Studio
              </a>
            </div>
          ) : (
            <div className="divide-y">
              {heritageItems.map((item: BemCultural) => (
                <div key={item._id} className="p-6 hover:bg-gray-50">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {item.title || item.designacao || 'Sem título'}
                    </h3>
                    
                    {item.tipo && (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full mb-2">
                        {item.tipo.title}
                      </span>
                    )}
                    
                    {item.descricao && (
                      <p className="text-gray-600 mb-3 line-clamp-3">
                        {item.descricao}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {item.coordenadas && (
                        <span>📍 {item.coordenadas.lat?.toFixed(4)}, {item.coordenadas.lng?.toFixed(4)}</span>
                      )}
                      
                      <a
                        href={`https://catalogopatrimonio.sanity.studio/bemCultural/${item._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Editar no Studio →
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
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            🏠 Voltar ao Início
          </Link>
          <a
            href="https://catalogopatrimonio.sanity.studio"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            📝 Sanity Studio
          </a>
        </div>
        </div>
      </div>
      <VisualEditing data-sanity-visual-editing="true" />
    </>
  );
}
