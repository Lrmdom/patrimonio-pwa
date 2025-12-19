import {
  isRouteErrorResponse,
  Links,
  type LoaderFunctionArgs,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { setupPush } from "~/utils/push.client";
import IosPwaInstallBanner from "~/components/IosPwaInstallBanner";
import { getGCSStorageClient } from '~/utils/gcs.server';

/**
 * Detecta a linguagem preferencial do utilizador através dos headers do browser.
 */
function getServerLanguage(request: Request): string {
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const primaryLang = acceptLanguage.split(',')[0].split('-')[0];
    if (['en', 'pt', 'es'].includes(primaryLang)) {
      return primaryLang;
    }
  }
  return 'en';
}

/**
 * LOADER: Executa apenas no servidor.
 * Obtém os dados do Google Cloud Storage e define o locale.
 */
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  // 1. Inicializa o cliente GCS (usando a lógica singleton do seu gcs.server.ts)
  const gcsStorageClient = await getGCSStorageClient();

  // 2. Determina o locale (prioridade: params da URL > header > fallback 'pt')
  let locale = params.locale || getServerLanguage(request) || 'pt';

  const GCS_BUCKET_NAME = "heritage-sanity-json-data";
  const GCS_DATA_FILE_NAME = `heritage-sanity-data-${locale}.json`;

  let bucketData = null;

  try {
    const file = gcsStorageClient.bucket(GCS_BUCKET_NAME).file(GCS_DATA_FILE_NAME);
    const [contents] = await file.download();
    bucketData = JSON.parse(contents.toString("utf8"));
    console.log(`Successfully read GCS file: ${GCS_DATA_FILE_NAME}`);
  } catch (error) {
    console.error(`Error reading GCS file ${GCS_DATA_FILE_NAME}:`, error);
  }

  // Retornamos os dados. No React Router v7, o objeto retornado fica disponível no useLoaderData.
  return {
    bucketData,
    locale,
    ENV: {
      NODE_ENV: process.env.NODE_ENV
    }
  };
};

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: "manifest", href: "/manifest.webmanifest" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
];

/**
 * LAYOUT: O "esqueleto" da aplicação.
 * Corrigido para usar useLoaderData() para obter o locale e dados do bucket.
 */
export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>();

  // Fallback seguro caso o loader ainda não tenha corrido ou tenha falhado
  const locale = data?.locale || "pt";

  return (
      <html lang={locale}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
        <div>
          <IosPwaInstallBanner />
          <h1 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Configurações</h1>
        </div>
        <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm transition-colors"
            onClick={() => setupPush()}
        >
          Ativar Notificações
        </button>
      </div>

      {children}

      <ScrollRestoration />
      <Scripts />
      </body>
      </html>
  );
}

/**
 * APP: Renderiza a rota atual dentro do Layout.
 */
export default function App() {
  return <Outlet />;
}

/**
 * BOUNDARY: Captura erros de renderização ou de loader.
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "Ocorreu um erro inesperado.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Erro";
    details = error.status === 404
        ? "A página solicitada não foi encontrada."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
      <main className="pt-16 p-4 container mx-auto">
        <h1 className="text-2xl font-bold">{message}</h1>
        <p className="mt-2 text-gray-600">{details}</p>
        {stack && (
            <pre className="w-full p-4 mt-4 bg-red-50 text-red-700 overflow-x-auto rounded-lg">
          <code>{stack}</code>
        </pre>
        )}
      </main>
  );
}