import { describe, expect, it } from "vitest";
import { blockedCountries, DEFAULT_BLOCKED_COUNTRIES, isPurchaseBlocked } from "../region";

describe("where the Appeal Pass is on sale", () => {
  it("blocks every EU country, the rest of the EEA and the UK by default", () => {
    for (const c of ["DE", "FR", "IE", "IT", "ES", "NL", "PL", "SE", "NO", "IS", "LI", "GB"])
      expect(isPurchaseBlocked(c, ""), c).toBe(true);
    expect(DEFAULT_BLOCKED_COUNTRIES).toHaveLength(27 + 3 + 1);
  });

  it("allows the markets the product is for", () => {
    for (const c of ["US", "SA", "PK", "AE", "CA", "IN", "CN", "AU"])
      expect(isPurchaseBlocked(c, ""), c).toBe(false);
  });

  it("allows a visitor whose country is unknown", () => {
    expect(isPurchaseBlocked(null, "")).toBe(false);
    expect(isPurchaseBlocked(undefined, "")).toBe(false);
    expect(isPurchaseBlocked("", "")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isPurchaseBlocked("de", "")).toBe(true);
    expect(isPurchaseBlocked(" gb ", "")).toBe(true);
  });

  it("can be replaced, or switched off, by one setting", () => {
    expect(blockedCountries("FR, de ,xx,bad")).toEqual(["FR", "DE", "XX"]);
    expect(isPurchaseBlocked("DE", "FR")).toBe(false);
    expect(isPurchaseBlocked("DE", "none")).toBe(false);
    expect(isPurchaseBlocked("DE", "NONE")).toBe(false);
  });
});
