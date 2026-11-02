import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `next dev` treats the hostname it was started with (localhost) as the only allowed origin.
  // Playwright opens the app at 127.0.0.1, and without this the dev HMR socket is rejected and
  // the client never hydrates, so every interaction test fails on a machine where `npm run
  // test:e2e` reuses a running dev server (found 24 Oct 2026).
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    // Auth-sensitive app: never let the client Router Cache replay an
    // already-rendered dynamic page (dashboard/case/vault/billing) after sign
    // out or sign in changes the session. Every navigation to a dynamic route
    // refetches from the server instead of reusing a stale prefetch.
    staleTimes: { dynamic: 0 },
  },
  // 2 Nov 2026: the library was renamed from "guides" to the Playbook before any deployment. The
  // redirects keep working any link made while it was in review, including the hour the notes
  // lived on /notes.
  async redirects() {
    return [
      { source: "/notes", destination: "/playbook#notes", permanent: true },
      { source: "/notes/:slug", destination: "/playbook/notes/:slug", permanent: true },
      { source: "/guides/notes", destination: "/playbook#notes", permanent: true },
      { source: "/guides/notes/:slug", destination: "/playbook/notes/:slug", permanent: true },
      { source: "/guides", destination: "/playbook", permanent: true },
      { source: "/guides/:slug", destination: "/playbook/:slug", permanent: true },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
