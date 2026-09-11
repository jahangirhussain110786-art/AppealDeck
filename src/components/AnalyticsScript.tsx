// Loads the Plausible tracking script only when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set. Renders
// nothing otherwise — no script tag, no request, no cookie, matching the privacy page's own
// description ("a cookieless analytics tool ... that counts page visits without collecting
// personal data or setting cross-site identifiers", src/content/legal.ts). Server component:
// this only decides whether to render a <script> tag, no client state needed.

import Script from "next/script";

export function AnalyticsScript() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;

  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
