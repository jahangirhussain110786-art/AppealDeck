import { describe, it, expect } from "vitest";
import { caseFactsForCheck, checkCaseDataFrom } from "./context";
import { toCaseFacts } from "@/components/workspace/CaseFactsCard";

describe("checkCaseDataFrom", () => {
  it("collects the ASINs and IDs Amazon named across every request on the case", () => {
    const original =
      "We received a complaint about ASIN B0ABCDEF12. Complaint ID: 7654321098. Please provide invoices.";
    // Amazon's reply rarely repeats the ASIN; the check must still be able to match it.
    const reply =
      "Thank you for your appeal. Case ID 123456789. Please provide a supplier invoice.";
    expect(checkCaseDataFrom([original, "", reply])).toEqual({
      asins: ["B0ABCDEF12"],
      referenceIds: ["7654321098", "123456789"],
    });
  });

  it("does not repeat an identifier named twice", () => {
    const text = "ASIN B0ABCDEF12 and again B0ABCDEF12.";
    expect(checkCaseDataFrom([text, text]).asins).toEqual(["B0ABCDEF12"]);
  });

  it("returns nothing, rather than a guess, when the notice names nothing", () => {
    expect(checkCaseDataFrom(["Your account has been deactivated."])).toEqual({
      asins: [],
      referenceIds: [],
    });
  });

  it("caps each list at what the API accepts", () => {
    const many = Array.from({ length: 30 }, (_, i) => `B0${String(i).padStart(8, "0")}`).join(" ");
    expect(checkCaseDataFrom([many]).asins).toHaveLength(20);
  });
});

describe("the business details a check carries", () => {
  it("sends only what the seller entered", () => {
    expect(caseFactsForCheck(undefined)).toEqual({});
    expect(caseFactsForCheck({ businessName: " Hawlton Trading " })).toEqual({
      business: { name: "Hawlton Trading" },
    });
    expect(caseFactsForCheck({ suppliers: ["", " Acme "] })).toEqual({ suppliers: ["Acme"] });
  });

  it("saves trimmed details, drops blanks and repeated suppliers", () => {
    expect(toCaseFacts("  ", "", "Acme\n\nAcme\n Other ")).toEqual({
      suppliers: ["Acme", "Other"],
    });
    expect(toCaseFacts("", "", "")).toEqual({});
  });
});
