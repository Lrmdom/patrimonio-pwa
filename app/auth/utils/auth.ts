import { redirect, type LoaderFunctionArgs } from "react-router-dom";
// Supabase SSR (Server-Side Rendering) utilitários para ler e escrever cookies
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
// Importação do tipo de User do Supabase para tipagem
import type { User } from '@supabase/supabase-js';

// Define a rota de login para onde os utilizadores não autenticados serão enviados
const LOGIN_PATH = "/login";

// -------------------------------------------------------------------------
// Função de Proteção de Rota (Middleware de Autenticação)
// -------------------------------------------------------------------------

/**
 * Verifica se um utilizador está autenticado.
 * Se o utilizador não estiver autenticado, lança um redirecionamento para a página de login.
 * Se estiver autenticado, devolve o objeto 'user' e os headers para manter a sessão Supabase.
 * * @param request O objeto Request que contém os headers (cookies) do utilizador.
 * @returns {Promise<{ user: User; headers: Headers }>} O objeto de utilizador autenticado e os headers.
 */
export async function requireAuth(request: LoaderFunctionArgs['request']): Promise<{ user: User; headers: Headers }> {

    // O objeto Headers será usado para capturar e propagar quaisquer
    // headers Set-Cookie que o Supabase possa gerar (ex: refresh do token).
    const headers = new Headers();

    // 1. Cria o cliente Supabase Server para ler o cookie da sessão
    const supabaseServer = createServerClient(
        // NOTA: É fundamental que estas variáveis de ambiente estejam definidas!
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_ANON_KEY!,
        {
            cookies: {
                // Função para obter os cookies do request (lê a sessão do browser)
                getAll() {
                    return parseCookieHeader(request.headers.get('Cookie') ?? '')
                },
                // Função para definir cookies (propaga novos cookies do Supabase)
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        // Adiciona o Set-Cookie ao objeto Headers
                        headers.append('Set-Cookie', serializeCookieHeader(name, value))
                    )
                },
            },
        }
    );

    // 2. Tenta obter o utilizador a partir da sessão armazenada no cookie
    const { data: { user } } = await supabaseServer.auth.getUser();

    // 3. Verifica a sessão
    if (!user) {
        // Se não houver utilizador, prepara o redirecionamento.

        // Captura o URL atual para saber para onde regressar após o login bem-sucedido
        const url = new URL(request.url);
        const redirectTo = url.pathname + url.search;

        // Constrói o URL de login com o parâmetro 'redirectTo'
        const loginUrl = `${LOGIN_PATH}?redirectTo=${encodeURIComponent(redirectTo)}`;

        // Devolve o redirecionamento usando 'throw redirect()'.
        // O React Router (ou Remix) capta esta exceção e executa a navegação.
        throw redirect(loginUrl, { headers });
    }

    // 4. Se o utilizador estiver autenticado, devolve o objeto user e os headers atualizados
    return { user, headers };
}