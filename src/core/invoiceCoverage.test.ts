import { describe, expect, it } from "vitest";
import { invoiceCoverage, parseInvoicedUnits } from "./invoiceCoverage";
import type { FieldFinding, SavedDocumentCheck } from "./documentCheck";

const QTY =
  "invoiced quantity consistent with units sold of each cited ASIN in the 365 days before the notice";

function check(
  recordId: string,
  opts: {
    quantity?: string;
    quantityStatus?: FieldFinding["status"];
    dateStatus?: FieldFinding["status"];
    hash?: string;
    kind?: "supplier_invoice" | "brand_authorization";
  } = {},
): SavedDocumentCheck {
  const findings: FieldFinding[] = [
    {
      field: "issue date (within 365 days)",
      status: opts.dateStatus ?? "present",
      observed: "3 Mar 2026",
      note: "",
    },
  ];
  if (opts.quantity !== undefined)
    findings.push({
      field: QTY,
      status: opts.quantityStatus ?? "not_assessed",
      observed: opts.quantity,
      note: "",
    });
  return {
    recordId,
    ...(opts.hash ? { contentHash: opts.hash } : {}),
    at: "2026-10-10T08:00:00.000Z",
    contextKey: "k",
    outcome: {
      kind: "fields",
      result: {
        evidenceKind: opts.kind ?? "supplier_invoice",
        findings,
        triggeredDisqualifiers: [],
        allRequiredFieldsPresent: true,
      },
    },
  };
}

describe("parseInvoicedUnits", () => {
  it("reads a labelled quantity, in either word order", () => {
    expect(parseInvoicedUnits("Qty: 120")).toBe(120);
    expect(parseInvoicedUnits("Quantity 40")).toBe(40);
    expect(parseInvoicedUnits("1,200 units")).toBe(1200);
    expect(parseInvoicedUnits("60 pcs")).toBe(60);
  });

  it("adds the rows of a table as the device reader quotes them", () => {
    expect(parseInvoicedUnits("Widget 40 $6.20 $248.00; Gadget 20 $5.00 $100.00")).toBe(60);
  });

  it("gives up on the whole quote when any part is not a quantity, instead of counting part of it", () => {
    expect(parseInvoicedUnits("Qty: 40; delivered on time")).toBeNull();
    expect(parseInvoicedUnits("several boxes")).toBeNull();
    expect(parseInvoicedUnits("")).toBeNull();
  });

  it("refuses zero, absurd and fractional quantities", () => {
    expect(parseInvoicedUnits("Qty: 0")).toBeNull();
    expect(parseInvoicedUnits("Qty: 99,999,999")).toBeNull();
  });
});

describe("invoiceCoverage", () => {
  it("shows nothing until the seller states what they sold", () => {
    expect(invoiceCoverage([check("a", { quantity: "Qty: 100" })], undefined)).toBeNull();
    expect(invoiceCoverage([check("a", { quantity: "Qty: 100" })], 0)).toBeNull();
  });

  it("adds every counted invoice and reports a shortfall as a plain number", () => {
    const r = invoiceCoverage(
      [check("a", { quantity: "Qty: 100" }), check("b", { quantity: "Qty: 150" })],
      400,
    )!;
    expect(r).toMatchObject({ invoicedUnits: 250, counted: 2, status: "short", shortBy: 150 });
  });

  it("says the numbers add up when they do, with nothing about which products", () => {
    const r = invoiceCoverage([check("a", { quantity: "Qty: 300" })], 300)!;
    expect(r).toMatchObject({ status: "enough", shortBy: 0, invoicedUnits: 300 });
  });

  it("counts one file once, however many records it is linked to", () => {
    const r = invoiceCoverage(
      [
        check("a", { quantity: "Qty: 100", hash: "h1" }),
        check("b", { quantity: "Qty: 100", hash: "h1" }),
      ],
      150,
    )!;
    expect(r).toMatchObject({ invoicedUnits: 100, counted: 1, status: "short", shortBy: 50 });
  });

  it("leaves out an invoice the check found outside the 365 days, and says so", () => {
    const r = invoiceCoverage(
      [
        check("a", { quantity: "Qty: 100" }),
        check("b", { quantity: "Qty: 500", dateStatus: "conflicting" }),
      ],
      300,
    )!;
    expect(r).toMatchObject({ invoicedUnits: 100, counted: 1, outsideWindow: 1, status: "short" });
  });

  it("counts an invoice whose quantity cannot be read as unreadable, never as zero units sold short", () => {
    const r = invoiceCoverage(
      [check("a", { quantity: "Qty: 100" }), check("b", { quantity: "a few cartons" }), check("c")],
      50,
    )!;
    expect(r).toMatchObject({ counted: 1, unreadable: 2, status: "enough" });
  });

  it("is 'none' when no invoice has a readable quantity", () => {
    const r = invoiceCoverage([check("a")], 50)!;
    expect(r).toMatchObject({ status: "none", counted: 0, shortBy: 0 });
    expect(invoiceCoverage(undefined, 50)).toMatchObject({ status: "none" });
  });

  it("ignores documents that are not supplier invoices and image-only checks", () => {
    const image: SavedDocumentCheck = {
      recordId: "i",
      at: "2026-10-10T08:00:00.000Z",
      contextKey: "k",
      outcome: { kind: "image", report: { ok: true } as never },
    };
    const r = invoiceCoverage(
      [check("a", { quantity: "Qty: 90", kind: "brand_authorization" }), image],
      10,
    )!;
    expect(r.status).toBe("none");
  });

  it("does not count a quantity the check found missing or unclear", () => {
    const r = invoiceCoverage(
      [check("a", { quantity: "Qty: 90", quantityStatus: "unclear" })],
      10,
    )!;
    expect(r).toMatchObject({ status: "none", unreadable: 1 });
  });
});

describe("coverageSentence", () => {
  it("states the arithmetic and what is not counted, and never predicts Amazon's decision", async () => {
    const { coverageSentence } = await import("./invoiceCoverage");
    const short = coverageSentence(
      invoiceCoverage(
        [
          check("a", { quantity: "Qty: 100" }),
          check("b", { quantity: "a few" }),
          check("c", { quantity: "Qty: 9", dateStatus: "conflicting" }),
        ],
        400,
      )!,
    );
    expect(short).toContain("show 100 units in total");
    expect(short).toContain("You sold 400");
    expect(short).toContain("fall short by 300");
    expect(short).toContain("1 checked invoice had no quantity we could read");
    expect(short).toContain("1 invoice is dated outside the 365 days");
    const enough = coverageSentence(invoiceCoverage([check("a", { quantity: "Qty: 400" })], 400)!);
    expect(enough).toContain("The numbers add up");
    for (const text of [short, enough])
      expect(text).not.toMatch(/\b(?:will be accepted|approved|guarantee|likely|chance)\b/i);
  });
});
