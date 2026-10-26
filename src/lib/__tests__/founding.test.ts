import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * F15 (26 Oct 2026): a hidden founding offer used to be completely silent, so a usage-limit
 * mismatch between Paddle and NEXT_PUBLIC_FOUNDING_SPOTS looked like "the offer ended". The
 * function still returns null, but it must say why once.
 */
const baseDiscount = {
  code: "FOUNDING",
  status: "active",
  enabled_for_checkout: true,
  type: "flat",
  amount: "8000",
  currency_code: "USD",
  recur: false,
  usage_limit: 25,
  times_used: 22,
  restrict_to: ["pri_account"],
  expires_at: null,
};

function mockDiscount(discount: Record<string, unknown>) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [discount] }),
    }),
  );
}

async function load() {
  vi.resetModules();
  return import("../founding");
}

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "pri_account");
  vi.stubEnv("NEXT_PUBLIC_FOUNDING_CODE", "FOUNDING");
  vi.stubEnv("NEXT_PUBLIC_FOUNDING_SPOTS", "25");
  vi.stubEnv("PADDLE_API_KEY", "pdl_test");
  vi.stubEnv("NEXT_PUBLIC_PADDLE_ENV", "sandbox");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("foundingSpotsLeft", () => {
  it("returns the spots left when Paddle's discount matches the offer", async () => {
    mockDiscount(baseDiscount);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { foundingSpotsLeft } = await load();

    await expect(foundingSpotsLeft()).resolves.toBe(3);
    expect(warn).not.toHaveBeenCalled();
  });

  it("hides the offer and names both numbers when the usage limits disagree", async () => {
    mockDiscount({ ...baseDiscount, usage_limit: 20 });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { foundingSpotsLeft } = await load();

    await expect(foundingSpotsLeft()).resolves.toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith("FOUNDING OFFER HIDDEN", {
      reason: "usage_limit is 20, NEXT_PUBLIC_FOUNDING_SPOTS is 25",
      code: "FOUNDING",
    });
  });

  it("stays silent and off when the code has no discount at all", async () => {
    mockDiscount({ ...baseDiscount, code: "OTHER" });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { foundingSpotsLeft } = await load();

    await expect(foundingSpotsLeft()).resolves.toBeNull();
    expect(warn).toHaveBeenCalledWith("FOUNDING OFFER HIDDEN", {
      reason: "Paddle returned no discount with that code",
      code: "FOUNDING",
    });
  });
});
