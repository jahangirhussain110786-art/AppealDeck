import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildDocumentCheck,
  containsBannedConclusion,
  summarizeCheck,
  requirementForCheck,
  type DocumentCheckResult,
} from "@/core/documentCheck";
import type { EvidenceKind, ViolationKind } from "@/core";
import { readFieldsFromText, type TextSource } from "@/core/localReading";
import { pdfDocumentText } from "./pdfText";
import { runDocumentCheck } from "./runCheck";

/**
 * The reading on the device, without AI (29 Sep 2026), run on the test documents in
 * `docs/handoffs/2026-09-29-test-documents/`. The text comes out of each PDF through pdf.js exactly
 * as it does in the browser, so these pin the whole chain: the words, the fields found, and the
 * comparisons `buildDocumentCheck` makes with them.
 */

const DOCS = join(process.cwd(), "docs/handoffs/2026-09-29-test-documents");
const TODAY = "2026-09-29";
const SELLER = {
  name: "Brightwater Home Goods LLC",
  address: "214 Juniper Lane, Suite 5, Austin, TX 78701, United States",
};

async function pdfText(file: string): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(readFileSync(join(DOCS, file)));
  const task = pdfjs.getDocument({ data, verbosity: 0 });
  try {
    return await pdfDocumentText(await task.promise, 10);
  } finally {
    await task.destroy();
  }
}

function check(
  text: string,
  kind: ViolationKind,
  evidenceKind: EvidenceKind,
  ctx: { asins?: string[]; suppliers?: string[]; business?: typeof SELLER },
  source: TextSource = "pdf_text",
): DocumentCheckResult {
  const fields = requirementForCheck(kind, evidenceKind)!.fields;
  const findings = readFieldsFromText(text, fields, ctx, source);
  return buildDocumentCheck(
    kind,
    evidenceKind,
    findings,
    {
      today: TODAY,
      asins: ctx.asins ?? [],
      referenceIds: [],
      ...(ctx.business ? { business: ctx.business } : {}),
      ...(ctx.suppliers ? { suppliers: ctx.suppliers } : {}),
    },
    // As `runCheck` does: every quote is a line copied out of the document by code.
    { quotesAreVerbatim: true },
  );
}

const status = (r: DocumentCheckResult, field: RegExp) =>
  r.findings.find((f) => field.test(f.field));

