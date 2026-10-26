import { beforeEach, describe, expect, it, vi } from "vitest";

const discount = {
  code: "FOUNDING",
  status: "active",
  enabled_for_checkout: true,
  type: "flat",
  amount: "8000",
  currency_code: "USD",
  recur: false,
  usage_limit: 25,
  times_used: 0,
  restrict_to: ["pri_account"],
  expires_at: null,
};

import {
  accountPassEnabled,
  accountPassPriceId,
  casePassPriceId,
  foundingCode,
  foundingEnabled,
  foundingSpots,
  listedPaidPlans,
  parsePlan,
  priceIdFor,
  singleEnabled,
  singleListed,
  upgradeEnabled,
  passAfterSinglePriceId,
  extraPriceIds,
  PLAN_NEEDS_CASE,
} from "../plans";
import { foundingSpotsLeft } from "../founding";

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.stubEnv("PADDLE_API_KEY", "test-key");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: [{ ...discount }] })));
});

describe("plans read the environment when asked, not when imported", () => {
  it("has no Account Pass until its price is set, and the Appeal Pass is independent of it", () => {
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS", "pri_case");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "");
    expect(accountPassEnabled()).toBe(false);
    expect(accountPassPriceId()).toBeUndefined();
    expect(casePassPriceId()).toBe("pri_case");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "pri_account");
    expect(accountPassEnabled()).toBe(true);
    expect(accountPassPriceId()).toBe("pri_account");
  });

  it("accepts only a usable founding code, upper-cased", () => {
    vi.stubEnv("NEXT_PUBLIC_FOUNDING_CODE", " founding ");
    expect(foundingCode()).toBe("FOUNDING");
    for (const bad of ["", "ab", "has space", "<x>", "a".repeat(40)]) {
      vi.stubEnv("NEXT_PUBLIC_FOUNDING_CODE", bad);
      expect(foundingCode(), bad).toBeUndefined();
    }
  });

  it("has a founding offer only for the Account Pass and only with a code", () => {
    vi.stubEnv("NEXT_PUBLIC_FOUNDING_CODE", "FOUNDING");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "");
    expect(foundingEnabled()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "pri_account");
    expect(foundingEnabled()).toBe(true);
    vi.stubEnv("NEXT_PUBLIC_FOUNDING_CODE", "");
    expect(foundingEnabled()).toBe(false);
  });

  it("covers 25 Passes unless told otherwise, and ignores a nonsense number", () => {
    expect(foundingSpots()).toBe(25);
    vi.stubEnv("NEXT_PUBLIC_FOUNDING_SPOTS", "10");
    expect(foundingSpots()).toBe(10);
    for (const bad of ["0", "-3", "2.5", "abc", "5000"]) {
      vi.stubEnv("NEXT_PUBLIC_FOUNDING_SPOTS", bad);
      expect(foundingSpots(), bad).toBe(25);
    }
  });

  it("reads any plan but 'account' as the Appeal Pass", () => {
    expect(parsePlan("account")).toBe("account");
    for (const other of ["case", "", undefined, null, "ACCOUNT", 3])
      expect(parsePlan(other)).toBe("case");
  });
});

describe("founding spots left", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "pri_account");
    vi.stubEnv("NEXT_PUBLIC_FOUNDING_CODE", "FOUNDING");
  });

  it("counts this discount's redemptions, not unrelated Pass sales", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ data: [{ ...discount, times_used: 7 }] })),
    );
    expect(await foundingSpotsLeft()).toBe(18);
  });

  it("never goes below none", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ data: [{ ...discount, times_used: 400 }] })),
    );
    expect(await foundingSpotsLeft()).toBe(0);
  });

  it("says nothing rather than guessing when the count cannot be read", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 503 })));
    expect(await foundingSpotsLeft()).toBeNull();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ data: [{ ...discount, usage_limit: 100 }] })),
    );
    expect(await foundingSpotsLeft()).toBeNull();
  });

  it("is off when the offer is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_FOUNDING_CODE", "");
    expect(await foundingSpotsLeft()).toBeNull();
  });
});

describe("One Response (23 Oct 2026)", () => {
  it("is on sale only when its price is set, and listed when on sale or previewed", () => {
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_SINGLE_RESPONSE", "");
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "off");
    expect(singleEnabled()).toBe(false);
    expect(singleListed()).toBe(false);
    expect(priceIdFor("single")).toBeUndefined();
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "on");
    expect(singleListed()).toBe(true);
    expect(singleEnabled()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_SINGLE_RESPONSE", "pri_single");
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "off");
    expect(singleEnabled()).toBe(true);
    expect(singleListed()).toBe(true);
    expect(priceIdFor("single")).toBe("pri_single");
  });

  it("is bought for a case, is known to the webhook by its kind, and is a plan a client may send", () => {
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_SINGLE_RESPONSE", "pri_single");
    expect(PLAN_NEEDS_CASE.single).toBe(true);
    expect(extraPriceIds()).toMatchObject({ single_response: "pri_single" });
    expect(parsePlan("single")).toBe("single");
  });

  it("does not appear in what the webhook is told while it has no price", () => {
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_SINGLE_RESPONSE", "");
    expect(extraPriceIds()).not.toHaveProperty("single_response");
  });
});

describe("the plans every seller-facing surface shows (24 Oct 2026)", () => {
  it("is the Appeal Pass alone when nothing else is listed", () => {
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_SINGLE_RESPONSE", "");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "");
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "off");
    expect(listedPaidPlans()).toEqual(["case"]);
  });

  it("adds One Response and the Account Pass on sale, in display order", () => {
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_SINGLE_RESPONSE", "pri_single");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "pri_account");
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "off");
    expect(listedPaidPlans()).toEqual(["single", "case", "account"]);
  });

  it("treats a previewed plan as listed, exactly as the cards and table do", () => {
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_SINGLE_RESPONSE", "");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "");
    vi.stubEnv("NEXT_PUBLIC_PLANS_PREVIEW", "on");
    expect(listedPaidPlans()).toEqual(["single", "case", "account"]);
  });
});

describe("the credited upgrade from One Response (23 Oct 2026)", () => {
  it("exists only where both the One Response and its credited Appeal Pass price are set", () => {
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_SINGLE_RESPONSE", "pri_single");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_SINGLE", "");
    expect(upgradeEnabled()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_SINGLE", "pri_after");
    expect(upgradeEnabled()).toBe(true);
    expect(passAfterSinglePriceId()).toBe("pri_after");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_SINGLE_RESPONSE", "");
    expect(upgradeEnabled()).toBe(false);
  });

  it("is handed to the webhook only when configured", () => {
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_SINGLE", "pri_after");
    expect(extraPriceIds()).toMatchObject({ pass_after_single: "pri_after" });
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_SINGLE", "");
    expect(extraPriceIds()).not.toHaveProperty("pass_after_single");
  });
});
