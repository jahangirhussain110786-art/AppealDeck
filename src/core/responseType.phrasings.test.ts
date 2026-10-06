import { describe, expect, it } from "vitest";
import { determineResponseType } from "./responseType";

const typeOf = (text: string) => determineResponseType(text).type;

/**
 * 6 Oct 2026. The commonest wordings of a Plan of Action request, and of a request for invoices,
 * all came back UNDETERMINED.
 */
describe("Plan of Action phrasings", () => {
  it.each([
    "You must respond no later than Friday 11 September 2026 with a Plan of Action.",
    "Please respond with a Plan of Action.",
    "Respond by 11 September 2026 with a Plan of Action.",
    "We need a Plan of Action from you.",
    "A Plan of Action is required.",
    "Please respond within 3 business days with a Plan of Action.",
    "Reply with your plan of action to this message.",
  ])("reads %s", (text) => {
    expect(typeOf(text)).toBe("PLAN_OF_ACTION");
  });

  it("keeps the negation and past-tense guards", () => {
    expect(typeOf("Do not respond with a Plan of Action.")).not.toBe("PLAN_OF_ACTION");
    expect(typeOf("Your previous Plan of Action was received.")).not.toBe("PLAN_OF_ACTION");
    expect(typeOf("We will respond to your plan of action within 5 days.")).not.toBe(
      "PLAN_OF_ACTION",
    );
    expect(typeOf("We need to review your plan of action.")).not.toBe("PLAN_OF_ACTION");
  });
});

describe("requests for documents worded as a need", () => {
  it("reads 'we need' as a request for the named records", () => {
    expect(typeOf("Please be advised we need an invoice for ASIN B08N5WRWNW.")).toBe(
      "SUPPORTING_DOCUMENTS",
    );
    expect(typeOf("We need your invoices.")).toBe("SUPPORTING_DOCUMENTS");
    expect(typeOf("Amazon requires supplier invoices for these listings.")).toBe(
      "SUPPORTING_DOCUMENTS",
    );
  });

  it("does not read a need for time as a request for records", () => {
    expect(typeOf("We need more time to review the documents.")).not.toBe("SUPPORTING_DOCUMENTS");
    expect(typeOf("We need to verify the invoice number.")).not.toBe("SUPPORTING_DOCUMENTS");
  });
});

describe("a pasted Seller Support thread", () => {
  const thread = [
    "Please provide the supplier invoice for ASIN B08N5WRWNW.",
    "",
    "Seller (you): Attached the supplier invoice.",
    "",
    "Amazon: Thank you. We have reviewed your invoices and no further action is required. Your account is now active.",
  ].join("\n");

  it("is read by what Amazon said last, not by the first message", () => {
    expect(typeOf(thread)).toBe("NO_ACTION_REQUESTED");
    // The same first message on its own is still a request for documents.
    expect(typeOf(thread.split("\n")[0]!)).toBe("SUPPORTING_DOCUMENTS");
  });

  it("leaves a single notice alone", () => {
    expect(
      typeOf(
        "From: Amazon\nDate: 1 Sep 2026\n\nPlease provide the supplier invoice. No further action is required on other listings.",
      ),
    ).toBe("SUPPORTING_DOCUMENTS");
  });

  it("spans of a thread decision still slice back out of the paste", () => {
    const r = determineResponseType(thread);
    for (const m of r.matches) expect(thread.slice(m.start, m.end).length).toBeGreaterThan(0);
  });
});
