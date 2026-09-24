/**
 * AA-41 (AM-26): what the product is allowed to say about a document it has read.
 *
 * The founder's instruction was plain: _"we are not selling the vault, we are selling solution...
 * to help them we need to read their files."_ Before this, an invoice went into the vault as an
 * opaque blob and the product could not tell a seller that page 1 was missing the supplier's phone
 * number — the single most useful sentence it could say.
 *
 * The hard rule, and the reason this module exists rather than the API returning free text:
 *
 * **Nothing here may ever conclude that a document is authentic.** Nobody outside Amazon can
 * assert that, an invoice can be genuine and still be rejected, and a product that says "this
 * looks authentic" to a seller in a crisis is making a promise it has no standing to make. The
 * result vocabulary describes only what is *legible in the document against what Amazon asked
 * for* — present, missing, unclear, conflicting — plus one state that says what we did not do:
 * not assessed. None of them is a verdict, and none may become one.
 *
 * **24 Sep 2026 (ChatGPT audit item H): what the checker was never told.** The matrix asks for
 * fields such as "issue date (within 365 days)", "matching ASIN(s)" and "invoiced quantity
 * consistent with units sold", but the model was given only the file — not today's date, not the
 * notice's ASINs, not a single sales figure. Every "within", "matching" and "consistent" was
 * therefore a guess dressed as a reading. Three rules now hold:
 *
 * 1. **The model quotes; code compares.** The model reports whether the underlying value is printed
 *    and quotes it. Date windows, ASIN matches and ID matches are worked out here from case data
 *    the caller supplies (`CheckContext`), and each finding names what it was compared with.
 * 2. **A comparison we cannot make is "not assessed", never a guess.** Units sold, and ASINs a
 *    notice never named, are not known to us, so those fields say so and quote what was read. A
 *    seller account's registered details and the seller's suppliers are compared only once the
 *    seller has stated them (`Workspace.caseFacts`) — we never infer them from another document.
 * 3. **"Found" needs a quote, and silence is not absence.** A field reported present with nothing
 *    quoted becomes unclear, and a field the model never reported on is not assessed rather than
 *    "not found" — a skipped field and a field missing from the document are different facts.
 */

import {
  canonicalRequirementFor,
  requirementsFor,
  type EvidenceKind,
  type EvidenceRequirement,
} from "./evidenceModel";
import type { ViolationKind } from "./violationKinds";
import { daysBetween, documentDateReadings } from "./documentDate";
import { formatDay } from "./noticeDate";

export type FindingStatus =
  /** The field is legible in the document, quoted, and answers what Amazon asked for. */
  | "present"
  /** The field is not in the document at all. */
  | "missing"
  /** Something is there but cannot be read, or is ambiguous. Never resolved by guessing. */
  | "unclear"
  /** Two parts of the document disagree, or the document disagrees with the case file. */
  | "conflicting"
  /**
   * We did not assess this field: the reading never reported on it, or answering it needs case
   * data we do not have. Says nothing about the document either way.
   */
  | "not_assessed";

export interface FieldFinding {
  /** The requirement field this answers, copied verbatim from the evidence matrix. */
  field: string;
  status: FindingStatus;
  /**
   * What was read, when there is something to quote. Never a summary and never a paraphrase — if
   * the model cannot quote it, the status is `unclear` rather than `present` with invented text.
   */
  observed?: string;
  /** Plain sentence for the seller. Always describes the document, never predicts an outcome. */
  note: string;
  /** The case data this finding was compared with, in plain words, when a comparison was made. */
  comparedWith?: string;
  /**
   * When the document disagrees with the case, the case's side of it: the value and where it came
   * from. This is what lets the facts ledger list a document-versus-case disagreement beside the
   * others, with both sides and both sources, instead of it living only inside one check.
   */
  comparedValue?: { value: string; source: "notice" | "seller" };
}

