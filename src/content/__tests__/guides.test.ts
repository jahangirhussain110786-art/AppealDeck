import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { GUIDES, GUIDES_COMMON } from "../guides";
import { SHARED } from "../shared";
import { DECODE } from "../marketing";

describe("guides (B-25)", () => {
  it("lists every guide in the sitemap", () => {
    const paths = sitemap().map((e) => new URL(e.url).pathname);
    for (const g of GUIDES) expect(paths, g.slug).toContain(`/guides/${g.slug}`);
  });

  it("dates every guide with a real calendar day", () => {
    for (const g of GUIDES) {
      expect(g.lastVerified, g.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(g.lastVerified)), g.slug).toBe(false);
    }
  });

  it("says what the product does not do on every guide, and carries the disclaimer", () => {
    for (const g of GUIDES) expect(g.appealDeck.doesNot.length, g.slug).toBeGreaterThan(0);
    expect(GUIDES_COMMON.disclaimer).toMatch(/not legal advice/);
    expect(GUIDES_COMMON.disclaimer).toMatch(/not affiliated with Amazon/);
  });

  it("keeps slugs unique", () => {
    expect(new Set(GUIDES.map((g) => g.slug)).size).toBe(GUIDES.length);
  });

  // Search results cut titles near 60 characters and descriptions near 160. The layout appends
  // " · AppealDeck" (13 characters) to every title except the home page's.
  it("keeps every public title and description short enough to show whole in search results", () => {
    const suffixed = [
      ...GUIDES.map((g) => g.metaTitle),
      SHARED.metadata.titlePricing,
      SHARED.metadata.titleFaq,
      SHARED.metadata.titleSupport,
      DECODE.metaTitle,
      GUIDES_COMMON.indexMetaTitle,
    ];
    for (const t of suffixed) expect(t.length + 13, t).toBeLessThanOrEqual(60);
    expect(SHARED.metadata.titleDefault.length).toBeLessThanOrEqual(60);
    for (const d of [
      ...GUIDES.map((g) => g.description),
      SHARED.metadata.description,
      SHARED.metadata.descriptionPricing,
      SHARED.metadata.descriptionFaq,
      DECODE.metaDescription,
    ])
      expect(d.length, d).toBeLessThanOrEqual(160);
  });
});
