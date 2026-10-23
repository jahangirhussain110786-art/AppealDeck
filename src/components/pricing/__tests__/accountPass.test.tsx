import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/pricing/PurchasePanel", () => ({
  PurchasePanel: ({ plan }: { plan?: string }) => <div data-testid="panel" data-plan={plan} />,
}));

import { PlanCards } from "../PlanCards";
import { PurchaseSection, orderFor } from "../PurchaseSection";

beforeEach(() => vi.unstubAllEnvs());

describe("the plan cards", () => {
  it("are Free and the Appeal Pass while nothing else has a price and the preview is off", () => {
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "");
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "off");
    const html = renderToStaticMarkup(<PlanCards />);
    expect(html).not.toContain("Account Pass");
    expect(html).not.toContain("One Response");
    expect(html).toContain("Appeal Pass");
    expect(html).toContain("Get the Appeal Pass");
    expect(html).toContain("sm:grid-cols-2");
  });

  it("merge the free account into the Free card and list One Response as the smallest paid plan", () => {
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "");
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "on");
    const html = renderToStaticMarkup(<PlanCards />);
    expect(html).not.toContain("Free account</p>");
    expect(html).toContain("For everyone");
    expect(html).toContain("No account");
    expect(html).toContain("With a free account");
    expect(html).toContain("Case saved on your device");
    expect(html).toContain("One Response");
    expect(html).toContain("$99");
    expect(html).toContain("No further responses");
    // it cannot be bought yet: Opens soon, never a checkout button
    expect(html).not.toContain("Get the One Response");
    // order on the page: Free, One Response, Appeal Pass, Account Pass
    const order = ["Decode a notice", "One Response", "Get the Appeal Pass", "Account Pass"].map(
      (s) => html.indexOf(s),
    );
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("add the Account Pass as a fourth, featured card once it has a price", () => {
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "pri_account");
    const html = renderToStaticMarkup(<PlanCards />);
    expect(html).toContain("Account Pass");
    expect(html).toContain("$329");
    expect(html).toContain("Get the Account Pass");
    expect(html).toContain("As many cases as you have, for 12 months");
    expect(html).toContain("xl:grid-cols-4");
    // the Appeal Pass card keeps its own button and price
    expect(html).toContain("Get the Appeal Pass");
    expect(html).toContain("$249");
  });
});

describe("the plan cards while the Account Pass is only previewed", () => {
  it("show its price and a disabled Opens soon button, and nothing that opens a checkout", () => {
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "");
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "on");
    const html = renderToStaticMarkup(<PlanCards />);
    expect(html).toContain("Account Pass");
    expect(html).toContain("$329");
    expect(html).toContain("As many cases as you have, for 12 months");
    expect(html).toContain("xl:grid-cols-4");
    const soon = html.match(/<button[^>]*disabled[^>]*>[^<]*Opens soon/);
    expect(soon).not.toBeNull();
    expect(html).not.toContain("Get the Account Pass");
    // the Appeal Pass beside it is unchanged
    expect(html).toContain("Get the Appeal Pass");
  });
});

describe("the order summary", () => {
  it("is the Appeal Pass for the case plan", () => {
    expect(orderFor("case")).toMatchObject({ title: "Appeal Pass", total: "$249.00" });
    expect(orderFor("case").rows.map((r) => r[1])).toEqual(["$249.00", "Included", "Never"]);
  });

  it("is the Account Pass for the account plan, with its 12 months", () => {
    expect(orderFor("account")).toMatchObject({ title: "Account Pass", total: "$329.00" });
    expect(orderFor("account").rows.map((r) => r[1])).toEqual([
      "$329.00",
      "Included",
      "12 months after you buy",
    ]);
  });
});

describe("the purchase section", () => {
  it("shows no picker, and buys the Appeal Pass, while there is only one Pass", () => {
    const html = renderToStaticMarkup(<PurchaseSection accountEnabled={false} />);
    expect(html).not.toContain("Which Pass?");
    expect(html).toContain('data-plan="case"');
    expect(html).toContain("$249.00");
  });

  it("offers both Passes, starting on the Appeal Pass so nobody is moved to the dearer one", () => {
    const html = renderToStaticMarkup(<PurchaseSection accountEnabled={true} />);
    expect(html).toContain("Which Pass?");
    expect(html).toContain("Appeal Pass");
    expect(html).toContain("Account Pass");
    expect(html).toContain('data-plan="case"');
    const input = (value: string) =>
      html.match(new RegExp(`<input[^>]*value="${value}"[^>]*>`))?.[0] ?? "";
    expect(input("case")).toContain("checked");
    expect(input("account")).not.toContain("checked");
  });
});
