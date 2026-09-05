import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/urls";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/decode", "/pricing", "/privacy", "/terms", "/refund", "/faq"];
  const now = new Date();
  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" || path === "/decode" ? 1 : 0.6,
  }));
}
