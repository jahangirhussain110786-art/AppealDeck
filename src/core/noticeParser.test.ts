import { describe, expect, it } from "vitest";
import { parseNotice } from "./noticeParser";
import { classifyStage1, kindForConfirmedNotice } from "./classifier";
import { SAMPLE_NOTICE_TEXT } from "@/content/sampleNotice";
describe("verification context", () => {
  it("classifies the public sample as policy and retains its stated appeal window", () => {
    const parsed = parseNotice(SAMPLE_NOTICE_TEXT);
    expect(classifyStage1(parsed)).toMatchObject({ kind: "POLICY", severityGated: false });
    expect(parsed.statedWindowDays).toBe(90);
  });
  it.each([
    "We could not verify the authenticity of your products.",
    "You provided documentation we could not verify.",
    "Your supplier invoices could not be verified.",
    "You are offering items that are not authentic.",
    /*
      Rewritten 23 Sep 2026, and the old version is worth recording. It asserted
      `severityGated === true` for all four of these — including "You are offering items that are
      not authentic", which is the single most common Amazon deactivation and an entirely
      appealable one. Because the assertion passed, the suite actively held the product in a state
      where it answered the most frequent case with "this case type requires professional help. We
      cannot generate a self-serve draft", permanently.

      D6 gates fabricated documents, fraud and child safety. None of these four allege any of them:
      they allege the goods are not genuine, or that records could not be confirmed. Both are
      answered with supplier invoices, which is the work this product exists to do.
    */
  ])("recognises an authenticity complaint without gating it: %s", (notice) => {
    const classification = classifyStage1(parseNotice(notice));
    expect(classification.kind).toBe("INAUTHENTIC");
    expect(classification.severityGated).toBe(false);
  });

  it.each([
    "Your documents were flagged as altered invoices.",
    "You have supplied falsified invoices for these products.",
    "The records you provided appear to be forged documents.",
  ])("gates an allegation that the records themselves were fabricated: %s", (notice) => {
    const classification = classifyStage1(parseNotice(notice));
    expect(classification.kind).toBe("INAUTHENTIC_DOCUMENTS");
    expect(classification.severityGated).toBe(true);
  });

  it("gates by the more serious allegation when a notice makes both", () => {
    const both = parseNotice(
      "You are offering items that are not authentic, and the invoices you supplied were falsified.",
    );
    expect(both.kindHints).toContain("INAUTHENTIC");
    expect(both.kindHints).toContain("INAUTHENTIC_DOCUMENTS");
    expect(classifyStage1(both).kind).toBe("INAUTHENTIC_DOCUMENTS");
  });
  it("does not turn unverified listing claims into an authenticity allegation of any kind", () => {
    const hints = parseNotice("The listing contained claims we could not verify.").kindHints;
    expect(hints).not.toContain("INAUTHENTIC");
    expect(hints).not.toContain("INAUTHENTIC_DOCUMENTS");
  });
});
describe("appeal deadline context", () => {
  it.each([
    "Your funds are held for 90 days. You may appeal in Account Health.",
    "Submit an appeal with invoices issued in the last 365 days.",
    "You have exactly 17 days. Check your account for details.",
    "Submit your appeal within 7 days. You have 14 days to appeal.",
  ])("does not invent an appeal deadline: %s", (text) =>
    expect(parseNotice(text).statedWindowDays).toBeNull(),
  );
  it("extracts the appeal window despite an earlier funds period", () => {
    expect(
      parseNotice("Funds are held for 90 days. Submit your appeal within 7 days.").statedWindowDays,
    ).toBe(7);
  });
  it("retains the explicit legacy POA clause", () => {
    expect(
      parseNotice("You have 17 days from the date of this notice to submit a Plan of Action.")
        .statedWindowDays,
    ).toBe(17);
  });
});

/**
 * The classification wire-up, 23 Sep 2026. Only `/decode` ever classified a notice, so one typed
 * straight into `/case` left the case `UNKNOWN` for good. These pin the three rules that make it
 * safe to classify on every route confirmation.
 */
describe("kindForConfirmedNotice", () => {
  const authenticity = parseNotice(
    "We received complaints that items you are offering are not authentic. Provide supplier invoices.",
  );
  const unplaceable = parseNotice("Your account may be closed. Please explain yourself.");

  it("classifies a typed notice that the case had no reading for", () => {
    expect(kindForConfirmedNotice({ kind: "UNKNOWN" }, authenticity)).toBe("INAUTHENTIC");
  });

  it("never overwrites a kind the seller chose themselves", () => {
    // Otherwise the correction control would undo itself on the next save.
    expect(kindForConfirmedNotice({ kind: "POLICY", kindSetBy: "seller" }, authenticity)).toBe(
      "POLICY",
    );
  });

  it("does not downgrade a known kind to UNKNOWN when the notice cannot be placed", () => {
    expect(kindForConfirmedNotice({ kind: "FUNDS" }, unplaceable)).toBe("FUNDS");
  });

  it("lets the notice decide over a kind that came from a link rather than the evidence", () => {
    expect(kindForConfirmedNotice({ kind: "POLICY" }, authenticity)).toBe("INAUTHENTIC");
  });

  /**
   * The reason this could not be wired before today. Until the taxonomy split, this notice
   * classified as `INAUTHENTIC_DOCUMENTS`, and classifying it on confirmation would have routed the
   * most common Amazon case straight into the permanent "we cannot help" gate.
   */
  it("does not route an ordinary authenticity complaint into the severity gate", () => {
    const kind = kindForConfirmedNotice({ kind: "UNKNOWN" }, authenticity);
    expect(classifyStage1(authenticity).severityGated).toBe(false);
    expect(kind).not.toBe("INAUTHENTIC_DOCUMENTS");
  });

  it("still gates an allegation that the records were fabricated", () => {
    const fabricated = parseNotice("We determined that the invoices you supplied were falsified.");
    expect(kindForConfirmedNotice({ kind: "UNKNOWN" }, fabricated)).toBe("INAUTHENTIC_DOCUMENTS");
  });
});
