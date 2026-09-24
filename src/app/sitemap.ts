import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/urls";

export default function sitemap(): MetadataRoute.Sitemap {
  // Every public page. /support was missing until 24 Sep 2026 (found by a crawl); sitemap.test.ts
  // now checks this list against the public pages on disk.
  const routes = ["", "/decode", "/pricing", "/faq", "/support", "/privacy", "/terms", "/refund"];
  const now = new Date();
  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" || path === "/decode" ? 1 : 0.6,
  }));
}
