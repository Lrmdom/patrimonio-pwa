import { getSession, destroySession } from "~/sanity/session";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirect") || "/";

  // Get the session and destroy it
  const session = await getSession(request.headers.get("Cookie"));

  return new Response(null, {
    status: 307,
    headers: {
      Location: redirectTo,
      "Set-Cookie": await destroySession(session),
    },
  });
}
