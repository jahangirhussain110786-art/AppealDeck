import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseState: { count: number | null; error: unknown } = { count: 0, error: null };
vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ count: supabaseState.count, error: supabaseState.error }),
      }),
    }),
  },
}));

import {
  accountPassEnabled,
  accountPassPriceId,
  casePassPriceId,
  foundingCode,
  foundingEnabled,
  foundingSpots,
  parsePlan,
} from "../plans";
import { foundingSpotsLeft } from "../founding";

beforeEach(() => {
  vi.unstubAllEnvs();
  supabaseState.count = 0;
  supabaseState.error = null;
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

  it("counts down from the total by the Passes sold", async () => {
    supabaseState.count = 7;
    expect(await foundingSpotsLeft()).toBe(18);
  });

  it("never goes below none", async () => {
    supabaseState.count = 400;
    expect(await foundingSpotsLeft()).toBe(0);
  });

  it("says nothing rather than guessing when the count cannot be read", async () => {
    supabaseState.count = null;
    expect(await foundingSpotsLeft()).toBeNull();
    supabaseState.count = 3;
    supabaseState.error = { message: "down" };
    expect(await foundingSpotsLeft()).toBeNull();
  });

  it("is off when the offer is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_FOUNDING_CODE", "");
    expect(await foundingSpotsLeft()).toBeNull();
  });
});