describe("reading a document on the device, without AI", () => {
  it("reads a complete invoice, and every comparison agrees with the case", async () => {
    const r = check(
      await pdfText("03-supplier-invoice-t01-authenticity.pdf"),
      "INAUTHENTIC",
      "supplier_invoice",
      {
        asins: ["B07KJ3M8QA", "B08RT2N6LX"],
        suppliers: ["Crestline Trade Supply Co."],
        business: SELLER,
      },
    );
    expect(status(r, /^supplier business name$/)).toMatchObject({
      status: "present",
      observed: "Crestline Trade Supply Co.",
    });
    expect(status(r, /supplier physical address/)?.observed).toContain("1450 Industrial Parkway");
    expect(status(r, /supplier phone/)).toMatchObject({ status: "present" });
    expect(status(r, /issue date/)).toMatchObject({ status: "present", observed: "3 June 2026" });
    expect(status(r, /ASIN/)).toMatchObject({ status: "present" });
    expect(status(r, /as the buyer|seller account/i)).toMatchObject({ status: "present" });
  });

  it("flags what is wrong with a quotation from 2024, from the words alone", async () => {
    const r = check(
      await pdfText("04-supplier-invoice-WITH-PROBLEMS.pdf"),
      "INAUTHENTIC",
      "supplier_invoice",
      {
        asins: ["B07KJ3M8QA", "B08RT2N6LX"],
        suppliers: ["Crestline Trade Supply Co."],
        business: SELLER,
      },
    );
    // Not one of the seller's suppliers.
    expect(status(r, /^supplier business name$/)).toMatchObject({
      status: "conflicting",
      observed: "Quickdeal Sourcing",
    });
    // A text PDF's words are the document's, so an address absent from its supplier section is absent.
    expect(status(r, /supplier physical address/)).toMatchObject({ status: "missing" });
    // An email address is a way to contact the supplier.
    expect(status(r, /supplier phone/)).toMatchObject({ status: "present" });
    expect(status(r, /issue date/)).toMatchObject({
      status: "conflicting",
      observed: "11 March 2024",
    });
    // No ASIN printed: not something the words can settle either way.
    expect(status(r, /ASIN/)).toMatchObject({ status: "not_assessed" });
    expect(status(r, /as the buyer|seller account/i)).toMatchObject({ status: "conflicting" });
  });

  it("reads a lab report's standard, laboratory and heading", async () => {
    const r = check(
      await pdfText("06-lab-test-report-t07.pdf"),
      "PRODUCT_SAFETY",
      "compliance_report",
      { asins: ["B0CX9L4TQ2"] },
    );
    expect(status(r, /standard or regulation/)).toMatchObject({
      status: "present",
      observed: "UL 62368-1",
    });
    expect(status(r, /issuing laboratory/)).toMatchObject({ status: "present" });
    expect(status(r, /test report or compliance certificate/)).toMatchObject({ status: "present" });
  });

  it("says a field it cannot judge from words is not checked, never not found", async () => {
    const r = check(
      await pdfText("01-supplier-invoice-sample-notice.pdf"),
      "POLICY",
      "supplier_invoice",
      { asins: ["B0EXAMPLE1"] },
    );
    for (const f of r.findings) expect(f.status, f.field).not.toBe("missing");
    expect(status(r, /ASIN/)).toMatchObject({ status: "present" });
  });

  it("reads an ASIN that OCR spelled with the letter O, and marks an OCR gap unreadable", () => {
    const text = [
      "INVOICE",
      "FROM",
      "Crestline Trade Supply Co.",
      "Columbus, OH",
      "BILL TO",
      "Brightwater Home Goods LLC",
      "Date: 3 June 2026",
      "BO7KJ3M8QA Bamboo cutting board set 120 $7.40 $888.00",
    ].join("\n");
    const r = check(text, "INAUTHENTIC", "supplier_invoice", { asins: ["B07KJ3M8QA"] }, "ocr");
    expect(status(r, /ASIN/)).toMatchObject({ status: "present" });
    // No phone in the supplier section, but OCR may have missed it: unreadable, not absent.
    expect(status(r, /supplier phone/)).toMatchObject({ status: "unclear" });
  });

  it("never draws a conclusion about a document", async () => {
    for (const file of [
      "01-supplier-invoice-sample-notice.pdf",
      "04-supplier-invoice-WITH-PROBLEMS.pdf",
      "05-letter-of-authorization-t03.pdf",
    ]) {
      const r = check(await pdfText(file), "INTELLECTUAL_PROPERTY", "supplier_invoice", {});
      for (const f of r.findings) {
        expect(containsBannedConclusion(f.note), `${file}: ${f.note}`).toBe(false);
        if (f.observed) expect(containsBannedConclusion(f.observed)).toBe(false);
      }
    }
  });
});

/**
 * 30 Sep 2026, from an independent review of the first version. Each of these was a way the reading
 * told a seller something about their document that the words did not support. The worst is false
 * reassurance (a green "Found" beside a line that does not answer the question); the next is a
 * "Not found" shown beside the very line that holds the answer.
 */
