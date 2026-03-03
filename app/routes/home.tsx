import React, { Suspense, useState, useEffect } from "react";
import { type LoaderFunctionArgs, useLoaderData, useRouteLoaderData } from "react-router";
import { Welcome } from "~/welcome/welcome";
import { supabase } from "~/auth/utils/supabase";
import MapcomponentClient from "~/components/Mapcomponent.client";

// 🟢 Carregamento dinâmico (Lazy Loading)
// Nota: Se usares 'export default' no Mapcomponent.client.tsx, basta:
// import("./Mapcomponent.client")
const MapComponent = React.lazy(() =>
    import("~/components/Mapcomponent.client").then(module => ({
        default: module.MapcomponentClient
    }))
);

const TAVIRA_CENTER: [number, number] = [37.1261, -7.6499];
const INITIAL_ZOOM = 15;

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
      const locale = params.locale || 'pt';

    const { data: limitesData, error } = await supabase
        .from('limites_administrativos')
        .select(`id, nome_freguesia, nome_concelho, codigo_ine, geometria, cor_area`)
        .eq('nome_concelho', 'Tavira');

    return { limites: limitesData ,locale, };
};

export function Home() {
    const { limites,locale } = useLoaderData<typeof loader>();
    const rootData = useRouteLoaderData("root") as any;
    const bucketData = rootData?.bucketData;
    //const locale = rootData?.locale || 'pt';
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <div className="h-screen bg-parchment parchment-texture flex flex-col">
            {/* Map - ocupa largura total e espaço restante */}
            <div className="px-4 pb-6 flex-1">
                {isClient && bucketData && (
                    <Suspense fallback={
                        <div className="historical-card p-8 text-center h-full flex items-center justify-center organic-shadow">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-brown mx-auto"></div>
                        </div>
                    }>
                        <div className="historical-card overflow-hidden h-full organic-shadow">
                            <MapComponent
                                bucketData={bucketData}
                                limites={limites}
                                center={TAVIRA_CENTER}
                                zoom={INITIAL_ZOOM}
                                locale={locale}
                            />
                        </div>
                    </Suspense>
                )}
            </div>
        </div>
    );
}

export default Home;