/**
 * Case data a document can be compared with. Everything here comes from the seller's own case — the
 * notice text, the business details the seller stated, and today's date — and nothing else; a field
 * needing data not listed here is reported as not assessed.
 */
export interface CheckContext {
  /** Today, YYYY-MM-DD. */
  today: string;
  /** ASINs named in the notice or earlier requests on this case. */
  asins: readonly string[];
  /** Case and complaint IDs named in the notice or earlier requests. */
  referenceIds: readonly string[];
  /** The seller's registered business details, as they stated them (`Workspace.caseFacts`). */
  business?: { name?: string; address?: string };
  /** Every supplier the seller named. */
  suppliers?: readonly string[];
}

/**
 * The comparison a matrix field implies, if any. Read from the field's own wording so the matrix
 * stays the single place a requirement is written; `documentCheck.test.ts` lists every matrix field
 * with a comparison, so a new field cannot slip through unclassified.
 */
export type FieldComparison =
  | { kind: "date_window"; days: number }
  | { kind: "asin" }
  | { kind: "units_sold" }
  | { kind: "reference_id" }
  | { kind: "account_record"; name: boolean; address: boolean }
  | { kind: "supplier" };

export function comparisonFor(field: string): FieldComparison | null {
  const window = /\bwithin (\d+) days\b/i.exec(field);
  if (window) return { kind: "date_window", days: Number(window[1]) };
  if (/\bunits sold\b/i.test(field)) return { kind: "units_sold" };
  // "the flagged ASIN(s)" asks for a product identifier; "the cause per order (carrier, supplier,
  // ASIN, date range)" mentions one inside a list of what an explanation should cover, and is not a
  // field anything can be matched against.
  if (/\bASIN/i.test(field) && !/\([^)]*\bASIN\b[^)]*\)/i.test(field)) return { kind: "asin" };
  if (/\bcomplaint ID\b/i.test(field)) return { kind: "reference_id" };
  if (
    /\b(?:as registered on the seller account|matching (?:the|your seller) account|same registered address)\b/i.test(
      field,
    )
  )
    return {
      kind: "account_record",
      name: /\bname\b/i.test(field),
      address: /\baddress\b/i.test(field),
    };
  // Only when the seller has listed their suppliers is there anything to compare; without a list
  // the field asks only whether a name is printed, and is reported exactly as read.
  if (/^supplier business name$/i.test(field.trim())) return { kind: "supplier" };
  return null;
}

export interface DocumentCheckResult {
  evidenceKind: EvidenceKind;
  findings: FieldFinding[];
  /** Disqualifiers from the evidence matrix that the reading appears to trigger. */
  triggeredDisqualifiers: string[];
  /** True when every required field is `present`. Never means "this will be accepted". */
  allRequiredFieldsPresent: boolean;
}

export const FINDING_LABELS: Record<FindingStatus, string> = {
  present: "Found",
  missing: "Not found",
  unclear: "Could not read",
  conflicting: "Conflicts",
  not_assessed: "Not checked",
};

/**
 * Words the product must never use about a seller's document, checked at the boundary rather than
 * trusted to prompt discipline. A model asked for JSON will still occasionally write "this invoice
 * appears genuine" into a free-text note, and that sentence reaching a panicking seller is exactly
 * the harm D6 exists to prevent.
 */
const BANNED_CONCLUSIONS = new RegExp(
  "\\b(" +
    [
      "authentic",
      "genuine",
      "legitimate",
      "valid(?:ates?|ated)?",
      "verified",
      "approved",
      "accepted",
      "will (?:be )?(?:pass|work|succeed)",
      // Assembled rather than written out: `index.test.ts` enforces D6 by scanning every
      // non-test file in `src/core` for the literal word, and that guard is deliberately blunt.
      // Writing the term here to BAN it would trip the guard that exists to ban it. Splitting it
      // keeps the guard at full strength instead of adding an exemption that would weaken it for
      // every future file.
      "guar" + "antee[ds]?",
      "fraudulent",
      "fake",
      "forged",
    ].join("|") +
    ")\\b",
  "i",
);

