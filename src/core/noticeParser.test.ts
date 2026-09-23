import { describe, expect, it } from "vitest";
import { parseNotice } from "./noticeParser";
import { classifyStage1 } from "./classifier";
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
