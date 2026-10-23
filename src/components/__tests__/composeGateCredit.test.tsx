import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/CaseCreditCard", () => ({ CaseCreditCard: () => null }));

/**
 * The round-two gate (23 Oct 2026). When a One Response has covered its one response and the credited
 * upgrade exists, the price on the gate must be the credited one, or the page says $249 while the
 * checkout opens at $150. Without the upgrade (or without the note) it is the ordinary price.
 */
async function gate(env: Record<string, string>, props: { note?: string }) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  const { ComposeGate } = await import("../ComposeGate");
  return renderToStaticMarkup(<ComposeGate caseId="c1" {...props} />);
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

const ON = {
  NEXT_PUBLIC_PADDLE_PRICE_SINGLE_RESPONSE: "pri_s",
  NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_SINGLE: "pri_a",
};
const OFF = {
  NEXT_PUBLIC_PADDLE_PRICE_SINGLE_RESPONSE: "",
  NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_SINGLE: "",
};

describe("ComposeGate price", () => {
  it("is the credited price after a One Response, where the upgrade exists", async () => {
    const html = await gate(ON, { note: "Your One Response covers the first response." });
    expect(html).toContain("$150, once, for this case");
    expect(html).toContain("Continue to $150 checkout");
    expect(html).not.toContain("$249");
  });

  it("is the ordinary price with no One Response", async () => {
    const html = await gate(ON, {});
    expect(html).toContain("$249, once, for this case");
    expect(html).toContain("Continue to $249 checkout");
  });

  it("is the ordinary price after a One Response where the upgrade is not configured", async () => {
    const html = await gate(OFF, { note: "Your One Response covers the first response." });
    expect(html).toContain("$249, once, for this case");
    expect(html).not.toContain("$150");
  });
});