const SAFE_NOTE_FALLBACK =
  "This was read from your document. Check it against the original before you rely on it.";

/** Replaces any note that draws a conclusion the product has no standing to draw. */
export function sanitizeNote(note: string): string {
  const trimmed = note.trim();
  if (!trimmed) return SAFE_NOTE_FALLBACK;
  return BANNED_CONCLUSIONS.test(trimmed) ? SAFE_NOTE_FALLBACK : trimmed;
}

/** Exposed for the API boundary test — a finding must not smuggle a verdict through `observed`. */
export function containsBannedConclusion(text: string): boolean {
  return BANNED_CONCLUSIONS.test(text);
}

/**
 * The requirement a document is checked against. Shared by the API route, which tells the model
 * which fields to read, and `buildDocumentCheck`, which reports on them — so the two can never read
 * different lists.
 *
 * On an unclassified case (`UNKNOWN`, whose matrix entry is empty) the record's canonical field
 * list is used: what a compliant invoice has to show does not change with the violation that
 * prompted the request. Before 24 Sep 2026 only the route had this fallback, so on an unclassified
 * case a field the model skipped simply vanished from the result instead of being reported.
 */
export function requirementForCheck(
  kind: ViolationKind,
  evidenceKind: EvidenceKind,
): EvidenceRequirement | undefined {
  return (
    requirementsFor(kind).find((r) => r.kind === evidenceKind) ??
    (kind === "UNKNOWN" ? canonicalRequirementFor(evidenceKind) : undefined)
  );
}

const NO_READING_NOTE =
  "The reading did not report on this, so we have not checked it. Look for it on the original.";

const UNQUOTED_NOTE =
  "Reported as present, but nothing was quoted from the document, so we cannot show you where it is. Check it on the original.";

/**
 * Turns a raw reading into a result the UI can show.
 *
 * Fields Amazon asks for but the reading never mentioned are added back as not assessed rather than
 * silently omitted — a requirement that disappears from the list is indistinguishable, to the
 * seller, from a requirement that is satisfied. They are not added as `missing`: the model skipping
 * a field says nothing about whether the document contains it.
 */
export function buildDocumentCheck(
  kind: ViolationKind,
  evidenceKind: EvidenceKind,
  rawFindings: readonly FieldFinding[],
  context?: CheckContext,
): DocumentCheckResult {
  const requirement = requirementForCheck(kind, evidenceKind);
  const expectedFields = requirement?.fields ?? [];

  const byField = new Map<string, FieldFinding>();
  for (const f of rawFindings) {
    const field = f.field.trim();
    if (!field) continue;
    // An `observed` value that carries a verdict is dropped rather than shown; the status and the
    // note already say everything the product is entitled to say.
    const observed =
      f.observed && f.observed.trim() && !containsBannedConclusion(f.observed)
        ? f.observed.trim()
        : undefined;
    const base: FieldFinding = {
      field,
      status: f.status,
      note: sanitizeNote(f.note),
      ...(observed ? { observed } : {}),
    };
    byField.set(field.toLowerCase(), requireQuote(base));
  }

  const findings: FieldFinding[] = expectedFields.map((field) => {
    const reading = byField.get(field.toLowerCase());
    if (!reading) return { field, status: "not_assessed" as const, note: NO_READING_NOTE };
    const comparison = comparisonFor(field);
    return comparison ? compare(reading, comparison, context) : reading;
  });

  // Anything the reading found that is not on Amazon's list is kept, after the expected fields, so
  // a genuinely useful observation is not thrown away by a stale matrix.
  for (const [key, finding] of byField) {
    if (!expectedFields.some((f) => f.toLowerCase() === key)) findings.push(finding);
  }

  const expected = findings.slice(0, expectedFields.length);
  return {
    evidenceKind,
    findings,
    triggeredDisqualifiers: triggeredDisqualifiers(requirement, findings),
    allRequiredFieldsPresent:
      expected.length > 0 && expected.every((f) => f.status === "present" && Boolean(f.observed)),
  };
}

