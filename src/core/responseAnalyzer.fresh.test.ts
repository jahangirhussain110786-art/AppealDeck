import { describe, expect, it } from "vitest";
import { analyzeReply } from "./responseAnalyzer";

/**
 * Replies written on 7 Oct 2026 for the launch audit, in wording the analyser was not built
 * against. Five ordinary refusals and requests read as "unrecognized", the honest fallback that
 * tells a seller nothing. None was ever read as a reinstatement, which is the error that matters;
 * the second block pins that direction.
 */
const category = (text: string) => analyzeReply(text).category;

describe("fresh reply wording", () => {
  it("reads an appeal that lacks enough information as a refusal that goes on", () => {
    expect(
      category(
        "Your appeal does not contain enough information to reinstate your account. Please include a root cause and send a new plan of action.",
      ),
    ).toBe("needs_more_information");
  });

  it("reads 'will not be reinstating' and 'has not been reinstated' as refusals", () => {
    expect(category("We will not be reinstating your account at this time.")).toBe(
      "needs_more_information",
    );
    expect(
      category("Your account has not been reinstated. Please send additional information."),
    ).toBe("needs_more_information");
  });

  it("reads a plain request for records as a document request, with the invoice kind", () => {
    const r = analyzeReply(
      "To continue our review we need the following: invoices from the last 365 days for the ASINs listed. Please reply to this message with the documents.",
    );
    expect(r.category).toBe("document_request");
    expect(r.extractedAsks).toContain("supplier_invoice");
  });

  it("still reads a refusal that offers a second appeal as one that goes on", () => {
    expect(
      category(
        "We cannot reinstate your account based on this appeal. However, you may submit a new appeal with additional documentation within 17 days.",
      ),
    ).toBe("needs_more_information");
  });
});

describe("a refusal is never read as a reinstatement", () => {
  const refusals = [
    "We will not be reinstating your account at this time.",
    "Your account has not been reinstated.",
    "Your account remains not reinstated until we receive more information.",
    "If the invoice you sent is verified, we will reinstate your account. Until then your account remains suspended.",
    "You wrote: 'your selling account is now active again'. However, the documents do not verify the supply chain. We are unable to reinstate your account.",
  ];
  for (const text of refusals)
    it(text.slice(0, 60), () => {
      expect(category(text)).not.toBe("reinstated");
    });

  it("and a true reinstatement still is one", () => {
    expect(
      category("We have reviewed your appeal and your selling privileges have been reinstated."),
    ).toBe("reinstated");
  });
});
