import { describe, expect, it } from "vitest";
import {
  buildDocumentCheck,
  checkContextKey,
  looksLikeWrongDocument,
  reanchorDateWindows,
  requirementForCheck,
  type CheckContext,
  type FieldFinding,
} from "./documentCheck";
import { noticeDateFrom } from "@/lib/documentChecks/context";
import { plainFieldLabel } from "@/lib/documentChecks/plainLabels";

const DATE_FIELD = "issue date (within 365 days)";

function present(field: string, observed: string): FieldFinding {
  return { field, status: "present", note: "Read from the document.", observed };
}

function dateRow(observed: string, context: CheckContext) {
  return buildDocumentCheck(
    "INAUTHENTIC_DOCUMENTS",
    "supplier_invoice",
    [present(DATE_FIELD, observed)],
    context,
  ).findings.find((f) => f.field === DATE_FIELD)!;
}

describe("the 365 days are counted back from the notice, not from today (A8)", () => {
  // Today is 14 months after the invoice; the notice came 5 months after it.
  const base: CheckContext = { today: "2026-10-06", asins: [], referenceIds: [] };

  it("a 14-month-old invoice is outside the window counted from today", () => {
    const row = dateRow("6 August 2025", base);
    expect(row.status).toBe("conflicting");
    expect(row.comparedWith).toMatch(/^Today's date/);
  });

  it("the same invoice is inside the window of an older notice, and the row says which notice", () => {
    const row = dateRow("6 August 2025", { ...base, noticeDate: "2026-01-15" });
    expect(row.status).toBe("present");
    expect(row.note).toMatch(/within 365 days before the notice dated 15 Jan 2026/);
    expect(row.comparedWith).toBe("The date of your notice, 15 Jan 2026");
  });

  it("an invoice more than 365 days before the notice is still outside, naming the notice", () => {
    const row = dateRow("6 August 2025", { ...base, noticeDate: "2026-09-01" });
    expect(row.status).toBe("conflicting");
    expect(row.note).toMatch(/more than 365 days before the notice dated 1 Sep 2026/);
  });

  it("an invoice issued after the notice is left for the seller, not called a conflict", () => {
    const row = dateRow("20 February 2026", { ...base, noticeDate: "2026-01-15" });
    expect(row.status).toBe("unclear");
    expect(row.note).toMatch(/after the notice dated 15 Jan 2026/);
  });

  it("without a notice date the window is still counted from today, as before", () => {
    const row = dateRow("3 March 2026", base);
    expect(row.status).toBe("present");
    expect(row.note).toMatch(/is within the 365 days this record must fall in/);
  });

  it("re-anchors a reading the server judged against its own clock", () => {
    const requirement = requirementForCheck("INAUTHENTIC_DOCUMENTS", "supplier_invoice")!;
    const server = buildDocumentCheck(
      "INAUTHENTIC_DOCUMENTS",
      "supplier_invoice",
      requirement.fields.map((f) => present(f, f === DATE_FIELD ? "6 August 2025" : "as printed")),
      base,
    );
    expect(server.findings.find((f) => f.field === DATE_FIELD)!.status).toBe("conflicting");
    const fixed = reanchorDateWindows(server, "INAUTHENTIC_DOCUMENTS", {
      today: base.today,
      noticeDate: "2026-01-15",
    });
    const row = fixed.findings.find((f) => f.field === DATE_FIELD)!;
    expect(row.status).toBe("present");
    expect(row.comparedWith).toBe("The date of your notice, 15 Jan 2026");
    // Every other row is untouched.
    expect(fixed.findings.filter((f) => f.field !== DATE_FIELD)).toEqual(
      server.findings.filter((f) => f.field !== DATE_FIELD),
    );
  });

  it("leaves a reading alone when the case has no notice date", () => {
    const server = buildDocumentCheck(
      "INAUTHENTIC_DOCUMENTS",
      "supplier_invoice",
      [present(DATE_FIELD, "6 August 2025")],
      base,
    );
    expect(reanchorDateWindows(server, "INAUTHENTIC_DOCUMENTS", { today: base.today })).toBe(
      server,
    );
  });

  it("reads the notice date from the notice's own header, newest request first", () => {
    expect(noticeDateFrom(["Date: 15 January 2026\nYour account has been suspended."])).toBe(
      "2026-01-15",
    );
    expect(noticeDateFrom(["No date in this one.", "Date: 2 February 2026\nEarlier."])).toBe(
      "2026-02-02",
    );
    expect(noticeDateFrom(["No date here."])).toBeUndefined();
  });

  it("a notice date changes the saved-check key only when there is one", () => {
    const a = checkContextKey({ asins: ["B0ABCDEF12"] });
    expect(checkContextKey({ asins: ["B0ABCDEF12"], noticeDate: undefined })).toBe(a);
    expect(checkContextKey({ asins: ["B0ABCDEF12"], noticeDate: "2026-01-15" })).not.toBe(a);
  });
});

describe("a document that is probably the wrong file (B3)", () => {
  const fields = requirementForCheck("INAUTHENTIC_DOCUMENTS", "supplier_invoice")!.fields;
  const allMissing = (): FieldFinding[] =>
    fields.map((f) => ({ field: f, status: "missing", note: "Not found." }));

  it("is flagged when no supplier name, address or date was found", () => {
    const result = buildDocumentCheck("INAUTHENTIC_DOCUMENTS", "supplier_invoice", allMissing());
    expect(looksLikeWrongDocument(result)).toBe(true);
  });

  it("is not flagged when the date was found", () => {
    const readings = allMissing().map((f) =>
      f.field === DATE_FIELD ? present(DATE_FIELD, "3 March 2026") : f,
    );
    const result = buildDocumentCheck("INAUTHENTIC_DOCUMENTS", "supplier_invoice", readings, {
      today: "2026-10-06",
      asins: [],
      referenceIds: [],
    });
    expect(looksLikeWrongDocument(result)).toBe(false);
  });

  it("is not flagged when nothing was read at all (no reading says nothing about the file)", () => {
    const result = buildDocumentCheck("INAUTHENTIC_DOCUMENTS", "supplier_invoice", []);
    expect(looksLikeWrongDocument(result)).toBe(false);
  });

  it("is only ever said about a supplier invoice", () => {
    const result = buildDocumentCheck("INAUTHENTIC_DOCUMENTS", "brand_authorization", []);
    expect(looksLikeWrongDocument(result)).toBe(false);
  });
});

describe("plain row labels", () => {
  it("maps the two matrix phrases at display time and leaves every other field as stored", () => {
    expect(plainFieldLabel("line items mappable to the ASIN(s)")).toBe(
      "Does it list the product Amazon named?",
    );
    expect(
      plainFieldLabel(
        "invoiced quantity consistent with units sold of each cited ASIN in the 365 days before the notice",
      ),
    ).toBe("Do the quantities match what you sold?");
    expect(plainFieldLabel("supplier business name")).toBe("supplier business name");
  });
});