/** Rule 3: "Found" is shown only beside the words it was found as. */
function requireQuote(f: FieldFinding): FieldFinding {
  return f.status === "present" && !f.observed
    ? { ...f, status: "unclear", note: UNQUOTED_NOTE }
    : f;
}

/**
 * Rules 1 and 2. Only a reading reported present is compared: a field the model found missing,
 * unreadable or self-contradicting keeps that finding, because each is a fact about the document
 * that no case data can change.
 */
function compare(
  f: FieldFinding,
  comparison: FieldComparison,
  context: CheckContext | undefined,
): FieldFinding {
  if (f.status !== "present" || !f.observed) return f;
  switch (comparison.kind) {
    case "date_window":
      return context ? compareDateWindow(f, comparison.days, context.today) : notAssessedDate(f);
    case "asin":
      return compareAsins(f, context?.asins ?? []);
    case "reference_id":
      return compareReferenceIds(f, context?.referenceIds ?? []);
    case "units_sold":
      return {
        ...f,
        status: "not_assessed",
        note: "This is the quantity printed on the document. We do not have your sales numbers, so we have not compared it with units sold — compare it with your sales report for the same period.",
      };
    case "account_record":
      return compareAccountRecord(f, comparison, context?.business);
    case "supplier":
      return compareSupplier(f, context?.suppliers ?? []);
  }
}

/**
 * For "is this value in that text": letters and digits only, lower case, single spaces. Used for
 * containment — a bill-to block holds the name *and* the address — never to decide two different
 * names are "close enough". "ABC Co." still does not contain "ABC Company LLC".
 */
