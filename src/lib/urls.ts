/**
 * Canonical origins for links and auth redirects.
 *
 * Single-host topology (decided 4 Sep 2026): marketing, auth, and the app share ONE origin
 * (the Vercel-provided URL until the apex domain is connected). APP_URL therefore resolves to
 * SITE_URL unless NEXT_PUBLIC_APP_URL is deliberately set for a later `app.` subdomain split
 * (checklist: AGENTS.md → "Domain topology").
 */
/**
 * An origin with no trailing slash or path, whatever was typed into the environment variable: a
 * value like "https://x.vercel.app/" made every `?next=` comparison fail (`URL.origin` never ends in
 * a slash) and sent every sign-in to the dashboard, and produced "https://x.vercel.app//decode".
 */
function cleanOrigin(value: string | undefined): string | undefined {
  const v = value?.trim();
  if (!v) return undefined;
  try {
    return new URL(v).origin;
  } catch {
    return v.replace(/\/+$/, "");
  }
}

export const SITE_URL = cleanOrigin(process.env.NEXT_PUBLIC_SITE_URL) ?? "https://appealdeck.com";
export const APP_URL = cleanOrigin(process.env.NEXT_PUBLIC_APP_URL) ?? SITE_URL;
