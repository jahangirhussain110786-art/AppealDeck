import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/urls";
import { GUIDES } from "@/content/guides";
import { LEGAL } from "@/content/legal";

export default function sitemap(): MetadataRoute.Sitemap {
  // Every public page. /support was missing until 24 Sep 2026 (found by a crawl); sitemap.test.ts
  // now checks this list against the public pages on disk.
  //
  // `lastModified` is only given where the page carries a real date of its own (a guide's "last
  // verified", a legal page's "last updated"). Until 25 Sep 2026 every page was stamped with the
  // build time, which tells a crawler everything changed on every deploy, so it learns to ignore
  // the dates entirely. No date is better than a wrong one.
  const routes: { path: string; lastModified?: string }[] = [
    { path: "" },
    { path: "/decode" },
    { path: "/pricing" },
    { path: "/faq" },
    { path: "/support" },
    { path: "/privacy", lastModified: LEGAL.lastUpdated.privacy },
    { path: "/terms", lastModified: LEGAL.lastUpdated.terms },
    { path: "/refund", lastModified: LEGAL.lastUpdated.refund },
    { path: "/guides" },
    ...GUIDES.map((g) => ({ path: `/guides/${g.slug}`, lastModified: g.lastVerified })),
  ];
  return routes.map(({ path, lastModified }) => ({
    url: `${SITE_URL}${path}`,
    ...(lastModified ? { lastModified } : {}),
    changeFrequency: "weekly",
    priority: path === "" || path === "/decode" ? 1 : path.startsWith("/guides/") ? 0.8 : 0.6,
  }));
}
