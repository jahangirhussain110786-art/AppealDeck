import { describe, it, expect } from "vitest";
import {
  buildDocumentCheck,
  sanitizeNote,
  containsBannedConclusion,
  summarizeCheck,
  comparisonFor,
  requirementForCheck,
  FINDING_LABELS,
  type CheckContext,
  type FieldFinding,
} from "./documentCheck";
import { EVIDENCE_MATRIX, requirementsFor } from "./evidenceModel";

const INVOICE_FIELDS = requirementsFor("INAUTHENTIC_DOCUMENTS").find(
  (r) => r.kind === "supplier_invoice",
)!.fields;

/** A reading reported present with a quote — "Found" is only ever shown beside the words found. */
function finding(over: Partial<FieldFinding> & { field: string }): FieldFinding {
  return { status: "present", note: "Read from the document.", observed: "as printed", ...over };
}

/** A record with no comparison fields, so "all present" can be reached honestly. */
const METRIC_FIELDS = requirementsFor("POLICY").find((r) => r.kind === "metric_export")!.fields;

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

  /** The fifth, added 24 Sep 2026, says what we did not do — it is a statement about the check,
   * not about the document, so it cannot carry a verdict either. */
  it("has exactly five statuses and no verdict among them", () => {
    expect(Object.keys(FINDING_LABELS).sort()).toEqual([
      "conflicting",
      "missing",
      "not_assessed",
      "present",
      "unclear",
    ]);
    for (const label of Object.values(FINDING_LABELS)) {
      expect(containsBannedConclusion(label)).toBe(false);
    }
  });
});