describe("the reading claims only what the words support", () => {
  const supplierInvoice = (fromBlock: string[]) =>
    [
      "INVOICE",
      "FROM",
      ...fromBlock,
      "BILL TO",
      "Brightwater Home Goods LLC",
      "Date: 3 June 2026",
    ].join("\n");
  const read = (text: string, pattern: RegExp, source: TextSource = "pdf_text") =>
    status(check(text, "INAUTHENTIC", "supplier_invoice", {}, source), pattern);

  it("does not say a non-US supplier address is not found beside the address itself", () => {
    const shenzhen = supplierInvoice([
      "Shenzhen Meihua Trading Co., Ltd",
      "Block 7, Tianfu Software Park, Nanshan District, Shenzhen 518000, China",
      "Tel: +86 755 8888 6666",
    ]);
    const address = read(shenzhen, /supplier physical address/);
    expect(address?.status).not.toBe("missing");
    expect(address?.observed).toContain("Tianfu Software Park");
    expect(read(shenzhen, /supplier phone/)).toMatchObject({ status: "present" });

    const milan = supplierInvoice(["Rossi Forniture Srl", "Via Roma 12, Milano", "Tel: 555-0142"]);
    expect(read(milan, /supplier physical address/)?.status).not.toBe("missing");
    // A short number after "Tel:" is still a phone number.
    expect(read(milan, /supplier phone/)).toMatchObject({
      status: "present",
      observed: "555-0142",
    });
  });

  it("says an address is missing only when nothing left in the supplier block could be one", () => {
    const none = supplierInvoice([
      "Crestline Trade Supply Co.",
      "(no address given)",
      "a@b.example",
    ]);
    expect(read(none, /supplier physical address/)).toMatchObject({ status: "missing" });
    // The same block read from a picture is unreadable, not absent.
    expect(read(none, /supplier physical address/, "ocr")).toMatchObject({ status: "unclear" });
    // Something is there that we cannot classify: we say so, we do not call it absent.
    const odd = supplierInvoice([
      "Crestline Trade Supply Co.",
      "Warehouse annex, gate C",
      "a@b.example",
    ]);
    expect(read(odd, /supplier physical address/)?.status).toBe("unclear");
  });

  it("does not turn a number in the supplier block into a claim that there is no phone", () => {
    const odd = supplierInvoice(["Crestline Trade Supply Co.", "Trunk 614 555 0193 ext 4"]);
    expect(read(odd, /supplier phone/)?.status).not.toBe("missing");
  });

  it("does not quote an address's 'Unit 12' as the quantity, and prefers the table row", () => {
    const text = [
      "FROM",
      "Crestline Trade Supply Co.",
      "1450 Industrial Parkway, Unit 12",
      "Columbus, OH 43219",
      "Item Description Qty Unit price Amount",
      "J-104 Bottle B0EXAMPLE1 40 $6.20 $248.00",
    ].join("\n");
    const q = status(check(text, "INAUTHENTIC", "supplier_invoice", {}), /invoiced quantity/);
    expect(q?.observed).toContain("40 $6.20 $248.00");
    expect(q?.observed).not.toContain("Unit 12");
  });

  it("does not offer 'Unit 12' from an address when there is no quantity at all", () => {
    const text = ["FROM", "Crestline Trade Supply Co.", "1450 Industrial Parkway, Unit 12"].join(
      "\n",
    );
    const q = status(check(text, "INAUTHENTIC", "supplier_invoice", {}), /invoiced quantity/);
    expect(q?.observed ?? "").not.toContain("Unit 12");
  });

  it("does not show a mere mention as 'Found': a word near the answer is only a pointer", () => {
    const orders = [
      "Order log Jan-Mar 2026",
      "Order 111-1234567-1234567 Disposable gloves 3 units",
      "Return address: 12 Main St",
    ].join("\n");
    const complaint = status(
      check(orders, "POLICY", "metric_export", {}),
      /complaint, return or claim/,
    );
    expect(complaint?.status).toBe("not_assessed");
    expect(complaint?.observed).toContain("Return address");

    const inventory = status(
      check("Disposable gloves box of 100", "PRODUCT_SAFETY", "disposal_or_recall_proof", {}),
      /what happened to the affected inventory/,
    );
    expect(inventory?.status).toBe("not_assessed");

    // A real Amazon order number is a pattern, not a word: that is still "Found".
    const report = status(
      check(orders, "POLICY", "metric_export", {}),
      /order or sales report|export of the individual orders/,
    );
    expect(report?.status).toBe("present");
  });

  it("does not say everything is readable when a device reading only found matching lines", () => {
    // Every field present: the summary must not read as the AI reading's "everything readable".
    const r = check(
      "Test report\nTested to UL 62368-1\nIntertek Testing Laboratory",
      "PRODUCT_SAFETY",
      "compliance_report",
      {},
    );
    expect(summarizeCheck({ ...r, readOn: "device" })).toMatch(/matching line in the text/);
    expect(summarizeCheck({ ...r, readOn: "device" })).not.toMatch(/^Everything Amazon named/);
    // The AI reading's own sentence is unchanged.
    expect(summarizeCheck(r)).toMatch(/^Everything Amazon named is readable/);
  });

  it("does not turn an ordinary word starting 'BO' into a product code, and reads a scanned O as a zero", () => {
    const street = "INVOICE\nFROM\nAcme Ltd\n12 Boulevards Road, Leeds\nDate: 3 June 2026";
    const none = read(street, /ASIN/, "ocr");
    expect(none?.status).toBe("not_assessed");
    expect(none?.observed ?? "").not.toContain("B0ULEVARDS");

    const corrected = status(
      check(
        "BO7KJ3M8QA Bamboo board 12 $7.40 $88.80",
        "INAUTHENTIC",
        "supplier_invoice",
        { asins: ["B07KJ3M8QA"] },
        "ocr",
      ),
      /ASIN/,
    );
    expect(corrected).toMatchObject({ status: "present", observed: "B07KJ3M8QA" });
    // Read from a text PDF the same letters are left as printed.
    expect(read("BO7KJ3M8QA Bamboo board", /ASIN/)?.status).toBe("not_assessed");
  });

  it("does not take an invoice number or a tax line for the supplier's name", () => {
    const text = supplierInvoice([
      "Invoice No. 1042",
      "Tax ID: 12-3456789",
      "Crestline Trade Supply Co.",
    ]);
    expect(read(text, /^supplier business name$/)?.observed).toBe("Crestline Trade Supply Co.");
    // ... but a name that merely starts with the word is a name.
    expect(
      read(supplierInvoice(["Invoice Supply Co."]), /^supplier business name$/)?.observed,
    ).toBe("Invoice Supply Co.");
  });

  it("does not take a due date for the date the document was issued", () => {
    const text =
      "INVOICE\nFROM\nCrestline Trade Supply Co.\nPayment due 30 September 2026\nB07KJ3M8QA";
    const date = read(text, /issue date/);
    expect(date?.observed ?? "").not.toContain("30 September 2026");
  });

  describe("a promise, a denial or a factory profile is not a test report", () => {
    const compliance = (text: string) =>
      check(text, "PRODUCT_SAFETY", "compliance_report", {}).findings;
    const by = (f: DocumentCheckResult["findings"], re: RegExp) => f.find((x) => re.test(x.field));

    it("does not call a supplier's assurance a test report, laboratory or standard", () => {
      const f = compliance(
        [
          "We assure you our chargers are tested in independent laboratories to UL 62368-1.",
          "A certificate of compliance is available on request.",
        ].join("\n"),
      );
      expect(by(f, /test report or compliance certificate/)?.status).toBe("not_assessed");
      expect(by(f, /issuing laboratory/)?.status).toBe("not_assessed");
      expect(by(f, /standard or regulation/)?.status).toBe("not_assessed");
      // The line is still shown, as a pointer.
      expect(by(f, /test report or compliance certificate/)?.observed).toContain("on request");
    });

    it("does not read a denial as a record", () => {
      const f = compliance(
        [
          "We do not claim compliance with UL 62368-1.",
          "Certificate of conformity: none.",
          "Laboratory: not used",
        ].join("\n"),
      );
      for (const re of [
        /test report or compliance/,
        /issuing laboratory/,
        /standard or regulation/,
      ]) {
        expect(by(f, re)?.status, String(re)).toBe("not_assessed");
      }
    });

    it("does not take a factory's ISO 9001 for the standard a product was tested to", () => {
      const f = compliance(
        "ISO 9001:2015 certified factory\nLaboratory on site\nTest report available on request",
      );
      expect(by(f, /standard or regulation/)?.status).toBe("not_assessed");
      expect(by(f, /issuing laboratory/)?.status).toBe("not_assessed");
      expect(by(f, /test report or compliance/)?.status).toBe("not_assessed");
    });

    it("still finds a real report, whose 'Report No.' is an identifier and not a denial", () => {
      const f = compliance(
        "TEST REPORT\nReport No. 1042\nTested to UL 62368-1\nIntertek Testing Laboratory",
      );
      expect(by(f, /test report or compliance/)).toMatchObject({
        status: "present",
        observed: "TEST REPORT",
      });
      expect(by(f, /standard or regulation/)).toMatchObject({
        status: "present",
        observed: "UL 62368-1",
      });
      expect(by(f, /issuing laboratory/)?.status).toBe("present");
    });

    it("does not take the word 'authorization' in a returns line for an authorization record", () => {
      const ip = (text: string, evidence: "supplier_invoice" | "brand_authorization") =>
        check(text, "INTELLECTUAL_PROPERTY", evidence, {}).findings;
      const invoice = ip("INVOICE\nReturns need prior authorization (RMA).", "supplier_invoice");
      expect(by(invoice, /authorized distributor/)?.status).not.toBe("present");
      const licence = ip(
        "Only authorized staff may sign\nSamples licensed for display only",
        "brand_authorization",
      );
      expect(by(licence, /authorization or license/)?.status).not.toBe("present");
      // A letter that is one is still found.
      const letter = ip("LETTER OF AUTHORIZATION", "brand_authorization");
      expect(by(letter, /authorization or license/)?.status).toBe("present");
    });
  });

  it("does not report the seller's own name as the buyer, or a ship-to block as the bill-to", () => {
    const business = {
      name: "Brightwater Home Goods LLC",
      address: "214 Juniper Lane, Suite 5, Austin, TX 78701",
    };
    const buyer = (text: string) =>
      status(
        check(text, "INAUTHENTIC", "supplier_invoice", { business }),
        /as the buyer|seller account/i,
      );
    // Issued BY the seller, with no buyer section.
    const issuedBySeller = buyer(
      "SALES INVOICE\nBrightwater Home Goods LLC\n214 Juniper Lane\nAustin, TX 78701\nSold to reseller\nTotal $300",
    );
    expect(issuedBySeller?.status).not.toBe("present");
    expect(issuedBySeller?.note ?? "").not.toMatch(/^Shows /);
    // The seller's warehouse under SHIP TO, billed to someone else.
    const dropShip = buyer(
      "SHIP TO\nBrightwater Home Goods LLC\n214 Juniper Lane, Suite 5\nAustin, TX 78701\nBILL TO\nSomeone Else Trading Inc\n9 Elm Street\nReno, NV 89501",
    );
    expect(dropShip).toMatchObject({ status: "conflicting" });
  });

  describe("the issue date", () => {
    const issue = (text: string) => read(text, /issue date/);

    it("prefers the label that says issued, not the first line with the word 'date'", () => {
      const printedFirst = issue(
        "INVOICE\nDate printed: 28 September 2026\nInvoice date: 3 March 2025",
      );
      expect(printedFirst).toMatchObject({ observed: "3 March 2025" });
      expect(issue("PO date: 25 September 2026\nInvoice date: 3 March 2025")?.observed).toBe(
        "3 March 2025",
      );
      expect(issue("Order date: 20 February 2025\nInvoice date: 3 October 2025")?.observed).toBe(
        "3 October 2025",
      );
    });

    it("reads both dates on one line, each with its own label", () => {
      const both = issue("Invoice date: 3 June 2026    Due date: 3 July 2026");
      expect(both).toMatchObject({ status: "present", observed: "3 June 2026" });
    });

    it("does not pick the first of several unlabelled dates", () => {
      const r = issue("INVOICE\nPrinted 28/09/2026\n3 March 2025\n5 April 2025");
      // "Printed" is set aside; two dates remain and nothing says which is the issue date.
      expect(r?.status).toBe("unclear");
      expect(r?.observed).toContain("3 March 2025");
      expect(r?.observed).toContain("5 April 2025");
    });

    it("does not answer 'the date the product stopped being sold' with any date on the page", () => {
      const r = status(
        check("Invoice date: 3 June 2026", "PRODUCT_SAFETY", "disposal_or_recall_proof", {}),
        /date the product stopped/,
      );
      expect(r?.status).toBe("not_assessed");
      const labelled = status(
        check("Sales stopped on 12 August 2026", "PRODUCT_SAFETY", "disposal_or_recall_proof", {}),
        /date the product stopped/,
      );
      expect(labelled).toMatchObject({ status: "present", observed: "12 August 2026" });
    });
  });

  it("does not call a supplier phone absent because the block is longer than six lines", () => {
    const text = supplierInvoice([
      "Harbor Goods Wholesale Ltd",
      "Attn: Sales Department",
      "88 Dockside Road",
      "Building C, Dock 4",
      "Newark, NJ 07105",
      "United States",
      "Phone: +1 (201) 555-0148",
    ]);
    expect(read(text, /supplier phone/)).toMatchObject({ status: "present" });
    // A block that runs past what we read is never called absent.
    const long = supplierInvoice([
      "Harbor Goods Wholesale Ltd",
      ...Array.from({ length: 20 }, (_, i) => `Building ${i} Annex`),
    ]);
    expect(read(long, /supplier phone/)?.status).toBe("unclear");
  });

  it("finds the complaint ID even when an earlier line carries another reference", () => {
    const text = [
      "Northfield Outdoor Gear LLC",
      "Our reference: 90210123456",
      "We retract our complaint.",
      "Complaint ID 11223344556",
    ].join("\n");
    const r = status(
      {
        ...check(text, "INTELLECTUAL_PROPERTY", "rights_owner_retraction", {}),
      } as DocumentCheckResult,
      /complaint ID/i,
    );
    const withNotice = buildDocumentCheck(
      "INTELLECTUAL_PROPERTY",
      "rights_owner_retraction",
      readFieldsFromText(
        text,
        requirementForCheck("INTELLECTUAL_PROPERTY", "rights_owner_retraction")!.fields,
        {},
        "pdf_text",
      ),
      { today: TODAY, asins: [], referenceIds: ["11223344556"] },
      { quotesAreVerbatim: true },
    );
    expect(status(withNotice, /complaint ID/i)?.status).toBe("present");
    expect(r).toBeDefined();
    // A phone number is not an ID.
    const phone = status(
      check(
        "Case handler tel 8025550131\nComplaint 11223344556 withdrawn",
        "INTELLECTUAL_PROPERTY",
        "rights_owner_retraction",
        {},
      ),
      /complaint ID/i,
    );
    expect(phone?.observed ?? "").not.toContain("8025550131");
    expect(phone?.observed).toBe("11223344556");
  });

  it("does not separate a supplier and a buyer drawn side by side", () => {
    const merged = [
      "FROM BILL TO",
      "Harbor Goods Wholesale Ltd Brightwater Home Goods LLC",
      "88 Dockside Road 214 Juniper Lane, Suite 5",
      "Newark, NJ 07105 Austin, TX 78701",
    ].join("\n");
    const r = check(merged, "INAUTHENTIC", "supplier_invoice", {
      business: {
        name: "Brightwater Home Goods LLC",
        address: "214 Juniper Lane, Suite 5, Austin, TX 78701",
      },
      suppliers: ["Harbor Goods Wholesale Ltd"],
    });
    for (const re of [
      /^supplier business name$/,
      /supplier physical address/,
      /supplier phone/,
      /as the buyer|seller account/i,
    ]) {
      const f = status(r, re);
      expect(f?.status, String(re)).toBe("not_assessed");
      expect(f?.observed ?? "", String(re)).not.toContain("Harbor Goods Wholesale Ltd Brightwater");
    }
  });

  it("treats two labels in a row, with no block between them, as the same side-by-side layout", () => {
    // The right column sat a few points lower, so the header split into two lines.
    const split = [
      "FROM",
      "BILL TO",
      "Harbor Goods Wholesale Ltd Brightwater Home Goods LLC",
      "88 Dockside Road 214 Juniper Lane, Suite 5",
    ].join("\n");
    const r = check(split, "INAUTHENTIC", "supplier_invoice", {
      business: {
        name: "Brightwater Home Goods LLC",
        address: "214 Juniper Lane, Suite 5, Austin, TX 78701",
      },
    });
    expect(status(r, /as the buyer|seller account/i)?.status).toBe("not_assessed");
    expect(status(r, /^supplier business name$/)?.status).toBe("not_assessed");
  });

  it("finds an order log by its title, and a rights owner by 'owner of ... trademark'", async () => {
    const log = status(
      check("Order and complaint log\n112-4830291-\n5520134", "POLICY", "metric_export", {}),
      /order or sales report|export of the individual orders/,
    );
    expect(log?.status).toBe("present");
    const owner = status(
      check(
        "Northfield Outdoor Gear LLC, owner of United States trademark registration no. 5123456",
        "INTELLECTUAL_PROPERTY",
        "brand_authorization",
        {},
      ),
      /rights-owner name/,
    );
    expect(owner?.status).toBe("present");
  });

  it("quotes every quantity row, including one that starts the line", () => {
    const text = [
      "FROM",
      "Crestline Trade Supply Co.",
      "Item Description Qty Unit price Amount",
      "J-104 Bottle",
      "ASIN B0EXAMPLE1",
      "40 $6.20 $248.00",
      "J-105 Replacement lid for J-104, new 40 $0.90 $36.00",
    ].join("\n");
    const q = status(check(text, "INAUTHENTIC", "supplier_invoice", {}), /invoiced quantity/);
    expect(q?.observed).toContain("40 $6.20 $248.00");
    expect(q?.observed).toContain("$36.00");
  });

  it("does not freeze on a very long line", () => {
    for (const filler of ["a.", "1 ", "1.", "-", "a "]) {
      const started = performance.now();
      const r = check(`FROM\n${filler.repeat(500_000)}`, "INAUTHENTIC", "supplier_invoice", {});
      expect(performance.now() - started, `filler ${JSON.stringify(filler)}`).toBeLessThan(3000);
      expect(r.findings.length).toBeGreaterThan(0);
    }
  });
});

