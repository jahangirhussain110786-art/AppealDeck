import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { PlanCards, planCards } from "../PlanCards";

beforeEach(() => vi.unstubAllEnvs());

/** A card without its button (React nodes cannot be compared across two builds) or its extra. */
function content(cards: ReturnType<typeof planCards>) {
  return cards.map(({ cta: _cta, extra: _extra, ...rest }) => rest);
}

describe("the home page's plan cards (26 Oct 2026)", () => {
  it("are the cards /pricing builds, not a second copy", () => {
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "on");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "pri_account");
    expect(content(planCards(() => "/pricing?plan=case#purchase"))).toEqual(content(planCards()));
  });

  it("show the free card as /pricing does, in its two labelled parts", () => {
    const html = renderToStaticMarkup(<PlanCards titleAs="h3" />);
    expect(html).toContain("For everyone");
    expect(html).toContain(">No account</h3>");
    expect(html).toContain(">With a free account</h3>");
    // The wording this page used on its own until today.
    expect(html).not.toContain("No account needed");
  });

  it("name the plan in a home-page button, so the choice survives the page load", () => {
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "on");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "pri_account");
    const html = renderToStaticMarkup(
      <PlanCards purchaseHrefFor={(plan) => `/pricing?plan=${plan}#purchase`} />,
    );
    // The free card links to the decoder; each paid card names itself, because the choice is only in
    // memory and a page load would otherwise drop it back to the Appeal Pass. One Response has no
    // link here: previewed but unsold, it shows "Opens soon".
    expect(html).toContain('href="/pricing?plan=case#purchase"');
    expect(html).toContain('href="/pricing?plan=account#purchase"');
    expect(html).not.toContain('href="#purchase"');
  });

  it("drop the card names a heading level under the page's own heading", () => {
    const html = renderToStaticMarkup(<PlanCards titleAs="h3" />);
    expect(html).toContain('class="text-sm font-semibold text-muted-foreground">Free</h3>');
    expect(html).not.toContain("<h2");
  });
});