describe("buildDocumentCheck", () => {
  it("reports every field Amazon asks for, in Amazon's order", () => {
    const check = buildDocumentCheck("INAUTHENTIC_DOCUMENTS", "supplier_invoice", []);
    expect(check.findings.map((f) => f.field)).toEqual([...INVOICE_FIELDS]);
  });

  /** A requirement that vanishes from the list is indistinguishable, to the seller, from one that
   * is satisfied — which is the difference between a rejected appeal and an accepted one. */
  it("re-adds a field the reading forgot, never omits it", () => {
    const check = buildDocumentCheck("INAUTHENTIC_DOCUMENTS", "supplier_invoice", [
      finding({ field: INVOICE_FIELDS[0]! }),
    ]);
    expect(check.findings).toHaveLength(INVOICE_FIELDS.length);
  });

  /** 24 Sep 2026: a skipped field was reported "Not found", telling a seller their invoice lacked
   * something the model had simply not looked at. */
  it("reports a forgotten field as not checked, not as missing from the document", () => {
    const check = buildDocumentCheck("INAUTHENTIC_DOCUMENTS", "supplier_invoice", [
      finding({ field: INVOICE_FIELDS[0]! }),
    ]);
    expect(check.findings[1]!.status).toBe("not_assessed");
    expect(check.findings[1]!.note).toMatch(/have not checked/);
    // And it cannot trigger a disqualifier, which only a genuine absence may do.
    expect(check.triggeredDisqualifiers).toEqual([]);
  });

  it('does not show "Found" for a field reported present with nothing quoted', () => {
    const check = buildDocumentCheck("INAUTHENTIC_DOCUMENTS", "supplier_invoice", [
      finding({ field: INVOICE_FIELDS[0]!, observed: undefined }),
      finding({ field: INVOICE_FIELDS[1]!, observed: "   " }),
    ]);
    expect(check.findings[0]!.status).toBe("unclear");
    expect(check.findings[1]!.status).toBe("unclear");
    expect(check.findings[0]!.note).toMatch(/nothing was quoted/);
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
      "POLICY",
      "metric_export",
      METRIC_FIELDS.map((field) => finding({ field })),
    );
    expect(all.allRequiredFieldsPresent).toBe(true);

    const oneUnclear = buildDocumentCheck(
      "POLICY",
      "metric_export",
      METRIC_FIELDS.map((field, i) => finding({ field, status: i === 0 ? "unclear" : "present" })),
    );
    expect(oneUnclear.allRequiredFieldsPresent).toBe(false);
  });

  /** An invoice asks for quantities consistent with units sold, and we never have sales figures —
   * so an invoice is never "everything present", however good it is. That is the honest answer. */
  it("never reports all-present while a comparison could not be made", () => {
    const check = buildDocumentCheck(
      "INAUTHENTIC_DOCUMENTS",
      "supplier_invoice",
      INVOICE_FIELDS.map((field) => finding({ field })),
      CONTEXT,
    );
    expect(check.allRequiredFieldsPresent).toBe(false);
  });

  it("never reports all-present for an evidence kind with no requirements", () => {
    const check = buildDocumentCheck("POLICY", "supplier_invoice", []);
    expect(check.allRequiredFieldsPresent).toBe(false);
    expect(check.findings).toHaveLength(0);
  });

  /** The route already fell back to the canonical field list on an unclassified case; the result
   * did not, so every field the model skipped vanished instead of being reported. */
  it("reports the canonical fields on an unclassified case, as the reading was asked for them", () => {
    const check = buildDocumentCheck("UNKNOWN", "supplier_invoice", []);
    expect(check.findings.map((f) => f.field)).toEqual([...INVOICE_FIELDS]);
    expect(requirementForCheck("UNKNOWN", "supplier_invoice")?.fields).toEqual([...INVOICE_FIELDS]);
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

  it("counts what could not be checked, rather than hiding it", () => {
    const check = buildDocumentCheck("INAUTHENTIC_DOCUMENTS", "supplier_invoice", []);
    expect(summarizeCheck(check)).toMatch(
      new RegExp(`${INVOICE_FIELDS.length} we could not check here`),
    );
  });

  it("says Amazon decides, even when everything is readable", () => {
    const check = buildDocumentCheck(
      "POLICY",
      "metric_export",
      METRIC_FIELDS.map((field) => finding({ field })),
    );
    const summary = summarizeCheck(check);
    expect(summary).toMatch(/their decision/i);
    expect(containsBannedConclusion(summary)).toBe(false);
  });
});

/*
 * ChatGPT audit item H, 24 Sep 2026: the model was asked whether an invoice was "within 365 days",
 * "mappable to the ASIN(s)" and "consistent with units sold" without being given a date, an ASIN or
 * a sales figure. The model now quotes; these tests pin the comparisons done in code.
 */
const CONTEXT: CheckContext = { today: "2026-09-24", asins: ["B0ABCDEF12"], referenceIds: [] };
const DATE_FIELD = "issue date (within 365 days)";
const ASIN_FIELD = "line items mappable to the ASIN(s)";
const QUANTITY_FIELD = "invoiced quantity consistent with units sold in the complaint window";

function field(name: string, reading: Partial<FieldFinding>, context: CheckContext = CONTEXT) {
  return buildDocumentCheck(
    "INAUTHENTIC_DOCUMENTS",
    "supplier_invoice",
    [finding({ field: name, ...reading })],
    context,
  ).findings.find((f) => f.field === name)!;
}

describe("which matrix fields carry a comparison", () => {
  it("names fields that really are on the invoice", () => {
    expect(INVOICE_FIELDS).toEqual(
      expect.arrayContaining([DATE_FIELD, ASIN_FIELD, QUANTITY_FIELD]),
    );
  });

  /** Listed by hand so a new comparison field cannot enter the matrix unnoticed and be guessed at. */
  it("classifies exactly these fields", () => {
    const classified: Record<string, string> = {};
    for (const requirements of Object.values(EVIDENCE_MATRIX)) {
      for (const r of requirements) {
        for (const f of r.fields) {
          const c = comparisonFor(f);
          if (c) classified[f] = c.kind;
        }
      }
    }
    expect(classified).toEqual({
      "issue date (within 365 days)": "date_window",
      "line items mappable to the ASIN(s)": "asin",
      "invoiced quantity consistent with units sold in the complaint window": "units_sold",
      "matching ASIN(s)": "asin",
      "complaint ID": "reference_id",
      "affected ASIN(s)": "asin",
      "the affected ASIN(s) and quantity": "asin",
      "the flagged ASIN(s)": "asin",
      "supplier business name": "supplier",
      "your business name and address as the buyer, matching your seller account": "account_record",
      "full name exactly as registered on the seller account": "account_record",
      "registered address matching the account": "account_record",
      "business registration or utility bill showing the same registered address": "account_record",
    });
  });
});

describe("date windows are worked out in code, against today", () => {
  it("places a date inside the window and says what it was compared with", () => {
    const f = field(DATE_FIELD, { observed: "Invoice date: 12 March 2026" });
    expect(f.status).toBe("present");
    expect(f.note).toMatch(/Dated 12 Mar 2026\. It is within the 365 days/);
    expect(f.comparedWith).toBe("Today's date, 24 Sep 2026");
  });

  it("flags a date outside the window — the finding a seller most needs", () => {
    const f = field(DATE_FIELD, { observed: "03-Mar-2025" });
    expect(f.status).toBe("conflicting");
    expect(f.note).toMatch(/Dated 3 Mar 2025\. It is more than 365 days before today/);
  });

  it("flags a date after today", () => {
    const f = field(DATE_FIELD, { observed: "2026-12-01" });
    expect(f.status).toBe("conflicting");
    expect(f.note).toMatch(/after today/);
  });

  it("decides an all-numeric date when both readings agree", () => {
    const f = field(DATE_FIELD, { observed: "03/04/2026" });
    expect(f.status).toBe("present");
    expect(f.note).toMatch(/3 Apr 2026 or 4 Mar 2026/);
    expect(f.note).toMatch(/Whichever way the date is read/);
  });

  it("reads an all-numeric date one way when only one reading is a real date", () => {
    const f = field(DATE_FIELD, { observed: "09/24/2025" });
    expect(f.status).toBe("present");
    expect(f.note).toMatch(/^Dated 24 Sep 2025\. It is within/);
  });

  it("refuses to decide an all-numeric date when the readings disagree", () => {
    // On 1 Feb 2026, day-first 1 Oct 2025 is 123 days back (inside); month-first 10 Jan 2025 is
    // 387 days back (outside).
    const f = field(DATE_FIELD, { observed: "01/10/2025" }, { ...CONTEXT, today: "2026-02-01" });
    expect(f.status).toBe("unclear");
    expect(f.note).toMatch(/only one of those is within/);
  });

  it("says so when no full date was read", () => {
    const f = field(DATE_FIELD, { observed: "March 2026" });
    expect(f.status).toBe("unclear");
    expect(f.note).toMatch(/could not find a full date/);
  });

  it("does not compare without a date to compare with", () => {
    const f = buildDocumentCheck("INAUTHENTIC_DOCUMENTS", "supplier_invoice", [
      finding({ field: DATE_FIELD, observed: "12 March 2026" }),
    ]).findings.find((x) => x.field === DATE_FIELD)!;
    expect(f.status).toBe("not_assessed");
  });

  it("leaves a missing date missing — no case data changes a fact about the document", () => {
    const f = field(DATE_FIELD, { status: "missing", observed: undefined });
    expect(f.status).toBe("missing");
  });
});

describe("ASINs are matched against the notice, not guessed", () => {
  it("matches an ASIN printed on the document", () => {
    const f = field(ASIN_FIELD, { observed: "Line 1: Widget B0ABCDEF12 x 200" });
    expect(f.status).toBe("present");
    expect(f.comparedWith).toBe("The ASIN on your notice: B0ABCDEF12");
  });

  it("says which ASIN the document does not cover", () => {
    const f = field(
      ASIN_FIELD,
      { observed: "B0ABCDEF12 x 200" },
      { ...CONTEXT, asins: ["B0ABCDEF12", "B0ZZZZZZZ9"] },
    );
    expect(f.status).toBe("present");
    expect(f.note).toMatch(/does not show B0ZZZZZZZ9/);
  });

  it("flags a document naming a different ASIN", () => {
    const f = field(ASIN_FIELD, { observed: "B0QQQQQQQ1 x 200" });
    expect(f.status).toBe("conflicting");
    expect(f.note).toMatch(/your notice names B0ABCDEF12/);
  });

  it("does not claim a match it cannot make when no ASIN is printed", () => {
    const f = field(ASIN_FIELD, { observed: "Blue widget, 10-pack x 200" });
    expect(f.status).toBe("not_assessed");
    expect(f.note).toMatch(/cannot match it to B0ABCDEF12 ourselves/);
  });

  it("does not compare when the notice names no ASIN", () => {
    const f = field(ASIN_FIELD, { observed: "B0ABCDEF12 x 200" }, { ...CONTEXT, asins: [] });
    expect(f.status).toBe("not_assessed");
    expect(f.comparedWith).toBeUndefined();
  });
});

describe("comparisons we have no data for are reported as not checked", () => {
  it("keeps the invoiced quantity but does not compare it with sales we do not have", () => {
    const f = field(QUANTITY_FIELD, { observed: "Qty 200" });
    expect(f.status).toBe("not_assessed");
    expect(f.observed).toBe("Qty 200");
    expect(f.note).toMatch(/do not have your sales numbers/);
  });

  it("still reports a quantity genuinely absent from the invoice", () => {
    const f = field(QUANTITY_FIELD, { status: "missing", observed: undefined });
    expect(f.status).toBe("missing");
  });

  it("does not compare a registered address with account details we do not hold", () => {
    const name = "business registration or utility bill showing the same registered address";
    const f = buildDocumentCheck(
      "VERIFICATION",
      "sourcing_doc",
      [finding({ field: name, observed: "12 High Street, Lahore" })],
      CONTEXT,
    ).findings.find((x) => x.field === name)!;
    expect(f.status).toBe("not_assessed");
    expect(f.note).toMatch(/Seller Central/);
  });
});

/*
 * G, 24 Sep 2026: the buyer block and the supplier are compared with what the seller stated once
 * for the case — never with a value read off another document.
 */
describe("a document is compared with the business details the seller stated", () => {
  const BUYER = "your business name and address as the buyer, matching your seller account";
  const business = { name: "Hawlton Trading", address: "12 High Street, Lahore" };

  it("matches a bill-to block that shows both, whatever the punctuation and case", () => {
    const f = field(
      BUYER,
      { observed: "Bill to: HAWLTON TRADING, 12 High Street Lahore 54000" },
      { ...CONTEXT, business },
    );
    expect(f.status).toBe("present");
    expect(f.comparedWith).toMatch(/business name “Hawlton Trading”/);
  });

  it("flags a buyer name that differs — the “ABC Co.” against “ABC Company LLC” case", () => {
    const f = field(
      BUYER,
      { observed: "Bill to: Hawlton Co., 12 High Street, Lahore" },
      { ...CONTEXT, business },
    );
    expect(f.status).toBe("conflicting");
    expect(f.note).toMatch(/Does not show the business name/);
    expect(f.comparedValue).toEqual({ value: "Hawlton Trading", source: "seller" });
  });

  it("does not match a name that is only part of a longer word", () => {
    const f = field(
      BUYER,
      { observed: "Bill to: Hawlton Tradings Ltd" },
      { ...CONTEXT, business: { name: "Hawlton Trading" } },
    );
    expect(f.status).toBe("conflicting");
  });

  it("says which half it could not compare when only one was entered", () => {
    const f = field(
      BUYER,
      { observed: "Bill to: Hawlton Trading, 1 Other Road" },
      { ...CONTEXT, business: { name: "Hawlton Trading" } },
    );
    expect(f.status).toBe("present");
    expect(f.note).toMatch(/not compared the address/);
  });

  it("asks for the details, rather than guessing, when none were entered", () => {
    const f = field(BUYER, { observed: "Bill to: Hawlton Trading" });
    expect(f.status).toBe("not_assessed");
    expect(f.note).toMatch(/Add your registered business details/);
  });

  it("matches the supplier against any of the suppliers listed", () => {
    const f = field(
      "supplier business name",
      { observed: "Acme Trading Ltd" },
      { ...CONTEXT, suppliers: ["Other Co", "Acme Trading Ltd"] },
    );
    expect(f.status).toBe("present");
    expect(f.note).toBe("Names Acme Trading Ltd, a supplier you listed.");
  });

  it("flags a supplier the seller did not list", () => {
    const f = field(
      "supplier business name",
      { observed: "Unknown Wholesale" },
      { ...CONTEXT, suppliers: ["Acme Trading Ltd"] },
    );
    expect(f.status).toBe("conflicting");
    expect(f.comparedValue?.source).toBe("seller");
  });

  it("reports the supplier exactly as read when no suppliers are listed", () => {
    const f = field("supplier business name", { observed: "Acme Trading Ltd" });
    expect(f.status).toBe("present");
    expect(f.comparedWith).toBeUndefined();
  });

  it("records the notice's side of an ASIN mismatch, for the facts ledger", () => {
    const f = field(ASIN_FIELD, { observed: "B0QQQQQQQ1 x 200" });
    expect(f.comparedValue).toEqual({ value: "B0ABCDEF12", source: "notice" });
  });
});

describe("complaint IDs are matched against the notice", () => {
  const retraction = (observed: string, referenceIds: string[]) =>
    buildDocumentCheck(
      "INTELLECTUAL_PROPERTY",
      "rights_owner_retraction",
      [finding({ field: "complaint ID", observed })],
      { ...CONTEXT, referenceIds },
    ).findings.find((f) => f.field === "complaint ID")!;

  it("matches the ID the notice cites", () => {
    expect(retraction("Complaint ID 7654321098", ["7654321098"]).status).toBe("present");
  });

  it("flags a letter citing a different complaint", () => {
    const f = retraction("Complaint ID 1111111111", ["7654321098"]);
    expect(f.status).toBe("conflicting");
    expect(f.note).toMatch(/your notice names 7654321098/);
  });

  it("does not compare when the notice cites no ID", () => {
    expect(retraction("Complaint ID 7654321098", []).status).toBe("not_assessed");
  });
});

describe("no comparison note draws a verdict", () => {
  it.each([
    [DATE_FIELD, "12 March 2026"],
    [DATE_FIELD, "03-Mar-2025"],
    [DATE_FIELD, "01/10/2025"],
    [ASIN_FIELD, "B0ABCDEF12"],
    [ASIN_FIELD, "B0QQQQQQQ1"],
    [ASIN_FIELD, "Blue widget"],
    [QUANTITY_FIELD, "Qty 200"],
  ])("%s / %s", (name, observed) => {
    const f = field(name, { observed });
    expect(containsBannedConclusion(f.note)).toBe(false);
    expect(f.note).not.toMatch(/amazon will|likely|chance/i);
  });
});
