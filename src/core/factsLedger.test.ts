import { describe, it, expect } from "vitest";
import {
  buildFactsLedger,
  entriesFromEntities,
  entriesFromDocumentCheck,
  entriesFromSeller,
  describeContradiction,
  describeSource,
  FACT_STATUS_LABELS,
  type FactEntry,
} from "./factsLedger";
import { buildDocumentCheck } from "./documentCheck";
import { extractEntities } from "./entities";
import { requirementsFor } from "./evidenceModel";

const sellerEntry = (label: string, value: string): FactEntry => ({
  label,
  value,
  source: { kind: "seller", field: label },
});

const docEntry = (label: string, value: string, filename = "invoice.pdf"): FactEntry => ({
  label,
  value,
  source: { kind: "document", filename, field: label },
});

describe("buildFactsLedger", () => {
  it("records a single-source fact", () => {
    const { facts, contradictions } = buildFactsLedger([
      sellerEntry("Supplier", "Acme Trading Ltd"),
    ]);
    expect(facts).toHaveLength(1);
    expect(facts[0]!.status).toBe("recorded");
    expect(facts[0]!.value).toBe("Acme Trading Ltd");
    expect(contradictions).toHaveLength(0);
  });

  it("marks a fact as corroborated when two different kinds of source agree", () => {
    const { facts } = buildFactsLedger([
      sellerEntry("Supplier", "Acme Trading Ltd"),
      docEntry("Supplier", "Acme Trading Ltd"),
    ]);
    expect(facts[0]!.status).toBe("corroborated");
    expect(facts[0]!.entries).toHaveLength(2);
  });

  it("does not treat the same source repeating itself as corroboration", () => {
    const { facts } = buildFactsLedger([
      sellerEntry("Supplier", "Acme Trading Ltd"),
      sellerEntry("Supplier", "Acme Trading Ltd"),
    ]);
    expect(facts[0]!.status).toBe("recorded");
  });

  /** The case this module exists for: the seller's narrative disagreeing with their own exhibit. */
  it("flags a contradiction between what the seller said and what their invoice says", () => {
    const { facts, contradictions } = buildFactsLedger([
      sellerEntry("Supplier", "Acme Trading Ltd"),
      docEntry("Supplier", "Acme Ltd"),
    ]);
    expect(facts[0]!.status).toBe("contradicted");
    expect(contradictions).toHaveLength(1);
  });

  /** Offering a "best guess" value on a contradiction would undo the entire point. */
  it("refuses to pick a winner between contradicting sources", () => {
    const { facts } = buildFactsLedger([
      sellerEntry("Supplier", "Acme Trading Ltd"),
      docEntry("Supplier", "Acme Ltd"),
    ]);
    expect(facts[0]!.value).toBeUndefined();
    expect(facts[0]!.entries).toHaveLength(2);
  });

  it("ignores case and spacing, which are not disagreements", () => {
    const { facts } = buildFactsLedger([
      sellerEntry("Supplier", "Acme Trading Ltd"),
      docEntry("Supplier", "  acme   trading ltd "),
    ]);
    expect(facts[0]!.status).toBe("corroborated");
  });

  /** Deliberately not fuzzy — "Ltd" and "Limited" really are different answers on a legal document,
   * and silently merging them would hide the exact class of error being looked for. */
  it("treats a genuinely different spelling as a contradiction, not a near-match", () => {
    const { facts } = buildFactsLedger([
      sellerEntry("Supplier", "Acme Limited"),
      docEntry("Supplier", "Acme Ltd"),
    ]);
    expect(facts[0]!.status).toBe("contradicted");
  });

  it("groups by label regardless of its casing", () => {
    const { facts } = buildFactsLedger([
      sellerEntry("Supplier", "Acme Ltd"),
      docEntry("SUPPLIER", "Acme Ltd"),
    ]);
    expect(facts).toHaveLength(1);
  });

  it("drops blank values rather than recording an empty fact", () => {
    const { facts } = buildFactsLedger([sellerEntry("Supplier", "   "), sellerEntry("", "Acme")]);
    expect(facts).toHaveLength(0);
  });

  it("keeps unrelated facts separate", () => {
    const { facts } = buildFactsLedger([
      sellerEntry("Supplier", "Acme Ltd"),
      sellerEntry("ASIN", "B08N5WRWNW"),
    ]);
    expect(facts).toHaveLength(2);
    expect(facts.every((f) => f.status === "recorded")).toBe(true);
  });
});

