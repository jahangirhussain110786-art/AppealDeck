import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Everything a visitor could read about the products beyond the Appeal Pass and the Account Pass (the
 * AI document review, the renewal, case credits and the Pro plan, and the $25 rebate) exists only
 * while that product is on sale or switched on. Each page's copy is built when its module loads, so
 * these tests set the environment first and import afterwards.
 */
type Env = Record<string, string>;

const NONE: Env = {
  NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS: "",
  NEXT_PUBLIC_PADDLE_PRICE_SINGLE_RESPONSE: "",
  NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_SINGLE: "",
  NEXT_PUBLIC_PADDLE_PRICE_DOCUMENT_REVIEW: "",
  NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_REVIEW: "",
  NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_RENEWAL: "",
  NEXT_PUBLIC_PADDLE_PRICE_PACK_10: "",
  NEXT_PUBLIC_PADDLE_PRICE_PACK_30: "",
  NEXT_PUBLIC_PADDLE_PRICE_PRO_PLAN: "",
  NEXT_PUBLIC_REBATE_ENABLED: "",
  // These tests are about what is on sale; showing what is not on sale yet is `describe("previewing")`.
  NEXT_PUBLIC_PLANS_PREVIEW: "off",
};

async function load(env: Env = {}) {
  vi.resetModules();
  for (const [key, value] of Object.entries({ ...NONE, ...env })) vi.stubEnv(key, value);
  const [marketing, legal, changelog, audiences] = await Promise.all([
    import("../marketing"),
    import("../legal"),
    import("../changelog"),
    import("../audiences"),
  ]);
  return { marketing, legal, changelog, audiences };
}

const ids = (m: Awaited<ReturnType<typeof load>>["marketing"]) => m.FAQ.items.map((i) => i.id);
const terms = (l: Awaited<ReturnType<typeof load>>["legal"]) => JSON.stringify(l.LEGAL.terms);
const privacy = (l: Awaited<ReturnType<typeof load>>["legal"]) => JSON.stringify(l.LEGAL.privacy);
const log = (c: Awaited<ReturnType<typeof load>>["changelog"]) =>
  JSON.stringify(c.CHANGELOG.entries);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("with nothing configured", () => {
  it("no page mentions any of them", async () => {
    const { marketing, legal, changelog, audiences } = await load();
    for (const id of ["document-review", "renewal", "credits", "rebate"]) {
      expect(ids(marketing)).not.toContain(id);
      expect(JSON.stringify(marketing.FAQ.groups)).not.toContain(id);
    }
    for (const text of [terms(legal), privacy(legal), log(changelog)]) {
      expect(text).not.toMatch(/case credit|Pro plan|AI document review|renewal adds|One Response/);
    }
    // The partner code's own $25 is in the changelog already, so the rebate is checked where it is new.
    for (const text of [terms(legal), privacy(legal)]) expect(text).not.toContain("$25");
    expect(audiences.PROS.cost.open).toBe("Professional pricing is not set yet.");
    expect(audiences.PROS.cost.pro).toBeNull();
    expect(marketing.FAQ.items.find((i) => i.id === "writers")?.a).toMatch(/^Not yet/);
  });
});

describe("One Response", () => {
  it("is described in the Terms and the changelog only once it is on sale, and says what it does not cover", async () => {
    const off = await load();
    expect(terms(off.legal)).not.toContain("One Response");
    expect(log(off.changelog)).not.toContain("One Response");
    const on = await load({ NEXT_PUBLIC_PADDLE_PRICE_SINGLE_RESPONSE: "pri_single" });
    expect(terms(on.legal)).toMatch(/One Response is one purchase for one case/);
    expect(terms(on.legal)).toMatch(/does not cover a response to a later reply from Amazon/);
    expect(terms(on.legal)).toMatch(/14-day refund window/);
    expect(log(on.changelog)).toContain("One Response is on sale: $99");
    // The credit is promised only once its own price exists.
    expect(terms(on.legal)).not.toMatch(/price of the One Response comes off/);
    expect(log(on.changelog)).not.toContain("upgrades to the Appeal Pass");
    const up = await load({
      NEXT_PUBLIC_PADDLE_PRICE_SINGLE_RESPONSE: "pri_single",
      NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_SINGLE: "pri_after",
    });
    expect(terms(up.legal)).toMatch(/price of the One Response comes off/);
    expect(log(up.changelog)).toContain("upgrades to the Appeal Pass at a credited price");
  });
});

