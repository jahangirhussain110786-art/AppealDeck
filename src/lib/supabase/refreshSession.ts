import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** The auth cookie `@supabase/ssr` writes: `sb-<project>-auth-token`, chunked as `.0`, `.1` when long. */
const AUTH_COOKIE = /^sb-.+-auth-token(?:\.\d+)?$/;

/**
 * Keeps a signed-in seller's session alive across page loads (30 Sep 2026).
 *
 * The access token lasts an hour. When a seller comes back to a case after longer than that, the
 * first thing to notice is the server rendering the page: `getUser()` sees the expired token and
 * refreshes it — which spends the refresh token, and the new pair is then handed to `setAll`. In a
 * Server Component `setAll` cannot write cookies (`server.ts` swallows the error), so the new pair
 * was thrown away and the browser still held the spent token.
 *
 * Verified against the real project on 30 Sep 2026: with the proxy doing nothing, a request with an
 * expired session came back signed in but carried no new cookie, so every later request had to
 * refresh again, and the browser's own client had to refresh with a token the server had already
 * spent. Whether that ends up signing a seller out depends on the project's refresh-token reuse
 * setting (on by default at Supabase, with a ten-second window: a token reused after it is read as
 * theft and the session is ended). Twelve seconds apart did not sign the dev account out here, so
 * that consequence is not claimed — but nothing about a page load should depend on it.
 *
 * The fix is the one Supabase documents: do the refresh here, in the proxy, which *can* set
 * cookies, and forward the new ones to the page being rendered. `getSession()` is enough — on the
 * server it reads the cookie and refreshes only when the token has expired, with no network call
 * otherwise. Nothing here decides who may see what; every page and route still asks `getUser()`.
 *
 * A request without an auth cookie returns at once, so visitors who are not signed in pay nothing.
 * Any failure falls through to the page unchanged: this must never be the reason a page does not load.
 */
export async function refreshSession(req: NextRequest): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || !req.cookies.getAll().some((c) => AUTH_COOKIE.test(c.name))) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request: req });
  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          // The page being rendered reads the request's cookies, so it must see the new ones too.
          for (const { name, value } of cookiesToSet) req.cookies.set(name, value);
          response = NextResponse.next({ request: req });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          // Keeps a shared cache from storing a response that carries someone's tokens.
          for (const [key, value] of Object.entries(headers ?? {}))
            response.headers.set(key, value);
        },
      },
    });
    await supabase.auth.getSession();
  } catch {
    // Fall through with whatever was built: the page decides for itself whether anyone is signed in.
  }
  return response;
}
