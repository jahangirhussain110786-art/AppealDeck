import { describe, it, expect } from "vitest";
import {
  LETTER_TEMPLATES,
  letterById,
  lettersForEvidenceKind,
  SUPPLIER_INVOICE_REQUEST,
  RIGHTS_OWNER_RETRACTION,
  FOLLOWUP_NUDGE,
} from "./letters";

describe("letters", () => {
  it("exports three letter templates", () => {
    expect(LETTER_TEMPLATES).toHaveLength(3);
  });

  it("every template has id, label, purpose, and body", () => {
    for (const letter of LETTER_TEMPLATES) {
      expect(letter.id.length).toBeGreaterThan(0);
      expect(letter.label.length).toBeGreaterThan(0);
      expect(letter.purpose.length).toBeGreaterThan(0);
      expect(letter.body.length).toBeGreaterThan(0);
    }
  });

  it("every template notes the user sends it manually", () => {
    for (const letter of LETTER_TEMPLATES) {
      expect(letter.purpose).toMatch(/never sends anything|you send it yourself/i);
    }
  });

  it("supplier invoice request lists the verified matrix fields", () => {
    const body = SUPPLIER_INVOICE_REQUEST.body;
    expect(body).toContain("business name");
    expect(body).toContain("physical address");
    expect(body).toContain("phone number");
    expect(body).toContain("365 days");
    expect(body).toContain("completed transaction");
    expect(body).toContain("pro-forma invoices and quotes do not pass");
  });

  it("rights owner retraction includes ASIN placeholder", () => {
    expect(RIGHTS_OWNER_RETRACTION.body).toContain("ASIN");
  });

  it("follow-up nudge references the original submission date", () => {
    expect(FOLLOWUP_NUDGE.body).toContain("DATE OF ORIGINAL SUBMISSION");
  });

  it("letterById finds templates", () => {
    expect(letterById("supplier_invoice_request")).toBeDefined();
    expect(letterById("does-not-exist")).toBeUndefined();
  });

  it("lettersForEvidenceKind maps supplier_invoice to the invoice request", () => {
    const result = lettersForEvidenceKind("supplier_invoice");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("supplier_invoice_request");
  });

  it("lettersForEvidenceKind maps rights_owner_retraction to the retraction letter", () => {
    const result = lettersForEvidenceKind("rights_owner_retraction");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("rights_owner_retraction");
  });

  it("lettersForEvidenceKind returns empty for unrelated kinds", () => {
    expect(lettersForEvidenceKind("sop_document")).toEqual([]);
  });
});
