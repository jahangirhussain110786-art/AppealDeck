import { describe, expect, it } from "vitest";
import type { DocumentCheckResult } from "@/core/documentCheck";
import { deviceReadingNotes } from "./deviceNotes";

const result = (extra: Partial<DocumentCheckResult>): DocumentCheckResult => ({
  evidenceKind: "supplier_invoice",
  findings: [],
  triggeredDisqualifiers: [],
  allRequiredFieldsPresent: false,
  ...extra,
});

/**
 * 30 Sep 2026: the note under a device reading said "The file was never uploaded" for every one,
 * including a signed-in seller's, whose file had been posted before the fallback ran. What the
 * result may claim about the file depends on whether the request was made.
 */
describe("what a reading made on the device says about the file", () => {
  it("says nothing for a reading made by the AI", () => {
    expect(deviceReadingNotes(result({}))).toBeNull();
  });

  it("says the file was never uploaded only when no request was made", () => {
    const n = deviceReadingNotes(result({ readOn: "device", fileSent: false }));
    expect(n?.where).toMatch(/never uploaded/);
  });

  it("says the file was sent when the AI request went first", () => {
    const n = deviceReadingNotes(
      result({ readOn: "device", fileSent: true, aiNote: "Document reading is not switched on." }),
    );
    expect(n?.where).toMatch(/was sent to AppealDeck for the AI reading, which did not run/);
    expect(n?.where).not.toMatch(/never uploaded/);
    expect(n?.whyNotAi).toBe("Why not the AI reading: Document reading is not switched on.");
  });

  it("claims nothing either way for a reading saved before it was recorded", () => {
    const n = deviceReadingNotes(result({ readOn: "device" }));
    expect(n?.where).not.toMatch(/never uploaded|was sent/);
    expect(n?.where).toMatch(/made on this device/);
  });

  it("warns that a picture can be misread, and only for a picture", () => {
    expect(deviceReadingNotes(result({ readOn: "device", textSource: "ocr" }))?.picture).toMatch(
      /misread/,
    );
    expect(
      deviceReadingNotes(result({ readOn: "device", textSource: "pdf_text" }))?.picture,
    ).toBeUndefined();
  });
});
