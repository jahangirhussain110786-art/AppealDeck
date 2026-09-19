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
  ])("retains the authenticity gate: %s", (notice) => {
    expect(classifyStage1(parseNotice(notice)).severityGated).toBe(true);
  });
  it("does not turn unverified listing claims into a document allegation", () => {
    expect(
      parseNotice("The listing contained claims we could not verify.").kindHints,
    ).not.toContain("INAUTHENTIC_DOCUMENTS");
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
