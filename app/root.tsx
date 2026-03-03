import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
  isRouteErrorResponse,
} from "react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Route } from "react-router";
import stylesheet from "~/app.css?url";
import IosPwaInstallBanner from "./components/IosPwaInstallBanner";
import { getPreviewData } from "~/sanity/session";
import { SanityVisualEditing } from "~/components/SanityVisualEditing";
import { AuthProvider } from "~/auth/context/AuthContext";
import { AuthWidget } from "~/auth/AuthWidget";
import { getGCSStorageClient } from "~/utils/gcs.server";
import i18n from "~/i18n";
import { LanguageSwitcher } from "~/components/LanguageSwitcher";

/**
 * Detecta a linguagem preferencial do utilizador através dos headers do browser.
 * NOTA: No cliente, o locale vem do localStorage; no servidor, vem dos headers.
 */
function getServerLanguage(request: Request): string {
  // No servidor, usar headers
  if (typeof window === 'undefined') {
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
      const primaryLang = acceptLanguage.split(',')[0].split('-')[0];
      if (['en', 'pt', 'es'].includes(primaryLang)) {
        return primaryLang;
      }
    }
    return 'en';
  }
  
  // No cliente (se chamado), usar localStorage
  const savedLang = typeof localStorage !== 'undefined' 
    ? localStorage.getItem('i18n_language') 
    : null;
  
  if (savedLang && ['en', 'pt', 'es'].includes(savedLang)) {
    return savedLang;
  }
  
  return 'pt';
}

/**
 * LOADER: Executa apenas no servidor.
 * Obtém os dados do Google Cloud Storage e define o locale.
 */
export const loader = async ({ request, params }: any) => {
  // 1. Inicializa o cliente GCS (usando a lógica singleton do seu gcs.server.ts)
  const gcsStorageClient = await getGCSStorageClient();

  // 2. Determina o locale (prioridade: params da URL > header > fallback 'pt')
  let locale = params.locale || getServerLanguage(request) || 'pt';
  
  console.log('🌍 Locale determination:');
  console.log('  - params.locale:', params.locale);
  console.log('  - header language:', getServerLanguage(request));
  console.log('  - final locale:', locale);

  // 3. Obtém dados do preview mode do Sanity
  const { preview } = await getPreviewData(request);

  const GCS_BUCKET_NAME = "heritage-sanity-json-data";
  const GCS_DATA_FILE_NAME = `heritage-sanity-data-${locale}.json`;

  console.log('📁 GCS: Loading file:', GCS_DATA_FILE_NAME, 'for locale:', locale);

  let bucketData = null;

  try {
    const file = gcsStorageClient.bucket(GCS_BUCKET_NAME).file(GCS_DATA_FILE_NAME);
    const [contents] = await file.download();
    bucketData = JSON.parse(contents.toString("utf8"));
    console.log(`Successfully read GCS file: ${GCS_DATA_FILE_NAME}`);
  } catch (error) {
    console.error(`Error reading GCS file ${GCS_DATA_FILE_NAME}:`, error);
    // Se falhar, retorna dados mock para não quebrar o mapa
    bucketData = [
      {
        _id: "1",
        title: "Igreja de Santa Maria",
        coordenadas: { lat: 37.1261, lng: -7.6499 },
        tipo: { titulo: "Religioso" },
        classificacao: { titulo: "Monumento Nacional" }
      },
      {
        _id: "2", 
        title: "Castelo de Tavira",
        coordenadas: { lat: 37.1280, lng: -7.6505 },
        tipo: { titulo: "Militar" },
        classificacao: { titulo: "Imóvel de Interesse Público" }
      },
      {
        _id: "3",
        title: "Praça da República",
        coordenadas: { lat: 37.1270, lng: -7.6520 },
        tipo: { titulo: "Espaço Público" },
        classificacao: { titulo: "Conjunto Urbano" }
      }
    ];
  }

  // Retornamos os dados. No React Router v7, o objeto retornado fica disponível no useLoaderData.
  return {
    bucketData,
    locale,
    preview,
    ENV: {
      NODE_ENV: process.env.NODE_ENV,
      PUBLIC_SANITY_PROJECT_ID: process.env.PUBLIC_SANITY_PROJECT_ID || import.meta.env.VITE_SANITY_STUDIO_PROJECT_ID,
      PUBLIC_SANITY_DATASET: process.env.PUBLIC_SANITY_DATASET || import.meta.env.VITE_SANITY_STUDIO_DATASET,
      PUBLIC_SANITY_STUDIO_URL: process.env.PUBLIC_SANITY_STUDIO_URL || import.meta.env.VITE_SANITY_STUDIO_URL,
      SANITY_API_READ_TOKEN: process.env.SANITY_API_READ_TOKEN || import.meta.env.SANITY_VIEWER_TOKEN,
    }
  };
};

export const links: any = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap",
  },
  { rel: "manifest", href: "/manifest.webmanifest" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
];

/**
 * LAYOUT: O "esqueleto" da aplicação.
 * Corrigido para usar useLoaderData() para obter o locale e dados do bucket.
 */
export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData("root") as any;
  const { t } = useTranslation();

  // Fallback seguro caso o loader ainda não tenha corrido ou tenha falhado
  const locale = data?.locale || "pt";

  useEffect(() => {
    i18n.changeLanguage(locale);
  }, [locale]);

  return (
    <AuthProvider>
      <html lang={locale}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {/* Injeta variáveis de ambiente para o client */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.ENV = ${JSON.stringify(data?.ENV || {})};
            `,
          }}
        />
      </head>
      <body>
      <AuthProvider>
        {/* Header com Auth */}
        <div className="p-4 border-b bg-parchment parchment-texture flex items-center justify-between sticky top-0 z-50 organic-shadow">
          <div>
            <IosPwaInstallBanner />
            
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <AuthWidget 
              location={null} 
              language={locale} 
              countryCode={null} 
              address={null} 
            />
          </div>
        </div>

        {/* Conteúdo principal */}
        {children}
      </AuthProvider>

      <ScrollRestoration />
      <Scripts />
      </body>
      </html>
    </AuthProvider>
  );
}

/**
 * APP: Renderiza a rota atual dentro do Layout.
 */
export default function App() {
  const data = useRouteLoaderData("root") as any;
  const preview = data?.preview || false;
  const isDev = import.meta.env.DEV;
  
  console.log('🔍 App renderizado, preview:', preview, 'isDev:', isDev);
  
  return (
    <>
      <Outlet />
      {(preview || isDev) && (
        <>
          {console.log('🎨 Renderizando SanityVisualEditing')}
          <SanityVisualEditing />
        </>
      )}
    </>
  );
}

/**
 * BOUNDARY: Captura erros de renderização ou de loader.
 */
export function ErrorBoundary({ error }: any) {
  const { t } = useTranslation();

  let message = t('errors.unexpectedError');
  let details = t('errors.unexpectedError');
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : t('errors.unexpectedError');
    details = error.status === 404
        ? t('errors.pageNotFoundDetails')
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
      <main className="pt-16 p-4 container mx-auto historical-card organic-shadow">
        <h1 className="text-2xl historical-heading">{message}</h1>
        <p className="mt-2 historical-text">{details}</p>
        {stack && (
            <pre className="w-full p-4 mt-4 bg-terracotta/10 text-terracotta overflow-x-auto rounded-lg organic-border">
          <code>{stack}</code>
        </pre>
        )}
      </main>
  );
}