import { describe, expect, it } from "vitest";
import { analyzeReply } from "./responseAnalyzer";

/**
 * Fresh reply wordings, 8 Oct 2026. A wrong reading here is the costliest error the product can
 * make (telling a seller they are back, or that the case is over, when neither is true), so each
 * line pins what Amazon's words actually say.
 */
describe("fresh Amazon reply wordings", () => {
  it.each<[string, string, string]>([
    [
      "a plan that does not address the root cause",
      "The plan of action you submitted does not address the root cause. Please resubmit with more detail.",
      "needs_more_information",
    ],
    [
      "a bare request to resubmit",
      "Your appeal was reviewed. Please resubmit your plan of action.",
      "needs_more_information",
    ],
    [
      "a refusal that closes the door",
      "After careful review, we have decided not to reinstate your selling account. This decision is final and we will not review additional appeals.",
      "final_decision_negative",
    ],
    [
      "a request for supplier invoices",
      "To continue reviewing, please send us the invoices for ASIN B0ABCDEFGH purchased in the last 365 days.",
      "document_request",
    ],
    [
      "a reinstatement",
      "We have reviewed your appeal and your selling privileges have been reinstated. Thank you.",
      "reinstated",
    ],
    [
      "a conditional promise, which is not a reinstatement",
      "If you provide the requested documents we will reinstate your account.",
      "unrecognized",
    ],
    [
      "one listing restored, which is not the account",
      "The listing for ASIN B0ABCDEFGH has been reinstated.",
      "unrecognized",
    ],
    [
      "a case-number acknowledgement",
      "Thank you for contacting Seller Support. Your case ID is 1234567890.",
      "unrecognized",
    ],
  ])("reads %s", (_name, text, category) => {
    expect(analyzeReply(text).category).toBe(category);
  });
});
