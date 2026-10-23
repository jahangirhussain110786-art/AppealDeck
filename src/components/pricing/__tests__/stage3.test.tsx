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
import { ProfessionalCards } from "../ProfessionalCards";
import { PartnerCards } from "../PartnerCards";
import { PricingStage } from "../PricingStage";
import { PriceCardGrid, gridClassFor } from "../PriceCards";
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

  it("renders nothing while no professional price is on sale and the preview is off", () => {
    clear();
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "off");
    expect(renderToStaticMarkup(<ProPurchase />)).toBe("");
  });

  it("no longer draws price cards itself: the cards are the page's, the controls are here", () => {
    clear();
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "off");
    for (const [k, v] of Object.entries(PACKS)) vi.stubEnv(k, v);
    const html = renderToStaticMarkup(<ProPurchase />);
    expect(html).not.toContain("$390");
    expect(html).not.toContain("$39 a case");
    expect(html).toContain("/login?next=/for-professionals");
  });

  it("says what a credit is and how a professional is verified, before any card is asked for", () => {
    clear();
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PRO_PLAN", "pri_pro");
    const html = renderToStaticMarkup(<ProPurchase />);
    expect(html).toContain("A case credit activates one case");
    expect(html).toContain("verify each one by hand");
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

describe("the preview of what is not on sale yet", () => {
  it("shows the professional prices as opening soon, with no way to buy and a way to ask", () => {
    for (const key of [
      "NEXT_PUBLIC_PADDLE_PRICE_PACK_10",
      "NEXT_PUBLIC_PADDLE_PRICE_PACK_30",
      "NEXT_PUBLIC_PADDLE_PRICE_PRO_PLAN",
    ])
      vi.stubEnv(key, "");
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "on");
    session = "signed-in";
    const html = renderToStaticMarkup(<ProPurchase />);
    expect(html).toContain("Not on sale yet");
    expect(html).toContain("Ask to be verified");
    // no sign-in prompt, no consent box, no pay button, whoever is looking
    expect(html).not.toContain("<button");
    expect(html).not.toContain('type="checkbox"');
    expect(html).not.toContain("/login?next=");
  });

  it("marks only the products that are not on sale, when some are", () => {
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PACK_10", "pri_10");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PACK_30", "");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PRO_PLAN", "");
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "on");
    const html = renderToStaticMarkup(<ProPurchase />);
    // something can be bought, so the sign-in link is there and the "not on sale" notice is not
    expect(html).toContain("/login?next=");
    expect(html).not.toContain("Not on sale yet");
  });
});

const clearPro = () => {
  for (const key of [
    "NEXT_PUBLIC_PADDLE_PRICE_PACK_10",
    "NEXT_PUBLIC_PADDLE_PRICE_PACK_30",
    "NEXT_PUBLIC_PADDLE_PRICE_PRO_PLAN",
  ])
    vi.stubEnv(key, "");
};

describe("the writers' price cards", () => {
  it("lead with what is free, then the Appeal Pass, then credits and the Pro plan, each with its price", () => {
    clearPro();
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "on");
    const html = renderToStaticMarkup(<ProfessionalCards />);
    const order = ["For every client case", "Appeal Pass", "Case credits", "Pro plan"].map((n) =>
      html.indexOf(n),
    );
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    for (const shown of [
      "$0",
      "$249",
      "$29",
      "10 credits for $390 ($39 a case)",
      "30 credits for $870 ($29 a case)",
      "$349",
      "a month",
      "10 case credits every month ($34.90 a case)",
    ])
      expect(html, shown).toContain(shown);
    expect(html).toContain("xl:grid-cols-4");
  });

  it("previews credits and the Pro plan with a disabled Opens soon, and gives them no way to buy", () => {
    clearPro();
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "on");
    const html = renderToStaticMarkup(<ProfessionalCards />);
    expect(html.match(/disabled[^>]*>[^<]*Opens soon/g)).toHaveLength(2);
    expect(html).not.toContain('href="#buy"');
  });

  it("gives a product that is on sale a working button to the buying controls", () => {
    clearPro();
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "on");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PACK_10", "pri_10");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PRO_PLAN", "pri_pro");
    const html = renderToStaticMarkup(<ProfessionalCards />);
    expect(html).toContain('href="#buy"');
    expect(html).not.toContain("Opens soon");
  });

  it("shows only the free tools and the Appeal Pass when the preview is off and nothing is on sale", () => {
    clearPro();
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "off");
    const html = renderToStaticMarkup(<ProfessionalCards />);
    expect(html).toContain("For every client case");
    expect(html).toContain("No account");
    expect(html).toContain("With a free account");
    expect(html).toContain("Appeal Pass");
    expect(html).not.toContain("Case credits");
    expect(html).not.toContain("Pro plan");
    expect(html).toContain("sm:grid-cols-2");
  });

  it("puts the Pro plan on the inverted panel, the one that covers the most", () => {
    clearPro();
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "on");
    const html = renderToStaticMarkup(<ProfessionalCards />);
    expect(html.match(/shadow-stage/g)).toHaveLength(1);
    expect(html.indexOf("shadow-stage")).toBeLessThan(html.indexOf("Pro plan"));
  });
});

