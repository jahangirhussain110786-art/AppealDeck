import { describe, expect, it } from "vitest";
import { invoiceSums } from "./invoiceSums";
import type { DocumentCheckResult, FieldFinding } from "./documentCheck";

const QTY =
  "invoiced quantity consistent with units sold of each cited ASIN in the 365 days before the notice";

function result(opts: { date?: string; quantity?: string; dateStatus?: FieldFinding["status"] }) {
  const findings: FieldFinding[] = [];
  if (opts.date !== undefined)
    findings.push({
      field: "issue date (within 365 days)",
      status: opts.dateStatus ?? "present",
      observed: opts.date,
      note: "",
    });
  if (opts.quantity !== undefined)
    findings.push({ field: QTY, status: "not_assessed", observed: opts.quantity, note: "" });
  return {
    evidenceKind: "supplier_invoice",
    findings,
    triggeredDisqualifiers: [],
    allRequiredFieldsPresent: true,
  } as DocumentCheckResult;
}

const TODAY = "2026-10-12";

describe("invoiceSums: the days (G-02)", () => {
  it("counts the days from the invoice to the notice and says which date it counted from", () => {
    const s = invoiceSums(result({ date: "3 Mar 2026" }), {
      noticeDate: "2026-10-09",
      today: TODAY,
    });
    expect(s.days).toMatchObject({ invoiceDay: "2026-03-03", anchor: "notice", days: 220 });
    expect(s.days!.sentence).toContain("your notice is dated");
    expect(s.days!.sentence).toContain("220 days against the 365");
    expect(s.days!.sentence).toContain("inside the window");
  });

  it("counts from today when no notice date was entered, and says so", () => {
    const s = invoiceSums(result({ date: "3 Mar 2026" }), { today: TODAY });
    expect(s.days).toMatchObject({ anchor: "today", days: 223 });
    expect(s.days!.sentence).toContain("no notice date was entered");
  });

  it("names how far outside the window an old invoice is", () => {
    const s = invoiceSums(result({ date: "1 Jan 2025" }), {
      noticeDate: "2026-10-09",
      today: TODAY,
    });
    expect(s.days!.days).toBe(646);
    expect(s.days!.sentence).toContain("281 days outside the window");
  });

  it("does not count a date that can be read two ways", () => {
    const s = invoiceSums(result({ date: "03/04/2026" }), {
      noticeDate: "2026-10-09",
      today: TODAY,
    });
    expect(s.days!.days).toBeNull();
    expect(s.days!.readings).toHaveLength(2);
    expect(s.days!.sentence).toContain("so the days are not counted");
  });

  it("says when the invoice is dated after the notice", () => {
    const s = invoiceSums(result({ date: "20 Oct 2026" }), {
      noticeDate: "2026-10-09",
      today: TODAY,
    });
    expect(s.days!.days).toBeLessThan(0);
    expect(s.days!.sentence).toContain("dated after that day");
  });

  it("has no days sum without an invoice date", () => {
    expect(invoiceSums(result({}), { today: TODAY }).days).toBeNull();
  });

  it("never says Amazon will accept anything", () => {
    const s = invoiceSums(result({ date: "3 Mar 2026", quantity: "Qty: 200" }), {
      noticeDate: "2026-10-09",
      today: TODAY,
      unitsSold: 131,
    });
    expect(`${s.days!.sentence} ${s.units!.sentence}`).not.toMatch(
      /\b(?:will|would) (?:be )?(?:accept|pass|approve)|guarantee|safe\b/i,
    );
  });
});

describe("invoiceSums: the units (G-02)", () => {
  it("adds up when the invoice covers what was sold", () => {
    const s = invoiceSums(result({ date: "3 Mar 2026", quantity: "Qty: 200" }), {
      today: TODAY,
      unitsSold: 131,
    });
    expect(s.units!.coverage).toMatchObject({
      status: "enough",
      invoicedUnits: 200,
      unitsSold: 131,
    });
    expect(s.units!.sentence).toContain("The numbers add up");
  });

  it("says how short it falls", () => {
    const s = invoiceSums(result({ date: "3 Mar 2026", quantity: "Qty: 36" }), {
      today: TODAY,
      unitsSold: 131,
    });
    expect(s.units!.coverage).toMatchObject({ status: "short", shortBy: 95 });
    expect(s.units!.sentence).toContain("fall short by 95");
  });

  it("shows no units sum until the seller states a sales figure", () => {
    expect(
      invoiceSums(result({ date: "3 Mar 2026", quantity: "Qty: 36" }), { today: TODAY }).units,
    ).toBeNull();
  });
});
