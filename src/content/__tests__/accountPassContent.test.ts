import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Everything about the Account Pass that a visitor could read (a FAQ answer, a sentence in the
 * Terms, a line in the changelog) exists only while the Account Pass is on sale. Each is built when
 * its module loads, so these tests set the environment first and import afterwards.
 */
async function load(accountPrice: string) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", accountPrice);
  // Previewing a product that is not on sale is its own case (stage3Content.test.ts); here it is off.
  vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "off");
  const [marketing, legal, changelog] = await Promise.all([
    import("../marketing"),
    import("../legal"),
    import("../changelog"),
  ]);
  return { marketing, legal, changelog };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("while the Account Pass is not on sale", () => {
  it("no page mentions it", async () => {
    const { marketing, legal, changelog } = await load("");
    expect(marketing.FAQ.items.some((i) => i.id === "account-pass")).toBe(false);
    expect(JSON.stringify(marketing.FAQ.groups)).not.toContain("account-pass");
    expect(JSON.stringify(legal.LEGAL.terms)).not.toContain("Account Pass");
    expect(JSON.stringify(changelog.CHANGELOG.entries)).not.toContain("Account Pass");
  });
});

describe("once the Account Pass is on sale", () => {
  it("the FAQ answers what it is, and it is reachable from a group", async () => {
    const { marketing } = await load("pri_account");
    const item = marketing.FAQ.items.find((i) => i.id === "account-pass");
    expect(item?.a).toMatch(/covers every case on your account for 12 months/);
    expect(item?.detail).toMatch(/14-day refund/);
    expect(item?.detail).toMatch(/not for preparing other sellers/);
    const grouped = marketing.FAQ.groups.flatMap((g) => [...g.items]);
    expect(grouped).toContain("account-pass");
    expect(marketing.faqByGroup().flatMap((g) => g.items.map((i) => i.id))).toContain(
      "account-pass",
    );
  });

  it("the Terms say what it covers, when it ends, and that it is for one business", async () => {
    const { legal } = await load("pri_account");
    const licence = JSON.stringify(legal.LEGAL.terms);
    expect(licence).toMatch(/Account Pass is one licence for one seller's business/);
    expect(licence).toMatch(/twelve months from the day you buy it/);
    expect(licence).toMatch(/same 14-day refund window/);
    expect(licence).toMatch(/not for preparing other sellers' cases/);
  });

  it("the changelog says it is on sale", async () => {
    const { changelog } = await load("pri_account");
    expect(JSON.stringify(changelog.CHANGELOG.entries)).toContain("The Account Pass is on sale");
  });
});
