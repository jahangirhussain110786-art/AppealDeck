import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

let session: "signed-out" | "signed-in" | "unknown" = "signed-out";

vi.mock("@/components/pricing/PurchasePanel", () => ({
  PurchasePanel: ({ plan }: { plan?: string }) => <div data-testid="panel" data-plan={plan} />,
}));
vi.mock("@/components/CheckoutButton", () => ({
  CheckoutButton: ({ plan }: { plan?: string }) => <button data-plan={plan}>pay</button>,
}));
vi.mock("@/lib/useSessionState", () => ({ useSessionState: () => session }));

import { ProPurchase } from "@/components/ProPurchase";
import { PurchaseSection, orderFor } from "../PurchaseSection";
import { PRODUCTS } from "@/content/purchases";

afterEach(() => {
  vi.unstubAllEnvs();
  session = "signed-out";
});

const dollars = (text: string) => Number(text.replace(/[$,]/g, ""));

describe("the order summary for the new products", () => {
  it("is the review at its own price", () => {
    const o = orderFor("review");
    expect(o.title).toBe("AI document review");
    expect(o.total).toBe("$49.00");
    expect(o.rows[0]).toEqual(["Five documents, one case", "$49.00", false]);
  });

  it("shows the review's price coming off the Appeal Pass, and a total that is the difference", () => {
    const o = orderFor("case", { credited: true });
    expect(o.total).toBe("$200.00");
    const credit = o.rows.find(([label]) => label.includes("already taken off"));
    expect(credit?.[1]).toBe("−$49.00");
    // the rows tell the same story the total does: list price less the credit
    const list = dollars(o.rows[0]![1]);
    expect(list - dollars(PRODUCTS.review.amount)).toBe(dollars(o.total));
  });

  it("leaves the plain Appeal Pass at its full price when there is no review", () => {
    expect(orderFor("case").total).toBe("$249.00");
    expect(orderFor("case", { credited: false }).total).toBe("$249.00");
  });
});

describe("the purchase section", () => {
  it("offers the review beside the Appeal Pass, starting on the Appeal Pass", () => {
    const html = renderToStaticMarkup(<PurchaseSection accountEnabled={false} reviewEnabled />);
    expect(html).toContain("AI document review");
    expect(html).toContain("$49");
    expect(html).toContain('data-plan="case"');
    const input = (value: string) =>
      html.match(new RegExp(`<input[^>]*value="${value}"[^>]*>`))?.[0] ?? "";
    expect(input("case")).toContain("checked");
    expect(input("review")).not.toContain("checked");
  });

  it("offers all three when the Account Pass and the review are both on sale", () => {
    const html = renderToStaticMarkup(<PurchaseSection accountEnabled reviewEnabled />);
    for (const value of ["case", "account", "review"]) expect(html).toContain(`value="${value}"`);
  });

  it("does not call the list 'Which Pass?' once it holds the review, which is not a Pass", () => {
    const withReview = renderToStaticMarkup(<PurchaseSection accountEnabled reviewEnabled />);
    expect(withReview).toContain("What to buy");
    expect(withReview).not.toContain("Which Pass?");
    const passesOnly = renderToStaticMarkup(<PurchaseSection accountEnabled />);
    expect(passesOnly).toContain("Which Pass?");
  });

  it("shows no review when it is not on sale", () => {
    const html = renderToStaticMarkup(<PurchaseSection accountEnabled={false} />);
    expect(html).not.toContain("AI document review");
    expect(html).not.toContain('value="review"');
  });
});

describe("the professionals' purchase panel", () => {
  const PACKS = {
    NEXT_PUBLIC_PADDLE_PRICE_PACK_10: "pri_10",
    NEXT_PUBLIC_PADDLE_PRICE_PACK_30: "pri_30",
  };
  const clear = () => {
    for (const key of [
      "NEXT_PUBLIC_PADDLE_PRICE_PACK_10",
      "NEXT_PUBLIC_PADDLE_PRICE_PACK_30",
      "NEXT_PUBLIC_PADDLE_PRICE_PRO_PLAN",
    ])
      vi.stubEnv(key, "");
  };

  it("renders nothing while no professional price is on sale", () => {
    clear();
    expect(renderToStaticMarkup(<ProPurchase />)).toBe("");
  });

  it("shows only the products that have a price, each with its cost per case", () => {
    clear();
    for (const [k, v] of Object.entries(PACKS)) vi.stubEnv(k, v);
    const html = renderToStaticMarkup(<ProPurchase />);
    expect(html).toContain("10 case credits");
    expect(html).toContain("$390");
    expect(html).toContain("$39 a case");
    expect(html).toContain("30 case credits");
    expect(html).toContain("$870");
    expect(html).toContain("$29 a case");
    // the intro names the Pro plan in general; its card and price appear only once it has a price
    expect(html).not.toContain("$349");
    expect(html).not.toContain("a month");
  });

  it("says what a credit is and how a professional is verified, before any card is asked for", () => {
    clear();
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PRO_PLAN", "pri_pro");
    const html = renderToStaticMarkup(<ProPurchase />);
    expect(html).toContain("A case credit activates one case");
    expect(html).toContain("verify each one by hand");
    expect(html).toContain("$349 a month");
    expect(html).toContain("Ten case credits every month, $34.90 a case");
  });

  it("sends a signed-out visitor to sign in, and shows no pay button to them", () => {
    clear();
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PACK_10", "pri_10");
    const html = renderToStaticMarkup(<ProPurchase />);
    expect(html).toContain("/login?next=/for-professionals");
    expect(html).not.toContain("<button");
  });

  it("shows no pay button to a signed-in account until it is known to be verified", () => {
    clear();
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PACK_10", "pri_10");
    session = "signed-in";
    const html = renderToStaticMarkup(<ProPurchase />);
    expect(html).not.toContain("<button");
    expect(html).not.toContain("Ask to be verified");
  });
});
