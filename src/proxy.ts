import { NextResponse, type NextRequest } from "next/server";
import { refreshSession } from "@/lib/supabase/refreshSession";

const MARKETING_HOST = process.env.NEXT_PUBLIC_MARKETING_HOST ?? "appealdeck.com";
// Single host by default (decided 4 Sep 2026): marketing + auth + app share one origin, path-routed.
// Set NEXT_PUBLIC_APP_HOST to a *different* host only to re-enable the app-subdomain split
// (switch checklist: AGENTS.md → "Domain topology").
const APP_HOST = process.env.NEXT_PUBLIC_APP_HOST ?? MARKETING_HOST;
const SINGLE_HOST = APP_HOST === MARKETING_HOST;

// Split mode only. Must list the real app routes (no `/app` prefix since 882ed39).
const APP_PREFIXES = [
  "/app",
  "/auth",
  "/dashboard",
  "/case",
  "/compose",
  "/vault",
  "/billing",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];
const MARKETING_PATHS = [
  "/",
  "/decode",
  "/pricing",
  "/privacy",
  "/terms",
  "/refund",
  "/faq",
  "/support",
  "/guides",
  "/check-invoice",
];

function hostOf(req: NextRequest): string {
  return (req.headers.get("host") ?? "").split(":")[0]?.toLowerCase() ?? "";
}

/**
 * A redirect to the other host, or null to let the request through. Split-host mode only: on a
 * single host nothing is redirected.
 */
function redirectToOtherHost(req: NextRequest): NextResponse | null {
  if (SINGLE_HOST) return null;

  const host = hostOf(req);
  const { pathname } = req.nextUrl;
  const url = req.nextUrl.clone();

  if (pathname.startsWith("/api/")) return null;
  if (pathname.startsWith("/_next") || pathname === "/icon.svg") return null;

  // Local dev: treat localhost/127.0.0.1 as the app host so app routes serve without redirect
  const isLocalDev = host === "localhost" || host === "127.0.0.1";
  const isAppHost = host === APP_HOST || isLocalDev;

  if (isAppHost) {
    const isAppPath = APP_PREFIXES.some((p) => pathname.startsWith(p));
    if (!isAppPath && MARKETING_PATHS.includes(pathname) && !isLocalDev) {
      url.host = MARKETING_HOST;
      url.port = "";
      return NextResponse.redirect(url);
    }
    return null;
  }

  if (APP_PREFIXES.some((p) => pathname.startsWith(p)) && !isLocalDev) {
    url.host = APP_HOST;
    url.port = "";
    return NextResponse.redirect(url);
  }
  return null;
}

export async function proxy(req: NextRequest) {
  // The internal component gallery answers 200 with a 404 body in production, because its own
  // notFound() runs after the loading shell has started streaming. Refuse it here with a real 404.
  if (process.env.NODE_ENV === "production" && req.nextUrl.pathname.startsWith("/dev/"))
    return NextResponse.rewrite(new URL("/not-found-dev", req.url), { status: 404 });
  const redirect = redirectToOtherHost(req);
  if (redirect) return redirect;
  // Not redirected: keep a signed-in seller's session fresh before the page renders.
  return refreshSession(req);
}

export const config = {
  // `reader/` is the on-device document reader's files (about 16 MB of scripts and models); they
  // never involve a session, so they skip the proxy entirely.
  matcher: ["/((?!_next/static|_next/image|reader/|favicon.ico|robots.txt|sitemap.xml).*)"],
};
