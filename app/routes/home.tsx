import React, { Suspense, useState, useEffect } from "react";
import { type LoaderFunctionArgs, useLoaderData, useRouteLoaderData } from "react-router";
import { Welcome } from "~/welcome/welcome";
import { supabase } from "~/auth/utils/supabase";

// 🟢 Carregamento dinâmico (Lazy Loading)
// Nota: Se usares 'export default' no Mapcomponent.client.tsx, basta:
// import("./Mapcomponent.client")
const MapComponent = React.lazy(() =>
    import("~/components/Mapcomponent.client").then(module => ({
        default: module.MapComponentClient
    }))
);

const TAVIRA_CENTER: [number, number] = [37.1261, -7.6499];
const INITIAL_ZOOM = 15;

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { data: limitesData, error } = await supabase
        .from('limites_administrativos')
        .select(`id, nome_freguesia, nome_concelho, codigo_ine, geometria, cor_area`)
        .eq('nome_concelho', 'Tavira');

    return { limites: limitesData || [] };
};

export function Home() {
    const { limites } = useLoaderData<typeof loader>();
    const rootData = useRouteLoaderData("root") as any;
    const bucketData = rootData?.bucketData;
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <div className="h-screen bg-gray-50 flex flex-col">
            {/* Header da página */}
            <div className="bg-white shadow-sm border-b flex-shrink-0">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">🗺️ Heritage Map</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Explore o património cultural de Tavira
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                                {bucketData ? `${bucketData.length} locais` : 'A carregar...'}
                            </div>
                            <div className="text-xs text-gray-500">
                                Mapa Interativo
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status */}
            <div className="max-w-7xl mx-auto px-4 py-3 flex-shrink-0">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <span className="text-sm text-blue-800">
                            {bucketData ? 
                                `✅ ${bucketData.length} locais de património carregados` : 
                                '🔄 A carregar dados do servidor...'
                            }
                        </span>
                    </div>
                </div>
            </div>

            {/* Map - ocupa largura total e espaço restante */}
            <div className="px-4 pb-6 flex-1">
                {isClient && bucketData && (
                    <Suspense fallback={
                        <div className="bg-white rounded-lg shadow-sm border p-8 text-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">A carregar mapa...</p>
                        </div>
                    }>
                        <div className="bg-white rounded-lg shadow-sm border overflow-hidden h-full">
                            <MapComponent
                                bucketData={bucketData}
                                limites={limites}
                                center={TAVIRA_CENTER}
                                zoom={INITIAL_ZOOM}
                            />
                        </div>
                    </Suspense>
                )}
            </div>
        </div>
    );
}

export default Home;