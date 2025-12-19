import React, { Suspense } from "react";
import { type LoaderFunctionArgs, useLoaderData, useRouteLoaderData } from "react-router";
import { Welcome } from "~/welcome/welcome";
import { supabase } from "~/auth/utils/supabase";

// 🟢 Carregamento dinâmico (Lazy Loading)
// Nota: Se usares 'export default' no Mapcomponent.client.tsx, basta:
// import("./Mapcomponent.client")
const MapComponent = React.lazy(() =>
    import("~/components/Mapcomponent.client").then(module => ({
        default: module.MapComponentClient || module.default
    }))
);

const TAVIRA_CENTER: [number, number] = [37.24126, -7.70416];
const INITIAL_ZOOM = 10;

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

    return (
        <>
            <div>
                {bucketData ? (
                    <p>Dados do património carregados: {bucketData.length} itens</p>
                ) : (
                    <p>A carregar dados do servidor...</p>
                )}
            </div>
            {/* 🟢 O Suspense é obrigatório ao usar React.lazy */}
            <Suspense fallback={<div style={{ height: '70vh' }}>A carregar mapa...</div>}>
                <MapComponent
                    bucketData={bucketData}
                    limites={limites}
                    center={TAVIRA_CENTER}
                    zoom={INITIAL_ZOOM} ocorrencias={[]}                />
            </Suspense>
        </>
    );
}

export default Home;