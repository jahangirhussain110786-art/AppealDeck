import { describe, expect, it } from "vitest";
import {
  buildDocumentCheck,
  containsBannedConclusion,
  requirementForCheck,
  sanitizeNote,
  type FieldFinding,
} from "./documentCheck";
import { documentDateReadings } from "./documentDate";
import { readFieldsFromText } from "./localReading";
import { checkWordingLock } from "./wordingLock";

const BUSINESS = {
  name: "Brightwater Home Goods LLC",
  address: "214 Juniper Lane, Suite 5, Austin, TX 78701",
};

function invoiceFindings(text: string) {
  const fields = requirementForCheck("INAUTHENTIC", "supplier_invoice")!.fields;
  const findings = readFieldsFromText(text, fields, { business: BUSINESS }, "pdf_text");
  return buildDocumentCheck("INAUTHENTIC", "supplier_invoice", findings, {
    today: "2026-10-06",
    asins: [],
    referenceIds: [],
    business: BUSINESS,
  });
}

describe("local reading: Bill To / Ship To columns", () => {
  const TWO_COLUMNS = [
    "Bill To:   Ship To:",
    "Brightwater Home Goods LLC   Prep Pros Inc",
    "214 Juniper Lane, Suite 5   99 Dock Rd",
    "Austin, TX 78701   Newark, NJ 07105",
  ].join("\n");

  it("does not report a conflict on the buyer when the two columns arrive interleaved", () => {
    const f = invoiceFindings(TWO_COLUMNS).findings.filter((x) =>
      /as registered on the seller account|seller account/i.test(x.field),
    );
    expect(f.length).toBeGreaterThan(0);
    for (const finding of f) {
      expect(finding.status, finding.field).toBe("not_assessed");
      expect(finding.note).toMatch(/next to each other/);
    }
  });

  it("does the same when the two headers arrive as two lines in a row", () => {
    const text = [
      "Bill To:",
      "Ship To:",
      TWO_COLUMNS.split("\n")[1],
      TWO_COLUMNS.split("\n")[2],
    ].join("\n");
    const f = invoiceFindings(text).findings.filter((x) => /seller account/i.test(x.field));
    for (const finding of f) expect(finding.status).not.toBe("conflicting");
    expect(f.some((x) => x.status === "not_assessed")).toBe(true);
  });

  it("still reads stacked blocks that each have their own value", () => {
    const text = [
      "Bill To: Brightwater Home Goods LLC",
      "Ship To: Prep Pros Inc",
      "214 Juniper Lane, Suite 5, Austin, TX 78701",
    ].join("\n");
    const f = invoiceFindings(text).findings.filter((x) => /seller account/i.test(x.field));
    expect(f.some((x) => x.status === "not_assessed" && /next to each other/.test(x.note))).toBe(
      false,
    );
  });
});

describe("documentDateReadings: more than one date", () => {
  it("does not take the first date of a quote that holds two different dates", () => {
    expect(documentDateReadings("Order date 01 Mar 2025; Invoice date 05 Mar 2026")).toEqual([
      "2026-03-05",
    ]);
    expect(documentDateReadings("01 Mar 2025 and 05 Mar 2026")).toEqual([]);
  });

  it("keeps the same day written twice as one date", () => {
    expect(documentDateReadings("5 March 2026 (2026-03-05)")).toEqual(["2026-03-05"]);
  });

  it("reads a two-digit year after a month name", () => {
    expect(documentDateReadings("05-Mar-26")).toEqual(["2026-03-05"]);
  });

  it("reads 05-Mar-26 on a printed line, and ignores Lieferdatum", () => {
    const fields = ["issue date (within 365 days)"];
    const [a] = readFieldsFromText("Rechnung\n05-Mar-26", fields, {}, "pdf_text");
    expect(a?.observed).toBe("05-Mar-26");
    const [b] = readFieldsFromText("Lieferdatum: 10 June 2026", fields, {}, "pdf_text");
    expect(b?.status).not.toBe("present");
  });
});

