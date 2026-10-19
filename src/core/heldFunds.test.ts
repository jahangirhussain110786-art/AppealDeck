import { describe, expect, it } from "vitest";
import { mentionsHeldFunds } from "./heldFunds";
import { SAMPLE_NOTICE_TEXT } from "@/content/sampleNotice";

describe("mentionsHeldFunds (G-03)", () => {
  it.each([
    "Funds will not be transferred to you while we review your account.",
    "Funds in your account are on hold while we review your account.",
    "Your payments are on hold until the review is complete.",
    "We are holding your account balance.",
    "Your disbursements have been withheld.",
    "Your funds can't be released at this time.",
    "Your Amazon seller account has been deactivated. Funds are under review.",
  ])("reads %j as money held", (text) => {
    expect(mentionsHeldFunds(text)).toBe(true);
  });

  it("reads the sample notice, which says funds are on hold", () => {
    expect(mentionsHeldFunds(SAMPLE_NOTICE_TEXT)).toBe(true);
  });

  it.each([
    "We may withhold payments if your account violates our policies.",
    "We reserve the right to hold funds at any time.",
    "If you do not respond, your funds will be held.",
    "Your listing is on hold pending review.",
    "Please update your payment method.",
    "Your account balance is shown in Payments.",
  ])("stays silent on %j", (text) => {
    expect(mentionsHeldFunds(text)).toBe(false);
  });
});

describe("a deactivation that also holds the money (19 Oct 2026)", () => {
  it("counts 'you can no longer list ... and any funds will be held for 90 days'", () => {
    expect(
      mentionsHeldFunds(
        "Because of this, you can no longer list products for sale on Amazon, and any funds in your account will be held for 90 days from the date of deactivation.",
      ),
    ).toBe(true);
  });
  it("still ignores a real possibility", () => {
    expect(mentionsHeldFunds("We can withhold funds if you do not respond.")).toBe(false);
  });
});
