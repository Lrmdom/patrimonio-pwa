import { type LoaderFunctionArgs, useLoaderData } from "react-router";
import { Suspense, useState, useEffect } from "react";
import MapcomponentClient from "~/components/Mapcomponent.client";
import { supabase } from "~/auth/utils/supabase";
import { getGCSStorageClient } from "~/utils/gcs.server";

const TAVIRA_CENTER: [number, number] = [37.1261, -7.6499];
const INITIAL_ZOOM = 15;

export async function loader({ params, request }: LoaderFunctionArgs) {
  console.log('🌍 Locale route loader - params:', params);
  
  // Determinar locale
  const locale = params.locale || 'pt';
  
  // Obter dados do GCS para este locale
  const gcsStorageClient = await getGCSStorageClient();
  const GCS_BUCKET_NAME = "heritage-sanity-json-data";
  const GCS_DATA_FILE_NAME = `heritage-sanity-data-${locale}.json`;
  
  console.log('📁 Locale route: Loading file:', GCS_DATA_FILE_NAME, 'for locale:', locale);
  
  let bucketData = null;
  try {
    const file = gcsStorageClient.bucket(GCS_BUCKET_NAME).file(GCS_DATA_FILE_NAME);
    const [contents] = await file.download();
    bucketData = JSON.parse(contents.toString("utf8"));
    console.log(`Successfully read GCS file: ${GCS_DATA_FILE_NAME}`);
  } catch (error) {
    console.error(`Error reading GCS file ${GCS_DATA_FILE_NAME}:`, error);
    bucketData = [];
  }
  
  // Obter limites administrativos
  let limites = [];
  try {
    const { data: limitesData, error } = await supabase
      .from('limites_administrativos')
      .select(`id, nome_freguesia, nome_concelho, codigo_ine, geometria, cor_area`)
      .eq('nome_concelho', 'Tavira');
    
    if (!error && limitesData) {
      limites = limitesData;
    }
  } catch (error) {
    console.error('Error fetching limites:', error);
  }
  
  return { 
    locale,
    bucketData,
    limites
  };
}

export default function LocaleRoute() {
  const { locale, bucketData, limites } = useLoaderData<typeof loader>();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="px-4 pb-6 flex-1">
      {isClient && bucketData && (
        <Suspense fallback={
          <div className="historical-card p-8 text-center h-full flex items-center justify-center organic-shadow">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-brown mx-auto"></div>
          </div>
        }>
          <div className="historical-card overflow-hidden h-full organic-shadow">
            <MapcomponentClient
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
  );
}
