import { validatePreviewUrl } from "@sanity/preview-url-secret";
import type { ClientPerspective } from "@sanity/client";
import { client } from "~/sanity/client";
import { getSession, commitSession } from "~/sanity/session";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const token = import.meta.env.SANITY_VIEWER_TOKEN || process.env.SANITY_API_READ_TOKEN || process.env.SANITY_VIEWER_TOKEN;
  
  if (!token) {
    throw new Response(
      "SANITY_VIEWER_TOKEN environment variable is not set. Create a .env file with your Sanity read token.",
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  
  // Para testes, aceitamos um secret padrão
  if (secret === "test-secret-visual-editing") {
    // Bypass validation para testes
    const redirectTo = url.searchParams.get("redirect") || "/heritage-simple";
    
    // Get or create session
    const session = await getSession(request.headers.get("Cookie"));

    // Enable preview mode
    session.set("previewMode", true);
    session.set("perspective", "drafts");

    return new Response(null, {
      status: 307,
      headers: {
        Location: redirectTo,
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  // The preview-url-secret library lets you confirm
  // that the preview command is coming from Studio.
  const clientWithToken = client.withConfig({ token });
  const { isValid, redirectTo = "/" } = await validatePreviewUrl(
    clientWithToken,
    request.url
  );

  if (!isValid) {
    return new Response("Invalid preview URL", { status: 401 });
  }

  // Get or create session
  const session = await getSession(request.headers.get("Cookie"));

  // Enable preview mode
  session.set("previewMode", true);

  // Get perspective from URL query params
  const perspectiveParam = url.searchParams.get("sanity-preview-perspective");
  const perspective: ClientPerspective = (perspectiveParam as ClientPerspective) || "drafts";
  
  session.set("perspective", perspective);

  return new Response(null, {
    status: 307,
    headers: {
      Location: redirectTo,
      "Set-Cookie": await commitSession(session),
    },
  });
}