describe("source adapters", () => {
  it("turns decoded notice entities into sourced facts, and skips requested records", () => {
    const raw = "Case ID: 8823471905 concerns B08N5WRWNW. Please provide your supplier invoice.";
    const entries = entriesFromEntities(extractEntities(raw));
    const labels = entries.map((e) => e.label);
    expect(labels).toContain("Case ID");
    expect(labels).toContain("ASIN");
    // "Supplier invoice" is something Amazon asked for, not a fact about the case.
    expect(labels).not.toContain("Supplier invoice");
    expect(entries.every((e) => e.source.kind === "notice")).toBe(true);
  });

  it("carries the notice span through, so a fact can be traced to its sentence", () => {
    const raw = "Case ID: 8823471905 is open.";
    const entry = entriesFromEntities(extractEntities(raw))[0]!;
    expect(entry.source.kind).toBe("notice");
    if (entry.source.kind === "notice") {
      expect(raw.slice(entry.source.start, entry.source.end)).toBe(entry.value);
    }
  });

  it("takes only readable, quoted findings from a document check", () => {
    const fields = requirementsFor("INAUTHENTIC_DOCUMENTS").find(
      (r) => r.kind === "supplier_invoice",
    )!.fields;
    const check = buildDocumentCheck("INAUTHENTIC_DOCUMENTS", "supplier_invoice", [
      { field: fields[0]!, status: "present", observed: "Acme Trading Ltd", note: "On page 1." },
      { field: fields[1]!, status: "present", note: "Present but nothing quoted." },
      { field: fields[2]!, status: "unclear", observed: "???", note: "Cut off." },
    ]);
    const entries = entriesFromDocumentCheck("invoice.pdf", check);
    expect(entries).toHaveLength(1);
    expect(entries[0]!.value).toBe("Acme Trading Ltd");
  });

  it("takes the seller's own answers and skips the empty ones", () => {
    const entries = entriesFromSeller({ Supplier: "Acme Ltd", Notes: "   ", Missing: undefined });
    expect(entries).toHaveLength(1);
    expect(entries[0]!.source).toEqual({ kind: "seller", field: "Supplier" });
  });
});

describe("wording", () => {
  it("names both values and both sources without suggesting which is right", () => {
    const { contradictions } = buildFactsLedger([
      sellerEntry("Supplier", "Acme Trading Ltd"),
      docEntry("Supplier", "Acme Ltd"),
    ]);
    const sentence = describeContradiction(contradictions[0]!);
    expect(sentence).toContain("Acme Trading Ltd");
    expect(sentence).toContain("Acme Ltd");
    expect(sentence).toMatch(/you told us this/i);
    expect(sentence).toMatch(/read from invoice\.pdf/i);
    expect(sentence).toMatch(/Check which is correct/i);
    for (const banned of [/probably/i, /we think/i, /should be/i, /correct one is/i]) {
      expect(sentence).not.toMatch(banned);
    }
  });

  it("describes every source kind", () => {
    expect(describeSource({ kind: "seller", field: "x" })).toBeTruthy();
    expect(describeSource({ kind: "notice", quote: "q", start: 0, end: 1 })).toBeTruthy();
    expect(describeSource({ kind: "document", filename: "f.pdf", field: "x" })).toBeTruthy();
    expect(describeSource({ kind: "amazon_reply", at: "2026-09-01T00:00:00Z" })).toBeTruthy();
  });

  it("labels every status", () => {
    for (const key of Object.keys(FACT_STATUS_LABELS)) {
      expect(FACT_STATUS_LABELS[key as keyof typeof FACT_STATUS_LABELS]).toBeTruthy();
    }
  });
});

/**
 * G, 23 Sep 2026. Facts were grouped by label, and every ASIN the decoder found was labelled
 * "ASIN" — so a notice naming two products produced one fact with two values, marked
 * `contradicted`, and the seller was told "Your case records more than one answer for ASIN …
 * Check which is correct before you do." Amazon routinely lists every affected ASIN. The same
 * held for order IDs, dates (a notice carries both a deactivation date and a deadline) and amounts
 * (held and disbursed).
 *
 * A list is not a disagreement. The card whose whole purpose is being trustworthy was crying wolf
 * on most real notices, which is how a real contradiction gets ignored when one finally appears.
 */
describe("multi-valued facts", () => {
  const twoAsins =
    "Your listings for ASIN B08N5WRWNW and ASIN B07XJ8C8F5 have been removed for a policy violation.";

  it("does not call two ASINs in one notice a contradiction", () => {
    const ledger = buildFactsLedger(entriesFromEntities(extractEntities(twoAsins)));
    expect(ledger.contradictions).toEqual([]);
    const asin = ledger.facts.find((f) => f.label === "ASIN")!;
    expect(asin.status).not.toBe("contradicted");
    // Both are still shown — silence about the list would be its own kind of wrong.
    expect(asin.entries.map((e) => e.value).sort()).toEqual(["B07XJ8C8F5", "B08N5WRWNW"]);
  });

  it("does not call a deactivation date and a deadline a contradiction", () => {
    const ledger = buildFactsLedger(
      entriesFromEntities(
        extractEntities(
          "Your account was deactivated on 2026-09-01. Submit your appeal by 2026-10-01.",
        ),
      ),
    );
    expect(ledger.contradictions).toEqual([]);
  });

  it("lists each value once, however often the notice repeats it", () => {
    const ledger = buildFactsLedger(
      entriesFromEntities(
        extractEntities("ASIN B08N5WRWNW is affected. We removed ASIN B08N5WRWNW from sale."),
      ),
    );
    const asin = ledger.facts.find((f) => f.label === "ASIN")!;
    expect(asin.entries).toHaveLength(1);
  });

  /**
   * The rule must not have been deleted to make the tests above pass. A label that names one
   * thing for the whole case — the case ID — still contradicts when two sources disagree.
   */
  it("still flags two different values for a label that names one thing", () => {
    const entries: FactEntry[] = [
      { label: "Case ID", value: "1234567890", source: { kind: "seller", field: "case" } },
      {
        label: "Case ID",
        value: "9876543210",
        source: { kind: "notice", quote: "9876543210", start: 0, end: 10 },
      },
    ];
    const ledger = buildFactsLedger(entries);
    expect(ledger.contradictions.map((f) => f.label)).toEqual(["Case ID"]);
  });
});
