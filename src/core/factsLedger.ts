/**
 * AA-41/AA-42 carry-forward (AM-26): the facts ledger.
 *
 * By this point the product knows things about a case from four different places — what the seller
 * typed, what the decoder pulled out of the notice, what a document check read off an invoice, and
 * what Amazon said in a reply. Until now those lived in four separate shapes and were never
 * compared. So the product could hold "supplier: Acme Trading Ltd" from the seller's own answer and
 * "supplier business name: Acme Ltd" from the invoice it had just read, and say nothing.
 *
 * That silence is the expensive kind. An appeal whose narrative contradicts its own exhibit is one
 * of the cheapest ways to fail, and it is invisible to the seller precisely because they wrote one
 * half of it months before they uploaded the other.
 *
 * Three rules govern this module:
 *
 * 1. **Every fact carries where it came from.** A fact with no source cannot be entered. This is
 *    what makes the ledger a record rather than an opinion, and it is what lets the UI show the
 *    seller the invoice line or the sentence a fact rests on.
 * 2. **A contradiction is reported, never resolved.** The product does not decide which of two
 *    sources is right — it has no standing to. It shows both, says they disagree, and leaves the
 *    judgement with the seller, who is the only one who knows which document is current.
 * 3. **Nothing is inferred.** A value is recorded as it was read. No normalisation beyond
 *    whitespace, no "did you mean", no merging of near-matches into one.
 */

import type { ExtractedEntity } from "./entities";
import type { DocumentCheckResult } from "./documentCheck";
import type { CaseFacts } from "./workspace";

export type FactSource =
  /** The seller typed this into their case. */
  | { kind: "seller"; field: string }
  /**
   * Read out of the Amazon notice, with the span it came from when there is one. A value the
   * notice supplied to a document comparison has no single span, and one is not invented for it.
   */
  | { kind: "notice"; quote: string; start?: number; end?: number }
  /** Read off a document the seller uploaded, during a document check. */
  | { kind: "document"; filename: string; field: string }
  /** Stated in a reply from Amazon. */
  | { kind: "amazon_reply"; at: string };

export type FactStatus =
  /** One source, no disagreement. */
  | "recorded"
  /** Two or more sources agree. The strongest thing a fact can be here. */
  | "corroborated"
  /** Sources disagree. Shown to the seller; never resolved by the product. */
  | "contradicted";

export interface FactEntry {
  /** What this is a fact about, e.g. "supplier business name". Used to group and compare. */
  label: string;
  /** The value exactly as the source gave it. */
  value: string;
  source: FactSource;
  /**
   * True when the label names one of possibly several things — an ASIN, an order, a date —
   * rather than a single answer for the whole case. Added 23 Sep 2026: grouped by label alone, a
   * notice naming two ASINs became one fact with two values and was reported as a contradiction.
   * A list is not a disagreement.
   */
  multiValued?: boolean;
}

export interface Fact {
  label: string;
  status: FactStatus;
  /** Every recorded value for this label, with its source. More than one means disagreement. */
  entries: FactEntry[];
  /**
   * The single agreed value, present only when every source says the same thing. Absent on a
   * contradiction **by design** — offering a "best guess" would undo the whole point.
   */
  value?: string;
}

export interface FactsLedger {
  facts: Fact[];
  /** Facts whose sources disagree. The seller has to resolve these; the product cannot. */
  contradictions: Fact[];
}

/** Whitespace and case only. Deliberately not fuzzy: "Acme Ltd" and "Acme Limited" are different
 * answers to the same question, and pretending otherwise is exactly the error being looked for. */
