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

describe("comparison pages (23 Oct 2026)", () => {
  const compare = GUIDES.filter((g) => g.compare);
  const text = (g: (typeof compare)[number]) => JSON.stringify(g);

  it("has the two pages a buyer weighing options searches for", () => {
    expect(compare.map((g) => g.slug)).toEqual([
      "chatgpt-for-amazon-appeals",
      "appealspro-alternative",
    ]);
  });

  it("promises no outcome, quotes no success rate and makes no claim about Amazon detecting AI", () => {
    for (const g of compare) {
      expect(text(g), g.slug).not.toMatch(
        /guarantee|success rate|win rate|reinstatement rate|will be (approved|reinstated)|undetectable/i,
      );
      expect(text(g), g.slug).not.toMatch(/amazon (detects|rejects|flags)/i);
    }
  });

  it("states what a competitor does only as read on its own site, with the date", () => {
    const pro = compare.find((g) => g.slug === "appealspro-alternative")!;
    expect(pro.intro).toMatch(/written from AppealsPro's own site on the date shown/);
    expect(pro.lastVerified).toBe("2026-10-23");
    expect(text(pro)).toMatch(/As read on its home page on 23 October 2026/);
    expect(text(pro)).toMatch(/We did not find document checking described/);
    // the one price named is the one read from its site
    expect(text(pro)).toContain("$79.99");
  });

  it("says where the other option is enough", () => {
    expect(text(compare[0]!)).toMatch(/may be all you need/);
    expect(text(compare[1]!)).toMatch(/may suit you better/);
  });

  it("is kept off the decoder's list of guides to kinds of notice", () => {
    expect(GUIDES.filter((g) => !g.compare).map((g) => g.slug)).not.toContain(
      "appealspro-alternative",
    );
  });
});
