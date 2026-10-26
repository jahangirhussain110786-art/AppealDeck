import { describe, expect, it } from "vitest";
import { checkoutEligibility } from "../checkoutRequest";
import { documentWorkspace } from "@/core/workspace.fixture";
import { newWorkspace } from "@/core/workspace";

/**
 * What a purchase tells the server about the case (26 Oct 2026). Checkout used to post the whole
 * workspace — notice, response page, notes, file names, the unsaved draft — to ask three questions.
 * These are the answers, and the case must not ride along with them.
 */
describe("checkoutEligibility", () => {
  it("carries three facts and nothing read off the case", () => {
    const w = {
      ...documentWorkspace(),
      notice: "NOTICE-WORDS-THAT-MUST-NOT-LEAVE-THE-DEVICE",
      explanation: "THE-SELLER-OWN-WRITING-MUST-NOT-LEAVE-THE-DEVICE",
      draft: { "response.explanation": "UNSAVED-DRAFT-MUST-NOT-LEAVE-THE-DEVICE" },
    };
    const facts = checkoutEligibility(w);
    expect(Object.keys(facts).sort()).toEqual(["composable", "professionalReview", "round"]);
    const posted = JSON.stringify(facts);
    expect(posted).not.toContain("NOTICE-WORDS");
    expect(posted).not.toContain("THE-SELLER-OWN-WRITING");
    expect(posted).not.toContain("UNSAVED-DRAFT");
    expect(posted).not.toContain("invoice.pdf");
  });

  it("answers the three questions the server checks", () => {
    expect(checkoutEligibility(documentWorkspace())).toEqual({
      composable: true,
      professionalReview: false,
      round: { sentHere: 0, repliesReceived: 0 },
    });
    expect(
      checkoutEligibility({
        ...newWorkspace(),
        notice: "Your response remains under review. No additional information is required.",
        confirmed: true,
        protocol: "information",
      }).composable,
    ).toBe(false);
    expect(
      checkoutEligibility({ ...documentWorkspace(), notice: "You submitted forged invoices." })
        .professionalReview,
    ).toBe(true);
  });

  it("reports the round from responses sent here, not from a prior attempt", () => {
    const sent = {
      id: "s1",
      at: "2026-10-01T00:00:00Z",
      revision: 1,
      protocol: "documents" as const,
      text: "x",
      receipt: "",
      attachments: [],
    };
    expect(
      checkoutEligibility({
        ...documentWorkspace(),
        submissions: [{ ...sent, id: "p1", revision: 0, source: "prior" as const }],
      }).round,
    ).toEqual({ sentHere: 0, repliesReceived: 0 });
    expect(checkoutEligibility({ ...documentWorkspace(), submissions: [sent] }).round).toEqual({
      sentHere: 1,
      repliesReceived: 0,
    });
  });
});
