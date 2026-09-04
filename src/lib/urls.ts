/**
 * Canonical origins for links and auth redirects.
 *
 * Single-host topology (decided 4 Sep 2026): marketing, auth, and the app share ONE origin
 * (the Vercel-provided URL until the apex domain is connected). APP_URL therefore resolves to
 * SITE_URL unless NEXT_PUBLIC_APP_URL is deliberately set for a later `app.` subdomain split
 * (checklist: AGENTS.md → "Domain topology").
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appealdeck.com";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? SITE_URL;
