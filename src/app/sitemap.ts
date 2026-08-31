import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appealdeck.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/decode", "/pricing", "/privacy", "/terms", "/refund"];
  const now = new Date();
  return routes.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" || path === "/decode" ? 1 : 0.6,
  }));
}