describe("buildDocumentCheck: quotes and field names", () => {
  const supplierField = "supplier business name";
  const finding = (
    field: string,
    observed: string,
    note = "Read from the document.",
  ): FieldFinding => ({ field, status: "present", observed, note }) as FieldFinding;

  it.each([
    "Genuine Parts & Co. Ltd",
    "Valid Ventures LLC",
    "Verified Wholesale Inc",
    "Approved Brands Ltd",
  ])("keeps the quote of a supplier called %s", (name) => {
    const check = buildDocumentCheck("INAUTHENTIC", "supplier_invoice", [
      finding(supplierField, name),
    ]);
    const f = check.findings.find((x) => x.field === supplierField);
    expect(f?.observed).toBe(name);
    expect(f?.note).not.toMatch(/nothing was quoted/);
  });

  it("still drops a verdict smuggled into a free-text quote", () => {
    const fields = requirementForCheck("INAUTHENTIC", "supplier_invoice")!.fields;
    const free = fields.find((f) => !/name|address|ASIN|date/i.test(f))!;
    const check = buildDocumentCheck("INAUTHENTIC", "supplier_invoice", [
      finding(free, "this invoice looks genuine"),
    ]);
    expect(check.findings.find((x) => x.field === free)?.observed).toBeUndefined();
  });

  it.each([
    "Amazon will accept this invoice.",
    "This should pass Amazon's review.",
    "This meets all of Amazon's requirements.",
    "This is a real invoice.",
    "It meets Amazon's requirements.",
  ])("neutralises a note that asserts acceptance: %s", (note) => {
    expect(containsBannedConclusion(note)).toBe(true);
    expect(sanitizeNote(note)).toMatch(/Check it against the original/);
  });

  it("leaves ordinary notes alone", () => {
    for (const note of [
      "The date printed in the document. Check it on the original.",
      "Read from the supplier section of the document.",
      "Amazon asked for the invoice to list the ASIN.",
    ])
      expect(sanitizeNote(note)).toBe(note);
  });

  it("matches a model's field name by case, punctuation and spacing", () => {
    const fields = requirementForCheck("INAUTHENTIC", "supplier_invoice")!.fields;
    const target = fields[0]!;
    const sloppy = target.toUpperCase().replace(/\(/g, " (").concat(".");
    const check = buildDocumentCheck("INAUTHENTIC", "supplier_invoice", [
      finding(sloppy, "Example text", "A note."),
    ]);
    expect(check.findings.filter((f) => f.status === "present")).toHaveLength(1);
    expect(check.findings[0]?.field).toBe(target);
    expect(check.findings).toHaveLength(fields.length);
  });
});

describe("wordingLock: holes and false rejections", () => {
  const base = "The package arrived late and we refunded the buyer.";

  it("catches a new sentence-initial name", () => {
    expect(checkWordingLock(base, `${base} DHL delivered late.`).ok).toBe(false);
    expect(checkWordingLock(base, `${base} Prep Pros delivered late.`).ok).toBe(false);
  });

  it("catches a parenthesised name", () => {
    const r = checkWordingLock(base, "The package arrived late (Acme) and we refunded the buyer.");
    expect(r.added).toContain("acme");
  });

  it("catches 'twice' added or dropped", () => {
    expect(checkWordingLock("We sent it to the buyer.", "We sent it twice to the buyer.").ok).toBe(
      false,
    );
    expect(checkWordingLock("We sent it twice to the buyer.", "We sent it to the buyer.").ok).toBe(
      false,
    );
  });

  it("accepts 'might' for a lowercase 'may', but still guards the month", () => {
    expect(
      checkWordingLock(
        "A fault may have been created by us.",
        "A fault might have been created by us.",
      ).ok,
    ).toBe(true);
    expect(checkWordingLock("It shipped on 5 May.", "It shipped on 5 June.").ok).toBe(false);
  });

  it("accepts 'Order No.' written as 'Order #'", () => {
    expect(
      checkWordingLock(
        "Order No. 112-4830291-5520134 was late.",
        "Order #112-4830291-5520134 was late.",
      ).ok,
    ).toBe(true);
  });

  it("accepts 12 units written as twelve units, but not a changed number", () => {
    expect(
      checkWordingLock("We sold $1,234.50 for 12 units.", "We sold $1234.50 for twelve units.").ok,
    ).toBe(true);
    expect(checkWordingLock("We sold 10 units.", "We sold twelve units.").ok).toBe(false);
  });

  it("keeps the existing protections", () => {
    expect(checkWordingLock("We have retrained staff.", "We will retrain staff.").ok).toBe(false);
    expect(checkWordingLock("We did not ship it.", "We shipped it.").ok).toBe(false);
    expect(checkWordingLock("We shipped 5 units.", "We shipped 6 units.").ok).toBe(false);
    expect(checkWordingLock("There was no delay.", "There was a delay.").ok).toBe(false);
  });
});