describe("the partner price cards", () => {
  it("show joining, then each Pass, with what a partner earns on it worked out from the prices", () => {
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "on");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "");
    const html = renderToStaticMarkup(<PartnerCards />);
    for (const shown of [
      "Join",
      "$0",
      "$67.20",
      "The seller pays $224.00: $249 less your $25 discount",
      "$91.20",
      "The seller pays $304.00: $329 less your $25 discount",
      "Thirty percent of what the seller pays",
    ])
      expect(html, shown).toContain(shown);
  });

  it("previews the Account Pass sale with a disabled Opens soon until that Pass is on sale", () => {
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "on");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "");
    expect(renderToStaticMarkup(<PartnerCards />)).toMatch(/disabled[^>]*>[^<]*Opens soon/);
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "pri_account");
    expect(renderToStaticMarkup(<PartnerCards />)).not.toContain("Opens soon");
  });

  it("leaves out the Account Pass card when the preview is off and it is not on sale", () => {
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "off");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "");
    const html = renderToStaticMarkup(<PartnerCards />);
    expect(html).not.toContain("An Account Pass sale");
    expect(html).toContain("An Appeal Pass sale");
  });

  it("opens with a mail link to apply, on the inverted panel", () => {
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "off");
    const html = renderToStaticMarkup(<PartnerCards />);
    expect(html).toMatch(/href="mailto:[^"]+Partner(%20| )program/);
    expect(html.indexOf("shadow-stage")).toBeLessThan(html.indexOf("Join"));
  });
});

describe("the shared pricing layout", () => {
  it("lays out two or three cards in one row, and four two by two", () => {
    expect(gridClassFor(2)).toBe("sm:grid-cols-2");
    expect(gridClassFor(3)).toBe("lg:grid-cols-3");
    expect(gridClassFor(4)).toBe("sm:grid-cols-2 xl:grid-cols-4");
  });

  it("draws a card's price, unit, features and button, and the inverted panel only when featured", () => {
    const html = renderToStaticMarkup(
      <PriceCardGrid
        cards={[
          {
            key: "a",
            name: "A",
            note: "note a",
            price: "$1",
            unit: "a month",
            features: ["one", "two"],
            cta: <button>go a</button>,
          },
          {
            key: "b",
            name: "B",
            note: "note b",
            price: "$2",
            features: [],
            featured: true,
            cta: null,
          },
        ]}
      />,
    );
    expect(html).toContain("$1");
    expect(html).toContain("a month");
    expect(html).toContain("one");
    expect(html).toContain("go a");
    expect(html.match(/shadow-stage/g)).toHaveLength(1);
  });

  it("opens every pricing page with the same stage: the headline, the line under it and the audience switch", () => {
    vi.mock("next/navigation", () => ({ usePathname: () => "/pricing" }));
    const html = renderToStaticMarkup(
      <PricingStage
        title="Prices for everyone."
        accent="everyone."
        subline="One system."
        note="A note."
      >
        <p>extra</p>
      </PricingStage>,
    );
    expect(html).toContain("<h1");
    expect(html).toContain("Prices for ");
    expect(html).toContain("everyone.");
    expect(html).toContain("One system.");
    expect(html).toContain("A note.");
    for (const label of ["Sellers", "Writers and VA teams", "Partners"])
      expect(html).toContain(label);
    expect(html).toContain("extra");
  });
});
