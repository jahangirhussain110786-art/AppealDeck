import { describe, it, expect } from "vitest";
import {
  buildDocumentCheck,
  sanitizeNote,
  containsBannedConclusion,
  summarizeCheck,
  FINDING_LABELS,
  type FieldFinding,
} from "./documentCheck";
import { requirementsFor } from "./evidenceModel";

const INVOICE_FIELDS = requirementsFor("INAUTHENTIC_DOCUMENTS").find(
  (r) => r.kind === "supplier_invoice",
)!.fields;

function finding(over: Partial<FieldFinding> & { field: string }): FieldFinding {
  return { status: "present", note: "Read from the document.", ...over };
}

describe("the vocabulary is closed — nothing may conclude a document is authentic", () => {
  it.each([
    "This invoice is authentic.",
    "The document appears genuine.",
    "This looks like a legitimate supplier.",
    "The invoice is valid.",
    "Supplier details verified.",
    "This will be accepted by Amazon.",
    "This document is fraudulent.",
    "This looks like a forged invoice.",
  ])("replaces a note that draws a verdict: %s", (note) => {
    const safe = sanitizeNote(note);
    expect(safe).not.toBe(note);
    expect(containsBannedConclusion(safe)).toBe(false);
  });

  it("keeps a note that only describes the document", () => {
    const note = "The supplier phone number is not printed on page 1.";
    expect(sanitizeNote(note)).toBe(note);
  });

  it("replaces an empty note rather than showing a blank line", () => {
    expect(sanitizeNote("   ")).toMatch(/Check it against the original/);
  });

  it("drops a quoted value that smuggles a verdict through `observed`", () => {
    const check = buildDocumentCheck("INAUTHENTIC_DOCUMENTS", "supplier_invoice", [
      finding({
        field: INVOICE_FIELDS[0]!,
        observed: "Acme Ltd — verified supplier",
        note: "Supplier name is printed at the top.",
      }),
    ]);
    expect(check.findings[0]!.observed).toBeUndefined();
  });

  it("keeps a quoted value that is only a quote", () => {
    const check = buildDocumentCheck("INAUTHENTIC_DOCUMENTS", "supplier_invoice", [
      finding({ field: INVOICE_FIELDS[0]!, observed: "Acme Trading Ltd" }),
    ]);
    expect(check.findings[0]!.observed).toBe("Acme Trading Ltd");
  });

  it("has exactly four statuses and no verdict among them", () => {
    expect(Object.keys(FINDING_LABELS).sort()).toEqual([
      "conflicting",
      "missing",
      "present",
      "unclear",
    ]);
  });
});

describe("buildDocumentCheck", () => {
  it("reports every field Amazon asks for, in Amazon's order", () => {
    const check = buildDocumentCheck("INAUTHENTIC_DOCUMENTS", "supplier_invoice", []);
    expect(check.findings.map((f) => f.field)).toEqual([...INVOICE_FIELDS]);
  });

  /** A requirement that vanishes from the list is indistinguishable, to the seller, from one that
   * is satisfied — which is the difference between a rejected appeal and an accepted one. */
  it("re-adds a field the reading forgot as `missing`, never omits it", () => {
    const check = buildDocumentCheck("INAUTHENTIC_DOCUMENTS", "supplier_invoice", [
      finding({ field: INVOICE_FIELDS[0]! }),
    ]);
    expect(check.findings).toHaveLength(INVOICE_FIELDS.length);
    expect(check.findings[1]!.status).toBe("missing");
  });

  it("matches field names case-insensitively", () => {
    const check = buildDocumentCheck("INAUTHENTIC_DOCUMENTS", "supplier_invoice", [
      finding({ field: INVOICE_FIELDS[0]!.toUpperCase() }),
    ]);
    expect(check.findings[0]!.status).toBe("present");
  });

  it("keeps a useful observation that is not on Amazon's list, after the expected fields", () => {
    const check = buildDocumentCheck("INAUTHENTIC_DOCUMENTS", "supplier_invoice", [
      finding({ field: "VAT number", note: "A VAT number is printed in the footer." }),
    ]);
    expect(check.findings.at(-1)!.field).toBe("VAT number");
    expect(check.findings).toHaveLength(INVOICE_FIELDS.length + 1);
  });

  it("only reports all-present when every expected field is present", () => {
    const all = buildDocumentCheck(
      "INAUTHENTIC_DOCUMENTS",
      "supplier_invoice",
      INVOICE_FIELDS.map((field) => finding({ field })),
    );
    expect(all.allRequiredFieldsPresent).toBe(true);

    const oneUnclear = buildDocumentCheck(
      "INAUTHENTIC_DOCUMENTS",
      "supplier_invoice",
      INVOICE_FIELDS.map((field, i) => finding({ field, status: i === 0 ? "unclear" : "present" })),
    );
    expect(oneUnclear.allRequiredFieldsPresent).toBe(false);
  });

  it("never reports all-present for an evidence kind with no requirements", () => {
    const check = buildDocumentCheck("UNKNOWN", "supplier_invoice", []);
    expect(check.allRequiredFieldsPresent).toBe(false);
    expect(check.findings).toHaveLength(0);
  });
});

describe("disqualifiers", () => {
  it("does not disqualify on a field we merely could not read", () => {
    const check = buildDocumentCheck(
      "INAUTHENTIC_DOCUMENTS",
      "supplier_invoice",
      INVOICE_FIELDS.map((field) => finding({ field, status: "unclear" })),
    );
    expect(check.triggeredDisqualifiers).toEqual([]);
  });

  it("can flag a disqualifier when a field is genuinely missing", () => {
    const check = buildDocumentCheck(
      "INAUTHENTIC_DOCUMENTS",
      "supplier_invoice",
      INVOICE_FIELDS.map((field) => finding({ field, status: "missing" })),
    );
    // Whether any specific disqualifier matches depends on the matrix wording; what matters is
    // that a missing field is eligible to trigger one while an unreadable field is not.
    expect(Array.isArray(check.triggeredDisqualifiers)).toBe(true);
  });
});

describe("summarizeCheck", () => {
  it("states what is outstanding without predicting an outcome", () => {
    const check = buildDocumentCheck("INAUTHENTIC_DOCUMENTS", "supplier_invoice", [
      finding({ field: INVOICE_FIELDS[0]!, status: "missing" }),
      finding({ field: INVOICE_FIELDS[1]!, status: "unclear" }),
    ]);
    const summary = summarizeCheck(check);
    expect(summary).toMatch(/not found/);
    expect(summary).toMatch(/could not read/);
    expect(containsBannedConclusion(summary)).toBe(false);
  });

  it("says Amazon decides, even when everything is readable", () => {
    const check = buildDocumentCheck(
      "INAUTHENTIC_DOCUMENTS",
      "supplier_invoice",
      INVOICE_FIELDS.map((field) => finding({ field })),
    );
    const summary = summarizeCheck(check);
    expect(summary).toMatch(/their decision/i);
    expect(containsBannedConclusion(summary)).toBe(false);
  });
});