function comparable(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function labelKey(label: string): string {
  return label.trim().toLowerCase();
}

/**
 * Groups entries by what they are about, and marks the ones whose sources disagree.
 *
 * Entries with an empty value are dropped rather than recorded as a blank fact — an absent value is
 * the absence of a fact, not a fact that something is empty.
 */
export function buildFactsLedger(
  entries: readonly FactEntry[],
  /** Already-established disagreements, from `disagreementsFromDocumentCheck`. */
  disagreements: readonly Fact[] = [],
): FactsLedger {
  const byLabel = new Map<string, FactEntry[]>();
  for (const entry of entries) {
    if (!entry.value.trim() || !entry.label.trim()) continue;
    const key = labelKey(entry.label);
    const list = byLabel.get(key);
    if (list) list.push(entry);
    else byLabel.set(key, [entry]);
  }

  const facts: Fact[] = [];
  for (const list of byLabel.values()) {
    const distinct = new Set(list.map((e) => comparable(e.value)));
    const label = list[0]!.label;

    /*
      A label that names one of several things collects its values instead of comparing them.
      Different values here are different items — two ASINs, a deactivation date and a deadline —
      so there is nothing for them to disagree about. Each value is listed once, and the fact is
      corroborated when some value was reported by two different kinds of source, which is the
      same test a single-valued fact uses.
    */
    if (list.some((e) => e.multiValued)) {
      const seen = new Set<string>();
      const unique = list.filter((e) => {
        const key = `${comparable(e.value)}|${e.source.kind}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const kindsPerValue = new Map<string, Set<string>>();
      for (const e of unique) {
        const v = comparable(e.value);
        if (!kindsPerValue.has(v)) kindsPerValue.set(v, new Set());
        kindsPerValue.get(v)!.add(e.source.kind);
      }
      const corroborated = [...kindsPerValue.values()].some((kinds) => kinds.size > 1);
      facts.push({
        label,
        status: corroborated ? "corroborated" : "recorded",
        entries: unique,
        // One value is an agreed value; several are a list, and the card shows them as one.
        ...(distinct.size === 1 ? { value: unique[0]!.value.trim() } : {}),
      });
      continue;
    }

    if (distinct.size > 1) {
      facts.push({ label, status: "contradicted", entries: list });
      continue;
    }

    // One agreed value. Two independent sources saying it is meaningfully stronger than one, and
    // the seller's own answer repeated twice is not two sources — so distinct source kinds count.
    const sourceKinds = new Set(list.map((e) => e.source.kind));
    facts.push({
      label,
      status: sourceKinds.size > 1 ? "corroborated" : "recorded",
      entries: list,
      value: list[0]!.value.trim(),
    });
  }

  facts.push(...disagreements);
  return { facts, contradictions: facts.filter((f) => f.status === "contradicted") };
}

/** Entries from the decoder's extracted entities. Requested records are skipped — they are things
 * Amazon asked for, not facts about the case. */
export function entriesFromEntities(entities: readonly ExtractedEntity[]): FactEntry[] {
  return entities
    .filter((e) => e.kind !== "requested_record")
    .map((e) => {
      const known = ENTITY_FACT_LABELS[e.kind];
      return {
        label: known?.label ?? e.kind,
        value: e.value,
        source: { kind: "notice" as const, quote: e.quote, start: e.start, end: e.end },
        ...(known?.multiValued ? { multiValued: true } : {}),
      };
    });
}

/**
 * Cardinality lives beside the labels it describes, so a label cannot be added without deciding
 * whether it names one thing or a list of things. Only the case ID names one thing: a notice can
 * list several ASINs, several orders, a deactivation date alongside a deadline, and an amount held
 * alongside an amount disbursed, and none of those is a disagreement.
 */
const ENTITY_FACT_LABELS: Record<string, { label: string; multiValued: boolean }> = {
  asin: { label: "ASIN", multiValued: true },
  order_id: { label: "Order ID", multiValued: true },
  case_id: { label: "Case ID", multiValued: false },
  date: { label: "Date in the notice", multiValued: true },
  amount: { label: "Amount in the notice", multiValued: true },
};

/**
 * Entries from a document check. Only `present` findings with something quoted become facts: a
 * field we could not read is not a fact, and a missing one certainly is not.
 *
 * Every document entry is many-valued (24 Sep 2026). A case holds several documents, and two
 * invoices with different dates, quantities or suppliers are two invoices, not a contradiction —
 * grouped as single answers, they were reported as one, which is the false alarm the ASIN fix of
 * 23 Sep removed for the notice and left in place here. A document that disagrees with the *case*
 * is a real disagreement, and `disagreementsFromDocumentCheck` reports it.
 */
export function entriesFromDocumentCheck(
  filename: string,
  check: DocumentCheckResult,
): FactEntry[] {
  return check.findings
    .filter((f) => f.status === "present" && f.observed && f.observed.trim().length > 0)
    .map((f) => ({
      label: f.field,
      value: f.observed!.trim(),
      source: { kind: "document" as const, filename, field: f.field },
      multiValued: true,
    }));
}

/**
 * Where a checked document disagrees with the case itself — an ASIN or complaint ID the notice
 * named, or a business detail the seller stated — as a ledger disagreement with both values and
 * both sources. Added 24 Sep 2026 (ChatGPT audit item G): the ledger was meant to catch a narrative
 * that contradicts its own exhibit, and could not, because the two halves were filed under
 * different names and never compared. The comparison is made by the document check, against a
 * named case value; this only puts it where every other disagreement is listed.
 */
export function disagreementsFromDocumentCheck(
  filename: string,
  check: DocumentCheckResult,
): Fact[] {
  return check.findings
    .filter((f) => f.status === "conflicting" && f.observed?.trim() && f.comparedValue)
    .map((f) => ({
      label: f.field,
      status: "contradicted" as const,
      entries: [
        {
          label: f.field,
          value: f.observed!.trim(),
          source: { kind: "document" as const, filename, field: f.field },
        },
        {
          label: f.field,
          value: f.comparedValue!.value,
          source:
            f.comparedValue!.source === "notice"
              ? { kind: "notice" as const, quote: f.comparedValue!.value }
              : { kind: "seller" as const, field: "Your business details" },
        },
      ],
    }));
}

/**
 * The business details the seller stated once for the case (`Workspace.caseFacts`). The name and
 * address are single answers — a seller account has one of each — so two different values for
 * either are a real disagreement. Suppliers are a list.
 */
export function entriesFromCaseFacts(facts: CaseFacts | undefined): FactEntry[] {
  if (!facts) return [];
  const seller = (field: string) => ({ kind: "seller" as const, field });
  return [
    ...(facts.businessName?.trim()
      ? [
          {
            label: "Your registered business name",
            value: facts.businessName.trim(),
            source: seller("Business name"),
          },
        ]
      : []),
    ...(facts.businessAddress?.trim()
      ? [
          {
            label: "Your registered business address",
            value: facts.businessAddress.trim(),
            source: seller("Business address"),
          },
        ]
      : []),
    ...(facts.suppliers ?? [])
      .map((s) => s.trim())
      .filter(Boolean)
      .map((value) => ({
        label: "Your suppliers",
        value,
        source: seller("Suppliers"),
        multiValued: true,
      })),
  ];
}

/** Entries the seller typed. The caller supplies the label/value pairs it already has. */
export function entriesFromSeller(
  fields: Readonly<Record<string, string | undefined>>,
): FactEntry[] {
  return Object.entries(fields)
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .map(([field, value]) => ({
      label: field,
      value: value!.trim(),
      source: { kind: "seller" as const, field },
    }));
}

export function describeSource(source: FactSource): string {
  switch (source.kind) {
    case "seller":
      return "You told us this";
    case "notice":
      return "Read from your Amazon notice";
    case "document":
      return `Read from ${source.filename}`;
    case "amazon_reply":
      return "Stated in Amazon's reply";
  }
}

/**
 * One plain sentence per contradiction, safe to show verbatim. It names both values and both
 * sources and stops — it does not suggest which is correct.
 */
export function describeContradiction(fact: Fact): string {
  const parts = fact.entries.map((e) => `"${e.value}" (${describeSource(e.source).toLowerCase()})`);
  return `Your case records more than one answer for ${fact.label}: ${parts.join(
    ", and ",
  )}. Amazon will see both if you send them. Check which is correct before you do.`;
}

export const FACT_STATUS_LABELS: Record<FactStatus, string> = {
  recorded: "Recorded",
  corroborated: "Two sources agree",
  contradicted: "Sources disagree",
};
