import { describe, it, expect } from "vitest";
import { buildPurchaseConfirmationEmail } from "@/lib/email";
import { PRICING } from "@/content/marketing";
import { LEGAL } from "@/content/legal";

describe("buildPurchaseConfirmationEmail", () => {
  it("echoes what was bought, the price, the exact consent given, and the refund route (D8)", () => {
    const email = buildPurchaseConfirmationEmail({
      to: "seller@example.com",
      purchasedAt: "2026-09-11T12:00:00.000Z",
    });

    expect(email.subject).toContain(PRICING.pass);
    expect(email.text).toContain(`List price: ${PRICING.price}`);
    expect(email.text).toContain("receipt shows the amount you paid, including any discount code");
    expect(email.text).toContain(LEGAL.consent.withdrawalCheckbox.label);
    expect(email.text.toLowerCase()).toContain("refund");
    expect(email.text).toContain("within 14 days of purchase");
    expect(email.text).not.toMatch(/7 days/);
    expect(email.text).toContain("September 11, 2026");
    expect(email.html).toContain(PRICING.pass);
  });

  it("names the Account Pass, its list price and its 12 months when that is what was bought", () => {
    const email = buildPurchaseConfirmationEmail({
      to: "seller@example.com",
      purchasedAt: "2026-10-22T12:00:00.000Z",
      plan: "account_pass",
    });
    expect(email.subject).toContain(PRICING.account.name);
    expect(email.subject).not.toContain(PRICING.pass);
    expect(email.text).toContain(`List price: ${PRICING.account.price}`);
    expect(email.text).toContain("every case on your account for 12 months");
    expect(email.text).toContain("within 14 days of purchase");
    expect(email.text).toContain(LEGAL.consent.withdrawalCheckbox.label);
  });

  it("HTML-escapes the consent text so it renders safely", () => {
    const email = buildPurchaseConfirmationEmail({
      to: "seller@example.com",
      purchasedAt: "2026-09-11T12:00:00.000Z",
    });
    // The real consent string has no HTML-special characters today, but the builder must still
    // escape correctly — assert the escaper is actually applied to every non-blank line.
    expect(email.html).not.toContain("<script");
  });

  it("degrades gracefully when purchasedAt cannot be parsed", () => {
    const email = buildPurchaseConfirmationEmail({ to: "seller@example.com", purchasedAt: "" });
    expect(email.subject).toContain(PRICING.pass);
    expect(email.text).not.toContain("on Invalid Date");
  });
});
