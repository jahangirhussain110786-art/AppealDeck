import { describe, expect, it } from "vitest";
import { shouldOfferChangeOfApproach } from "./escalation";

const sent = (at: string) => ({
  id: at,
  at,
  revision: 1,
  protocol: "operational" as const,
  text: "Our plan of action.",
  receipt: "",
  attachments: [],
});
const reply = (at: string, text: string) => ({ id: `r-${at}`, at, text, applied: false });
const REFUSAL =
  "We reviewed your appeal. We do not have enough information to reinstate your account.";

describe("when to offer a change of approach", () => {
  it("is not offered after a single refusal", () => {
    expect(
      shouldOfferChangeOfApproach({
        submissions: [sent("2026-09-01T00:00:00.000Z")],
        replies: [reply("2026-09-03T00:00:00.000Z", REFUSAL)],
      }),
    ).toBe(false);
  });

  it("is offered once two responses have been sent and Amazon refuses again", () => {
    expect(
      shouldOfferChangeOfApproach({
        submissions: [sent("2026-09-01T00:00:00.000Z"), sent("2026-09-10T00:00:00.000Z")],
        replies: [
          reply("2026-09-03T00:00:00.000Z", REFUSAL),
          reply("2026-09-12T00:00:00.000Z", REFUSAL),
        ],
      }),
    ).toBe(true);
  });

  it("waits for Amazon's reply to the latest response", () => {
    expect(
      shouldOfferChangeOfApproach({
        submissions: [sent("2026-09-01T00:00:00.000Z"), sent("2026-09-10T00:00:00.000Z")],
        replies: [reply("2026-09-03T00:00:00.000Z", REFUSAL)],
      }),
    ).toBe(false);
  });

  it("is not offered when the latest reply reinstates the account", () => {
    expect(
      shouldOfferChangeOfApproach({
        submissions: [sent("2026-09-01T00:00:00.000Z"), sent("2026-09-10T00:00:00.000Z")],
        replies: [reply("2026-09-12T00:00:00.000Z", "Your account has been reinstated.")],
      }),
    ).toBe(false);
  });
});
