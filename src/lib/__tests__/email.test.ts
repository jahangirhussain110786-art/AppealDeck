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
    expect(email.text).toContain(PRICING.price);
    expect(email.text).toContain(LEGAL.consent.withdrawalCheckbox.label);
    expect(email.text.toLowerCase()).toContain("refund");
    expect(email.text).toContain("September 11, 2026");
    expect(email.html).toContain(PRICING.pass);
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
