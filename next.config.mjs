import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Auth-sensitive app: never let the client Router Cache replay an
    // already-rendered dynamic page (dashboard/case/vault/billing) after sign
    // out or sign in changes the session. Every navigation to a dynamic route
    // refetches from the server instead of reusing a stale prefetch.
    staleTimes: { dynamic: 0 },
  },
};

export default withBundleAnalyzer(nextConfig);
