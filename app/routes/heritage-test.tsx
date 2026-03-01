/**
 * Página de Teste - Lista de Bens Patrimoniais
 * Usa as variáveis de ambiente Sanity para buscar dados
 */

import React from 'react';
import { type LoaderFunctionArgs, useLoaderData, Link } from 'react-router';

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
  coordendas?: {
    lat: number;
    lng: number;
  };
  galeria?: any[]; // Simplificado para evitar erros React
  _createdAt?: string;
  _updatedAt?: string;
}

// Loader para buscar dados do Sanity
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    // Verifica se as variáveis de ambiente estão configuradas
    const projectId = import.meta.env.VITE_SANITY_STUDIO_PROJECT_ID;
    const dataset = import.meta.env.VITE_SANITY_STUDIO_DATASET;
    const token = import.meta.env.SANITY_VIEWER_TOKEN;

    if (!projectId || !dataset) {
      throw new Error('Variáveis de ambiente Sanity não configuradas');
    }

    console.log('🔍 Buscando dados do Sanity:', {
      projectId,
      dataset,
      hasToken: !!token
    });

    // Constrói a query GROQ para o schema correto
    const query = `
      *[_type == "bemCultural"] | order(_createdAt desc) {
        _id,
        _type,
        designacao,
        title,
        descricao,
        codigoInventario,
        tipo->{_type, title},
        nivelProtecao->{_type, title},
        localizacao->{_type, title},
        coordendas,
        galeria[]{
          asset->{url, _type},
          alt
        },
        _createdAt,
        _updatedAt
      }
    `;

    // Faz a requisição para a API do Sanity
    const url = `https://${projectId}.api.sanity.io/v2024-03-07/data/query/${dataset}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API Sanity:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Erro ao buscar dados: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const heritageItems: BemCultural[] = data.result || [];

    console.log('✅ Dados recebidos:', {
      total: heritageItems.length,
      firstItem: heritageItems[0]?.title,
      lastItem: heritageItems[heritageItems.length - 1]?.title
    });

    return {
      heritageItems,
      config: {
        projectId,
        dataset,
        studioUrl: import.meta.env.VITE_SANITY_STUDIO_URL,
        visualEditingEnabled: import.meta.env.VITE_SANITY_VISUAL_EDITING_ENABLED === 'true',
        stegaEnabled: import.meta.env.VITE_SANITY_STUDIO_STEGA_ENABLED === 'true'
      }
    };

  } catch (error) {
    console.error('❌ Erro no loader:', error);
    return {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      heritageItems: [],
      config: {
        projectId: import.meta.env.VITE_SANITY_STUDIO_PROJECT_ID,
        dataset: import.meta.env.VITE_SANITY_STUDIO_DATASET,
        studioUrl: import.meta.env.VITE_SANITY_STUDIO_URL,
        visualEditingEnabled: import.meta.env.VITE_SANITY_VISUAL_EDITING_ENABLED === 'true',
        stegaEnabled: import.meta.env.VITE_SANITY_STUDIO_STEGA_ENABLED === 'true'
      }
    };
  }
};

export default function HeritageTestPage() {
  const { heritageItems, config, error } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com informações de configuração */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🏛️ Teste de Bens Culturais
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Lista de itens do Sanity Studio (schema bemCultural)
              </p>
            </div>
            <div className="flex gap-4">
              <a
                href={config.studioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                📝 Abrir Sanity Studio
              </a>
              <Link
                to="/"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                🏠 Voltar ao Início
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Painel de configuração */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ⚙️ Configuração Sanity
          </h2>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">Project ID:</span>
              <span className="text-sm font-mono text-blue-600">{config.projectId}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">Dataset:</span>
              <span className="text-sm font-mono text-green-600">{config.dataset}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">Visual Editing:</span>
              <span className={`text-sm font-medium ${config.visualEditingEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {config.visualEditingEnabled ? '✅ Ativado' : '❌ Desativado'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">Stega:</span>
              <span className={`text-sm font-medium ${config.stegaEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {config.stegaEnabled ? '✅ Ativado' : '❌ Desativado'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">Studio URL:</span>
              <a
                href={config.studioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {config.studioUrl}
              </a>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">Total Itens:</span>
              <span className="text-sm font-bold text-purple-600">{heritageItems.length}</span>
            </div>
          </div>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <span className="text-red-600 text-xl mr-3">❌</span>
              <div>
                <h3 className="text-lg font-semibold text-red-800">Erro na Configuração</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <p className="text-sm text-red-600 mt-2">
                  Verifique as variáveis de ambiente no arquivo .env
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de bens patrimoniais */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              📋 Bens Culturais ({heritageItems.length})
            </h2>
          </div>
          
          {heritageItems.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">🏛️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum bem cultural encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                {error 
                  ? 'Verifique a configuração do Sanity Studio'
                  : 'Adicione itens no Sanity Studio para vê-los aqui'
                }
              </p>
              <a
                href={config.studioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📝 Adicionar no Sanity Studio
              </a>
            </div>
          ) : (
            <div className="divide-y">
              {heritageItems.map((item: BemCultural) => (
                <div key={item._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.designacao || item.title || 'Sem título'}
                        </h3>
                        {item.tipo && (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                            {item.tipo.title}
                          </span>
                        )}
                        {item.nivelProtecao && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {item.nivelProtecao.title}
                          </span>
                        )}
                        {item.codigoInventario && (
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                            #{item.codigoInventario}
                          </span>
                        )}
                      </div>
                      
                      {item.descricao && (
                        <p className="text-gray-600 mb-3 line-clamp-3">
                          {item.descricao}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {item.coordendas && (
                          <span className="flex items-center gap-1">
                            📍 {item.coordendas.lat?.toFixed(4)}, {item.coordendas.lng?.toFixed(4)}
                          </span>
                        )}
                        {item.localizacao && (
                          <span className="flex items-center gap-1">
                            🏠 {item.localizacao.title}
                          </span>
                        )}
                        <a
                          href={`${config.studioUrl}/bemCultural/${item._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 hover:underline"
                        >
                          Editar no Studio →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
