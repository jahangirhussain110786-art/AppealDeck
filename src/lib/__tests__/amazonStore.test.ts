import { describe, expect, it } from "vitest";
import { detectOtherAmazonStore } from "../amazonStore";

describe("detectOtherAmazonStore", () => {
  it("names a non-US store from its domain", () => {
    expect(detectOtherAmazonStore("Dear seller, Amazon.co.uk has deactivated…")).toBe(
      "Amazon.co.uk",
    );
    expect(detectOtherAmazonStore("sellercentral.amazon.de/performance")).toBe("Amazon.de");
  });
  it("is silent for the US store and for plain country words", () => {
    expect(detectOtherAmazonStore("Amazon.com has deactivated your account")).toBeNull();
    expect(detectOtherAmazonStore("We ship to the UK and Germany from Amazon.")).toBeNull();
    expect(detectOtherAmazonStore("amazon.complaints@example.com")).toBeNull();
  });
});