describe("the AI reading first, the device when it cannot run", () => {
  const input = {
    caseId: "case-1",
    kind: "INAUTHENTIC" as const,
    evidenceKind: "supplier_invoice" as const,
    bytes: new Uint8Array([1, 2, 3]),
    mimeType: "application/pdf",
    caseData: { asins: ["B07KJ3M8QA"], referenceIds: [] },
  };
  const deviceText = async () => ({
    text: "FROM\nCrestline Trade Supply Co.\nDate: 3 June 2026\nB07KJ3M8QA",
    source: "pdf_text" as const,
  });

  it("reads a guest's document on the device, without uploading it", async () => {
    let sent = false;
    const fetchBefore = globalThis.fetch;
    globalThis.fetch = (async () => {
      sent = true;
      throw new Error("must not be called");
    }) as typeof fetch;
    try {
      const outcome = await runDocumentCheck({ ...input, signedIn: false }, deviceText);
      expect(sent).toBe(false);
      expect(outcome.kind).toBe("fields");
      if (outcome.kind === "fields") {
        expect(outcome.result.readOn).toBe("device");
        expect(outcome.result.aiNote).toMatch(/needs you to be signed in/);
        // Nothing was posted, so the result may say so; and it records where the words came from.
        expect(outcome.result.fileSent).toBe(false);
        expect(outcome.result.textSource).toBe("pdf_text");
      }
    } finally {
      globalThis.fetch = fetchBefore;
    }
  });

  it("falls back to the device when the AI reading is switched off, and says why", async () => {
    const fetchBefore = globalThis.fetch;
    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: false, message: "Document reading is not switched on." }),
    })) as unknown as typeof fetch;
    try {
      const outcome = await runDocumentCheck(input, deviceText);
      expect(outcome.kind).toBe("fields");
      if (outcome.kind === "fields") {
        expect(outcome.result.readOn).toBe("device");
        expect(outcome.result.aiNote).toBe("Document reading is not switched on.");
        // The request went first, so this result must never say "never uploaded" (30 Sep review).
        expect(outcome.result.fileSent).toBe(true);
      }
    } finally {
      globalThis.fetch = fetchBefore;
    }
  });

  it("records that the file was sent when the AI refuses it, whatever the reason", async () => {
    const fetchBefore = globalThis.fetch;
    const bodies: string[] = [];
    for (const [status, body] of [
      [402, { error: "An Appeal Pass is required to check documents." }],
      [401, {}],
      [429, { error: "Too many requests." }],
    ] as const) {
      globalThis.fetch = (async (_url: string, init?: RequestInit) => {
        bodies.push(String(init?.body ?? ""));
        return { ok: false, status, json: async () => body };
      }) as unknown as typeof fetch;
      try {
        const outcome = await runDocumentCheck(input, deviceText);
        expect(outcome.kind).toBe("fields");
        if (outcome.kind === "fields") expect(outcome.result.fileSent, String(status)).toBe(true);
      } finally {
        globalThis.fetch = fetchBefore;
      }
    }
    // The file really was in each request: that is what "sent" means.
    expect(bodies.every((b) => b.includes(`"data":"AQID"`))).toBe(true);
  });

  it("records that the file was sent even when the request itself fails", async () => {
    const fetchBefore = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    try {
      const outcome = await runDocumentCheck(input, deviceText);
      expect(outcome.kind === "fields" && outcome.result.fileSent).toBe(true);
    } finally {
      globalThis.fetch = fetchBefore;
    }
  });

  it("does not send a file the AI reading cannot take, and says nothing was sent", async () => {
    const fetchBefore = globalThis.fetch;
    let sent = false;
    globalThis.fetch = (async () => {
      sent = true;
      throw new Error("must not be called");
    }) as unknown as typeof fetch;
    try {
      // Over the AI reading's 3 MB, but well within what the device reads.
      const big = { ...input, bytes: new Uint8Array(3_500_000) };
      const outcome = await runDocumentCheck(big, deviceText);
      expect(sent).toBe(false);
      expect(outcome.kind).toBe("fields");
      if (outcome.kind === "fields") {
        expect(outcome.result.fileSent).toBe(false);
        expect(outcome.result.aiNote).toMatch(/up to 3 MB/);
      }
    } finally {
      globalThis.fetch = fetchBefore;
    }
  });

  it("keeps the AI's reason when the device cannot read the file either, and says it tried", async () => {
    const outcome = await runDocumentCheck({ ...input, signedIn: false }, async () => null);
    expect(outcome).toMatchObject({ kind: "unavailable" });
    // A guest whose scan has no legible text must not be left thinking that signing in would fix it.
    if (outcome.kind === "unavailable") {
      expect(outcome.message).toMatch(/tried to read it on this device and could not make out/);
      expect(outcome.message).toMatch(/needs you to be signed in/);
    }
  });

  it("does not claim the device was tried when it never was", async () => {
    let read = false;
    const outcome = await runDocumentCheck(
      { ...input, signedIn: false, mimeType: "text/plain" },
      async () => {
        read = true;
        return null;
      },
    );
    expect(read).toBe(false);
    if (outcome.kind === "unavailable") expect(outcome.message).not.toMatch(/tried to read it/);
  });

  it("keeps a line the document itself words as a verdict, since it is the document speaking", async () => {
    const outcome = await runDocumentCheck(
      { ...input, kind: "PRODUCT_SAFETY", evidenceKind: "compliance_report", signedIn: false },
      async () => ({
        text: "CERTIFICATE OF COMPLIANCE - valid until 2028\nTested to UL 62368-1\nIntertek Testing Laboratory",
        source: "pdf_text" as const,
      }),
    );
    expect(outcome.kind).toBe("fields");
    if (outcome.kind === "fields") {
      // Used to come back "Could not read ... nothing was quoted" because "valid" is a banned word.
      const f = outcome.result.findings.find((x) =>
        /test report or compliance certificate/i.test(x.field),
      );
      expect(f).toMatchObject({ status: "present" });
      expect(f?.observed).toMatch(/valid until 2028/);
    }
  });
});
