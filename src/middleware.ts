import { NextResponse, type NextRequest } from "next/server";

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
const MARKETING_PATHS = ["/", "/decode", "/pricing", "/privacy", "/terms", "/refund"];

function hostOf(req: NextRequest): string {
  return (req.headers.get("host") ?? "").split(":")[0]?.toLowerCase() ?? "";
}

export function middleware(req: NextRequest) {
  if (SINGLE_HOST) return NextResponse.next();

  const host = hostOf(req);
  const { pathname } = req.nextUrl;
  const url = req.nextUrl.clone();

  if (pathname.startsWith("/api/")) return NextResponse.next();
  if (pathname.startsWith("/_next") || pathname === "/icon.svg") return NextResponse.next();

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
    return NextResponse.next();
  }

  if (APP_PREFIXES.some((p) => pathname.startsWith(p)) && !isLocalDev) {
    url.host = APP_HOST;
    url.port = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