describe("the AI document review", () => {
  it("needs both its price and the credited Appeal Pass price", async () => {
    const half = await load({ NEXT_PUBLIC_PADDLE_PRICE_DOCUMENT_REVIEW: "pri_review" });
    expect(ids(half.marketing)).not.toContain("document-review");
    expect(terms(half.legal)).not.toContain("AI document review");
  });

  it("appears everywhere once both are set", async () => {
    const on = await load({
      NEXT_PUBLIC_PADDLE_PRICE_DOCUMENT_REVIEW: "pri_review",
      NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_REVIEW: "pri_after",
    });
    const item = on.marketing.FAQ.items.find((i) => i.id === "document-review");
    expect(item?.a).toMatch(/\$49/);
    expect(item?.detail).toMatch(/comes off the Appeal Pass/);
    expect(item?.detail).toMatch(/14-day refund/);
    expect(on.marketing.faqByGroup().flatMap((g) => g.items.map((i) => i.id))).toContain(
      "document-review",
    );
    expect(terms(on.legal)).toMatch(/review's price comes off it/);
    expect(log(on.changelog)).toContain("A new AI document review");
  });
});

describe("the renewal", () => {
  it("exists only where the Account Pass does", async () => {
    const alone = await load({ NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_RENEWAL: "pri_renew" });
    expect(ids(alone.marketing)).not.toContain("renewal");
    const both = await load({
      NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS: "pri_account",
      NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_RENEWAL: "pri_renew",
    });
    expect(ids(both.marketing)).toContain("renewal");
    expect(terms(both.legal)).toMatch(/start when the last cover ends/);
    expect(log(both.changelog)).toContain("renewed for $99");
  });
});

describe("case credits and the Pro plan", () => {
  it("replace the not-yet-set answer on the writers page and in the FAQ", async () => {
    const on = await load({ NEXT_PUBLIC_PADDLE_PRICE_PACK_10: "pri_pack10" });
    expect(on.audiences.PROS.cost.open).toBeNull();
    expect(on.audiences.PROS.cost.openBody).toBeNull();
    expect(on.audiences.PROS.cost.pro).toMatch(/packs of 10 for \$390/);
    expect(on.marketing.FAQ.items.find((i) => i.id === "writers")?.a).toMatch(/^Yes/);
    expect(ids(on.marketing)).toContain("credits");
    expect(terms(on.legal)).toMatch(/A case credit gives one case an Appeal Pass/);
    expect(terms(on.legal)).toMatch(/verified by hand/);
    expect(privacy(on.legal)).toMatch(/ledger of the credits/);
  });

  it("says the Pro plan renews monthly only when the Pro plan is on sale", async () => {
    const packs = await load({ NEXT_PUBLIC_PADDLE_PRICE_PACK_30: "pri_pack30" });
    expect(terms(packs.legal)).not.toContain("renews every month");
    const pro = await load({ NEXT_PUBLIC_PADDLE_PRICE_PRO_PLAN: "pri_pro" });
    expect(terms(pro.legal)).toMatch(/renews every month until you cancel/);
    expect(terms(pro.legal)).toMatch(/adds ten case credits each month/);
  });
});

describe("the rebate", () => {
  it("is described, in the FAQ, the Terms and the Privacy policy, only when switched on", async () => {
    const on = await load({ NEXT_PUBLIC_REBATE_ENABLED: "true" });
    const item = on.marketing.FAQ.items.find((i) => i.id === "rebate");
    expect(item?.a).toMatch(/whatever the result/);
    expect(item?.detail).toMatch(/Any result counts/);
    expect(terms(on.legal)).toMatch(/whatever the result/);
    expect(terms(on.legal)).toMatch(/does not end your Appeal Pass/);
    expect(privacy(on.legal)).toMatch(/linked to your account so we know whom to refund/);
  });

  it("is not switched on by anything other than the exact word true", async () => {
    const off = await load({ NEXT_PUBLIC_REBATE_ENABLED: "yes" });
    expect(ids(off.marketing)).not.toContain("rebate");
  });
});

describe("previewing what is not on sale yet", () => {
  const PREVIEW = { NEXT_PUBLIC_PLANS_PREVIEW: "on" };

  it("shows the Account Pass, the review and the professional prices, each as opening soon", async () => {
    const { marketing, audiences } = await load(PREVIEW);
    for (const id of ["account-pass", "document-review", "credits"]) {
      const item = marketing.FAQ.items.find((i) => i.id === id);
      expect(item?.a, id).toMatch(/^Opening soon\. /);
      expect(
        marketing.FAQ.groups.flatMap((g) => [...g.items]),
        id,
      ).toContain(id);
    }
    expect(marketing.FAQ.items.find((i) => i.id === "writers")?.a).toMatch(/^Opening soon\. Yes/);
    expect(audiences.PROS.cost.open).toBeNull();
    expect(audiences.PROS.cost.pro).toMatch(/packs of 10 for \$390/);
    expect(audiences.PROS.cost.pro).toMatch(/Not on sale yet/);
  });

  it("promises nothing that happens only after a purchase: no renewal, no rebate", async () => {
    const { marketing } = await load(PREVIEW);
    expect(marketing.FAQ.items.some((i) => i.id === "renewal")).toBe(false);
    expect(marketing.FAQ.items.some((i) => i.id === "rebate")).toBe(false);
  });

  it("says nothing in the Terms, the Privacy policy or the changelog until a product is on sale", async () => {
    const { legal, changelog } = await load(PREVIEW);
    expect(terms(legal)).not.toMatch(
      /case credit|Pro plan|AI document review|Account Pass is one licence/,
    );
    expect(privacy(legal)).not.toMatch(/ledger of the credits|\$25/);
    expect(log(changelog)).not.toMatch(
      /A new AI document review|Case credits for verified|The Account Pass is on sale/,
    );
  });

  it("drops the 'opening soon' lead once the product is on sale", async () => {
    const { marketing } = await load({
      ...PREVIEW,
      NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS: "pri_account",
    });
    expect(marketing.FAQ.items.find((i) => i.id === "account-pass")?.a).not.toMatch(/Opening soon/);
    // the others are still only previewed
    expect(marketing.FAQ.items.find((i) => i.id === "document-review")?.a).toMatch(/^Opening soon/);
  });

  it("requires an explicit on to preview unavailable products", async () => {
    const off = await load({ NEXT_PUBLIC_PLANS_PREVIEW: "off" });
    expect(off.marketing.FAQ.items.some((i) => i.id === "document-review")).toBe(false);
    const unset = await load({ NEXT_PUBLIC_PLANS_PREVIEW: "" });
    expect(unset.marketing.FAQ.items.some((i) => i.id === "document-review")).toBe(false);
  });
});
