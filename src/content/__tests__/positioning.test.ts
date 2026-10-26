import { describe, expect, it } from "vitest";
import { POSITIONING } from "../positioning";
import { SCOPE } from "../scope";
import { HOME, PRICING } from "../marketing";
import { SHARED } from "../shared";

const HEDGE =
  /\bnot a law firm\b|\bnot legal advice\b|\bno outcome is promised\b|\bwe do not promise\b|\bnot a substitute\b|\bnot a lawyer\b/i;
const OUTCOME =
  /\bguarantee\b|\bwin rate\b|\bsuccess rate\b|\breinstat|\bapproved\b|\bodds\b|\bchances\b/i;

/** Every static route a promise may point at. A link to nowhere is worse than no promise. */
const ROUTES = new Set([
  "/",
  "/decode",
  "/pricing",
  "/refund",
  "/privacy",
  "/terms",
  "/support",
  "/how-we-test",
  "/faq",
  "/guides",
  "/check-invoice",
  "/for-professionals",
  "/partners",
  "/changelog",
]);

describe("positioning", () => {
  it("states the division of labour in one sentence, in the same order every time", () => {
    expect(POSITIONING.triad.sentence).toBe(
      "You know your business. We build the record. Amazon decides.",
    );
  });

  it("carries five promises, each with a mechanism and a real link", () => {
    expect(POSITIONING.promises.items).toHaveLength(5);
    for (const promise of POSITIONING.promises.items) {
      expect(promise.title.trim()).not.toBe("");
      expect(promise.body.trim()).not.toBe("");
      expect(promise.short.trim()).not.toBe("");
      expect(promise.label.trim()).not.toBe("");
      const route = promise.href.split("#")[0] ?? "";
      expect(ROUTES.has(route)).toBe(true);
    }
  });

  it("promises only what the product does, never how Amazon will decide", () => {
    const promises = POSITIONING.promises.items
      .map((promise) => `${promise.title} ${promise.body} ${promise.short}`)
      .join(" ");
    expect(promises).not.toMatch(OUTCOME);
  });

  it("keeps legal-scope wording out of the prominent buying surfaces", () => {
    const prominent = [
      HOME.hero.headline,
      HOME.hero.subline,
      HOME.hero.reassuranceLine,
      PRICING.headline,
      PRICING.subline,
      PRICING.readFirstTitle,
      PRICING.checkoutNote,
      ...PRICING.limits.flatMap((limit) => [limit.title, limit.body]),
      SHARED.footer.category,
      POSITIONING.category,
      POSITIONING.mechanism,
      ...POSITIONING.promises.items.flatMap((promise) => [
        promise.title,
        promise.body,
        promise.short,
      ]),
    ].join(" ");
    expect(prominent).not.toMatch(HEDGE);
  });

  it("names the category once and uses the same sentence in the footer", () => {
    expect(POSITIONING.category).toMatch(/^Self-help case-preparation software/);
    expect(SHARED.footer.category).toBe(POSITIONING.category);
  });

  it("keeps the outcome boundary available for the surfaces that must state it", () => {
    expect(SCOPE.outcome).toMatch(/Amazon decides the result/);
    expect(SCOPE.guide).toMatch(/not legal advice/);
  });
});
