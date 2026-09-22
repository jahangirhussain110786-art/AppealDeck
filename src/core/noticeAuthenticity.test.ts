import { describe, expect, it } from "vitest";
import { assessNoticeAuthenticity } from "./noticeAuthenticity";
import { FIXTURES } from "./fixtures";

describe("assessNoticeAuthenticity", () => {
  /**
   * The cost of a false positive is high: a seller told to doubt a genuine deactivation notice
   * may delay answering it, and the appeal window is short. Every real fixture must stay silent.
   */
  it("says nothing about the real notice corpus", () => {
    const noisy = FIXTURES.filter((f) => assessNoticeAuthenticity(f.text).worthChecking).map(
      (f) => f.id,
    );
    expect(noisy, `these real notices were flagged: ${noisy.join(", ")}`).toEqual([]);
  });

  it("flags a demand for a reinstatement fee", () => {
    const r = assessNoticeAuthenticity(
      "Your Amazon seller account has been deactivated. To restore your selling privileges, pay the reinstatement fee of $250 within 24 hours.",
    );
    expect(r.worthChecking).toBe(true);
    expect(r.signals.map((s) => s.id)).toContain("payment_requested");
  });

  it("flags gift cards and cryptocurrency", () => {
    for (const method of ["gift cards", "Bitcoin", "USDT", "a wire transfer"]) {
      const r = assessNoticeAuthenticity(
        `Amazon Seller Performance. Settle the outstanding balance using ${method} to avoid permanent closure.`,
      );
      expect(
        r.signals.map((s) => s.id),
        method,
      ).toContain("payment_requested");
    }
  });

  it("flags a request for a password or a one-time code", () => {
    for (const ask of [
      "Please reply with your password to verify ownership.",
      "Share the one-time code we just sent to confirm your identity.",
      "Confirm your two-factor code to complete the review.",
    ]) {
      const r = assessNoticeAuthenticity(`Amazon Account Health. ${ask}`);
      expect(
        r.signals.map((s) => s.id),
        ask,
      ).toContain("credentials_requested");
    }
  });

  it("flags a move to a messaging app", () => {
    const r = assessNoticeAuthenticity(
      "Amazon Seller Performance. For faster resolution contact our specialist on WhatsApp.",
    );
    expect(r.signals.map((s) => s.id)).toContain("off_platform_contact");
  });

  it("flags a link that does not go to Amazon, and names the host", () => {
    const r = assessNoticeAuthenticity(
      "Your Amazon account is deactivated. Submit your appeal at https://amaz0n-seller-appeal.com/restore to continue selling.",
    );
    const link = r.signals.find((s) => s.id === "non_amazon_link");
    expect(link).toBeDefined();
    expect(link!.match).toContain("amaz0n-seller-appeal.com");
  });

  it("does not flag a genuine Seller Central link", () => {
    const r = assessNoticeAuthenticity(
      "Your Amazon account is deactivated. Appeal from Account Health at https://sellercentral.amazon.com/performance/dashboard",
    );
    expect(r.signals.map((s) => s.id)).not.toContain("non_amazon_link");
  });

  it("does not flag the real Amazon addresses a genuine notice names", () => {
    const r = assessNoticeAuthenticity(
      "Amazon Seller Performance. Send retraction requests to notice-dispute@amazon.com and funds queries to disbursement-appeals@amazon.co.uk.",
    );
    expect(r.signals.map((s) => s.id)).not.toContain("non_amazon_sender");
  });

  it("flags a look-alike sender address", () => {
    const r = assessNoticeAuthenticity(
      "Amazon Seller Performance. Reply to seller-performance@amazon-support-team.net with your documents.",
    );
    const sender = r.signals.find((s) => s.id === "non_amazon_sender");
    expect(sender).toBeDefined();
    expect(sender!.match).toContain("amazon-support-team.net");
  });

  it("shows the seller's own words, so nothing is asserted without its source", () => {
    const notice =
      "Your Amazon seller account has been deactivated. Pay the appeal fee to restore access.";
    const r = assessNoticeAuthenticity(notice);
    const payment = r.signals.find((s) => s.id === "payment_requested")!;
    expect(notice.replace(/\s+/g, " ")).toContain(payment.match.replace(/^…|…$/g, ""));
  });

  it("is silent on empty input rather than guessing", () => {
    expect(assessNoticeAuthenticity("").worthChecking).toBe(false);
    expect(assessNoticeAuthenticity("   ").signals).toEqual([]);
  });

  /**
   * The module must never conclude. A verdict either way is inventing certainty the text cannot
   * support, and here it would be dangerous in both directions.
   */
  it("reaches no verdict about authenticity", () => {
    const r = assessNoticeAuthenticity(
      "Pay the reinstatement fee via Bitcoin and reply with your password on WhatsApp: http://not-amazon.example/x",
    );
    const words = JSON.stringify(r).toLowerCase();
    for (const banned of [
      "is a scam",
      "fraudulent",
      "fake notice",
      "is genuine",
      "is legitimate",
    ]) {
      expect(words, `must not claim "${banned}"`).not.toContain(banned);
    }
  });
});
