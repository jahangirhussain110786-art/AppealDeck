import { describe, expect, it } from "vitest";
import { assessNoticeAuthenticity } from "./noticeAuthenticity";

const ids = (text: string) => assessNoticeAuthenticity(text).signals.map((s) => s.id);

describe("look-alike domains and genuine senders", () => {
  it.each([
    "Reinstate your account now: https://amazon.top/reinstate",
    "Appeal at https://amazon.help/appeal",
    "Write to seller-performance@amazon.top",
    "From: appeals@amazon.xyz",
  ])("flags a look-alike: %s", (t) => {
    expect(ids(t).some((id) => id === "non_amazon_link" || id === "non_amazon_sender")).toBe(true);
  });

  it.each([
    "Sender: noreply@sellercentral.amazon.com",
    "Contact sellers@marketplace.amazon.com",
    "See https://sellercentral.amazon.co.uk/performance/dashboard",
    "See https://www.amazon.de/gp/help",
  ])("stays silent on a real Amazon address: %s", (t) => {
    expect(ids(t)).toEqual([]);
  });

  it("does not read a pending funds amount as a payment demand", () => {
    expect(
      ids("Your funds are on hold. A payment of $1,234.56 is pending release after review."),
    ).toEqual([]);
  });

  it("still flags a demand to pay", () => {
    expect(ids("To restore your account, pay $250 today.")).toContain("payment_requested");
    expect(ids("Send us a payment of $99 to unlock it.")).toContain("payment_requested");
  });
});