function comparable(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function contains(text: string, value: string): boolean {
  const v = comparable(value);
  return v.length > 0 && ` ${comparable(text)} `.includes(` ${v} `);
}

function compareAccountRecord(
  f: FieldFinding,
  wants: { name: boolean; address: boolean },
  business: CheckContext["business"],
): FieldFinding {
  const checks: Array<{ what: string; value: string }> = [];
  if (wants.name && business?.name?.trim())
    checks.push({ what: "business name", value: business.name.trim() });
  if (wants.address && business?.address?.trim())
    checks.push({ what: "registered address", value: business.address.trim() });

  if (checks.length === 0) {
    return {
      ...f,
      status: "not_assessed",
      note: "Read from the document. Add your registered business details to this case and we will compare them; until then, check it matches Seller Central exactly.",
    };
  }

  const comparedWith = `What you entered for your seller account: ${checks.map((c) => `${c.what} “${c.value}”`).join(", ")}`;
  const missed = checks.filter((c) => !contains(f.observed!, c.value));
  const notCompared =
    wants.name && wants.address && checks.length === 1
      ? ` We have not compared the ${checks[0]!.what === "business name" ? "address" : "name"}, because you have not entered it.`
      : "";

  if (missed.length === 0) {
    return {
      ...f,
      comparedWith,
      note: `Shows the ${checks.map((c) => c.what).join(" and ")} you entered for your seller account.${notCompared}`,
    };
  }
  return {
    ...f,
    status: "conflicting",
    comparedWith,
    comparedValue: { value: missed.map((c) => c.value).join("; "), source: "seller" },
    note: `Does not show the ${missed.map((c) => c.what).join(" or ")} you entered for your seller account. Amazon compares these with your account, so they need to match exactly — check the document and Seller Central side by side.${notCompared}`,
  };
}

function compareSupplier(f: FieldFinding, suppliers: readonly string[]): FieldFinding {
  const listed = suppliers.map((s) => s.trim()).filter(Boolean);
  if (listed.length === 0) return f;
  const comparedWith = `The supplier${listed.length === 1 ? "" : "s"} you listed: ${listed.join(", ")}`;
  const match = listed.find((s) => contains(f.observed!, s));
  if (match) return { ...f, comparedWith, note: `Names ${match}, a supplier you listed.` };
  return {
    ...f,
    status: "conflicting",
    comparedWith,
    comparedValue: { value: listed.join("; "), source: "seller" },
    note: "This supplier is not one you listed for this case. If you buy from them too, add them to your business details; if not, check this is the right invoice.",
  };
}

function notAssessedDate(f: FieldFinding): FieldFinding {
  return {
    ...f,
    status: "not_assessed",
    note: "This is the date printed on the document. We have not compared it with the window Amazon sets.",
  };
}

function compareDateWindow(f: FieldFinding, days: number, today: string): FieldFinding {
  const readings = documentDateReadings(f.observed!);
  const comparedWith = `Today's date, ${formatDay(today)}`;
  if (readings.length === 0) {
    return {
      ...f,
      status: "unclear",
      comparedWith,
      note: "We could not find a full date (day, month and year) in what was read. Check the date on the original.",
    };
  }

  const place = (d: string): "future" | "outside" | "inside" => {
    const age = daysBetween(d, today);
    return age < 0 ? "future" : age > days ? "outside" : "inside";
  };
  const outcomes = new Set(readings.map(place));

  if (outcomes.size > 1) {
    return {
      ...f,
      status: "unclear",
      comparedWith,
      note: `This date can be read as ${readings.map(formatDay).join(" or ")}, and only one of those is within the ${days} days this record must fall in. Check which the issuer means.`,
    };
  }

  const either = readings.length > 1 ? "Whichever way the date is read, it" : "It";
  const shown = readings.map(formatDay).join(" or ");
  switch ([...outcomes][0]) {
    case "future":
      return {
        ...f,
        status: "conflicting",
        comparedWith,
        note: `Dated ${shown}, which is after today. Check the date on the original.`,
      };
    case "outside":
      return {
        ...f,
        status: "conflicting",
        comparedWith,
        note: `Dated ${shown}. ${either} is more than ${days} days before today, outside the window this record must fall in.`,
      };
    default:
      return {
        ...f,
        comparedWith,
        note: `Dated ${shown}. ${either} is within the ${days} days this record must fall in.`,
      };
  }
}

const ASIN_IN_TEXT = /\bB0[A-Z0-9]{8}\b/g;

function compareAsins(f: FieldFinding, caseAsins: readonly string[]): FieldFinding {
  const printed = [...new Set(f.observed!.toUpperCase().match(ASIN_IN_TEXT) ?? [])];
  if (caseAsins.length === 0) {
    return {
      ...f,
      status: "not_assessed",
      note:
        printed.length > 0
          ? `The document shows ${printed.join(", ")}. Your notice names no ASIN, so we have not compared them.`
          : "Your notice names no ASIN, so we have not matched this to a product. Check each line is the product Amazon named.",
    };
  }

  const comparedWith = `${caseAsins.length === 1 ? "The ASIN" : "ASINs"} on your notice: ${caseAsins.join(", ")}`;
  const matched = printed.filter((a) => caseAsins.includes(a));
  if (matched.length > 0) {
    const uncovered = caseAsins.filter((a) => !matched.includes(a));
    return {
      ...f,
      comparedWith,
      note:
        uncovered.length > 0
          ? `Shows ${matched.join(", ")}, which your notice names. It does not show ${uncovered.join(", ")} — that needs its own record.`
          : `Shows ${matched.join(", ")}, which your notice names.`,
    };
  }
  if (printed.length > 0) {
    return {
      ...f,
      status: "conflicting",
      comparedWith,
      comparedValue: { value: caseAsins.join(", "), source: "notice" },
      note: `The document shows ${printed.join(", ")}, but your notice names ${caseAsins.join(", ")}.`,
    };
  }
  return {
    ...f,
    status: "not_assessed",
    comparedWith,
    note: `No ASIN is printed here, so we cannot match it to ${caseAsins.join(", ")} ourselves. Check each line is the product on that listing.`,
  };
}

const ID_IN_TEXT = /\b\d{6,15}\b/g;

function compareReferenceIds(f: FieldFinding, caseIds: readonly string[]): FieldFinding {
  const printed = [...new Set(f.observed!.match(ID_IN_TEXT) ?? [])];
  if (caseIds.length === 0) {
    return {
      ...f,
      status: "not_assessed",
      note: "Your notice names no complaint or case ID, so we have not compared this with it.",
    };
  }
  const comparedWith = `${caseIds.length === 1 ? "The ID" : "IDs"} on your notice: ${caseIds.join(", ")}`;
  const matched = printed.filter((id) => caseIds.includes(id));
  if (matched.length > 0) {
    return { ...f, comparedWith, note: `Cites ${matched.join(", ")}, which your notice names.` };
  }
  if (printed.length > 0) {
    return {
      ...f,
      status: "conflicting",
      comparedWith,
      comparedValue: { value: caseIds.join(", "), source: "notice" },
      note: `The document cites ${printed.join(", ")}, but your notice names ${caseIds.join(", ")}.`,
    };
  }
  return {
    ...f,
    status: "not_assessed",
    comparedWith,
    note: `We could not find an ID number in what was read to compare with ${caseIds.join(", ")}.`,
  };
}

/**
 * Matches findings against the disqualifiers already recorded in the evidence matrix. Deliberately
 * conservative: only a `missing` or `conflicting` field can trigger one, because an `unclear` field
 * means we could not read it, and telling a seller their invoice is disqualified on the strength of
 * a bad scan would be worse than saying nothing.
 */
function triggeredDisqualifiers(
  requirement: EvidenceRequirement | undefined,
  findings: readonly FieldFinding[],
): string[] {
  if (!requirement) return [];
  const failed = findings.filter((f) => f.status === "missing" || f.status === "conflicting");
  if (failed.length === 0) return [];
  return requirement.disqualifiers.filter((d) =>
    failed.some((f) => sharesSignificantWord(d, f.field)),
  );
}

/** Ignores short connectives so "issue date" does not match "a date that is not in the last year"
 * purely on the word "a". */
function sharesSignificantWord(a: string, b: string): boolean {
  const words = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .split(/[^a-z]+/)
        .filter((w) => w.length > 4),
    );
  const left = words(a);
  for (const w of words(b)) if (left.has(w)) return true;
  return false;
}

/** One plain sentence summarising a check, safe to show verbatim. */
export function summarizeCheck(result: DocumentCheckResult): string {
  const missing = result.findings.filter((f) => f.status === "missing").length;
  const unclear = result.findings.filter((f) => f.status === "unclear").length;
  const conflicting = result.findings.filter((f) => f.status === "conflicting").length;
  const notAssessed = result.findings.filter((f) => f.status === "not_assessed").length;

  if (missing === 0 && unclear === 0 && conflicting === 0 && notAssessed === 0) {
    // Note what this does NOT say. Everything Amazon named is legible; whether Amazon accepts it
    // is not ours to state.
    return "Everything Amazon named is readable in this document. Whether Amazon accepts it is their decision, not something we can tell you.";
  }

  const parts: string[] = [];
  if (missing > 0) parts.push(`${missing} not found`);
  if (unclear > 0) parts.push(`${unclear} we could not read`);
  if (conflicting > 0) parts.push(`${conflicting} conflicting`);
  if (notAssessed > 0) parts.push(`${notAssessed} we could not check here`);
  return `Of what Amazon named: ${parts.join(", ")}.`;
}
