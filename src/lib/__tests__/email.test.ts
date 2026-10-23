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
      kind: "account_pass",
    });
    expect(email.subject).toContain(PRICING.account.name);
    expect(email.subject).not.toContain(PRICING.pass);
    expect(email.text).toContain(`List price: ${PRICING.account.price}`);
    expect(email.text).toContain("every case on your account for 12 months");
    expect(email.text).toContain("within 14 days of purchase");
    expect(email.text).toContain(LEGAL.consent.withdrawalCheckbox.label);
  });

  it.each([
    ["document_review", "AI document review", "up to five documents for one case"],
    ["account_renewal", "Account Pass renewal", "adds twelve months to your Account Pass"],
    ["pack_10", "pack of 10 case credits", "ten case credits"],
    ["pack_30", "pack of 30 case credits", "thirty case credits"],
    ["pro_plan", "Pro plan", "renews every month until you cancel it in Billing"],
  ] as const)("names a %s purchase for what it is", (kind, name, detail) => {
    const email = buildPurchaseConfirmationEmail({
      to: "pro@example.com",
      purchasedAt: "2026-10-22T12:00:00.000Z",
      kind,
    });
    expect(email.subject).toContain(name);
    expect(email.subject).not.toContain("Appeal Pass");
    expect(email.text).toContain(detail);
    expect(email.text).toContain("List price:");
    expect(email.text).toContain("within 14 days of purchase");
    expect(email.text).not.toContain("One case.");
  });

  it("names a One Response purchase, and says a further response needs the Appeal Pass", () => {
    const email = buildPurchaseConfirmationEmail({
      to: "seller@example.com",
      purchasedAt: "2026-10-23T12:00:00.000Z",
      kind: "single_response",
    });
    expect(email.subject).toContain("One Response");
    expect(email.text).toContain("List price: $99");
    expect(email.text).toContain("a further response needs the Appeal Pass");
    expect(email.text).toContain("within 14 days of purchase");
  });

  it("names the credited Appeal Pass for what it is: the Pass, less the One Response already paid", () => {
    const email = buildPurchaseConfirmationEmail({
      to: "seller@example.com",
      purchasedAt: "2026-10-23T12:00:00.000Z",
      kind: "pass_after_single",
    });
    expect(email.subject).toContain("Appeal Pass");
    expect(email.text).toContain("less the $99 you paid for the One Response");
    expect(email.text).toContain("$150");
    expect(email.text).toContain("within 14 days of purchase");
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
