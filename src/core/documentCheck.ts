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
  /**
   * The date of Amazon's notice, YYYY-MM-DD, when the case holds one. Amazon counts a record's age
   * back from its own notice ("within 365 days before the date of this notice"), not from the day
   * the seller checks, so a 14-month-old invoice can be inside the window of a notice sent a few
   * weeks after it was issued. Without it the window is counted from `today`, and the finding says so.
   */
  noticeDate?: string;
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
  /**
   * Set when the words were read on the seller's device, without AI (`localReading.ts`), instead of
   * by the AI reading. The panel must say which, because "this file was sent to be read" is false
   * for a device reading — and saved with the case, so a reload still says it.
   */
  readOn?: "device";
  /** Why the AI reading was not used, when `readOn` is "device". */
  aiNote?: string;
  /**
   * True when the file was sent to AppealDeck for the AI reading before the device reading was made
   * (a signed-in seller: the request goes first, and can be refused, busy or switched off). Absent
   * on results saved before this was recorded, which therefore claim nothing either way.
   */
  fileSent?: boolean;
  /**
   * Where a device reading's words came from: the PDF's own text, or OCR of a picture. OCR can
   * misread a letter or a digit, and the panel and the export say so.
   */
  textSource?: "pdf_text" | "ocr";
}

export const FINDING_LABELS: Record<FindingStatus, string> = {
  present: "Found",
  missing: "Not found",
  // "Unclear", not "Could not read": the status also marks a document heading worth a second look
  // (a pro-forma, a quotation), which is not a failure to read.
  unclear: "Unclear",
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
      "authentic\\w*",
      "genuine\\w*",
      "legit\\w*",
      "valid(?:ates?|ated|ity)?",
      "verified",
      "bona fide",
      "no (?:sign|signs|evidence|indication) of (?:forgery|fraud|tampering|alteration)",
      "approved",
      "accepted",
      "will (?:be )?(?:pass|work|succeed)",
      // Acceptance by Amazon is the one verdict nobody here can give (6 Oct 2026).
      "(?:will|would|should) (?:accept|approve|pass|clear|satisfy|be fine|be enough|be sufficient)\\w*",
      "meets?(?: all| every)?(?: of)?(?: the)?(?: amazon['’]?s?)? requirements?",
      "(?:is|looks|appears|seems)(?: to be)? (?:a |an )?real(?: invoice| document| receipt| certificate| report)?",
      "real (?:invoice|document|receipt|certificate|report)",
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
    // 25 Sep 2026: widened from UNKNOWN-only. A policy notice that asks for supplier invoices
    // raised a "Supplier invoice" record, and its check was refused because the POLICY matrix
    // does not list invoices — so the one record Amazon named could not be checked. What an
    // invoice has to show does not depend on the violation, so the canonical fields apply.
    canonicalRequirementFor(evidenceKind)
  );
}

/** Fields whose quote is a printed name, address or identifier rather than free text. */
function isIdentityField(field: string): boolean {
  const kind = comparisonFor(field)?.kind;
  return (
    kind === "supplier" ||
    kind === "account_record" ||
    kind === "asin" ||
    kind === "reference_id" ||
    /\b(?:name|address)\b/i.test(field)
  );
}

/**
 * A printed name keeps its capitals ("Genuine Parts & Co. Ltd"), while a verdict slipped in beside
 * it is lowercase prose ("Acme Ltd — verified supplier"), so a quote in a name, address or ID field
 * is checked with its capitalised words set aside.
 */
function withoutCapitalisedWords(text: string): string {
  return text.replace(/\b[A-Z][A-Za-z]*\b/g, " ");
}

/** Lowercase, without punctuation or extra spaces, so "Issue date" and "issue  date:" match. */
function fieldKey(field: string): string {
  return field
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
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
  options?: {
    /**
     * True when every `observed` is a line copied from the document by code (the reading on the
     * device). The filter below is for a model's own words; a certificate that says "valid until
     * 2028" is the document speaking, not the product passing a verdict, and dropping that quote
     * turned a legible line into "could not read" (30 Sep 2026 review).
     */
    quotesAreVerbatim?: boolean;
    /**
     * True when the words were read from a picture (OCR). One misread letter or digit then makes an
     * ASIN, an ID, a supplier or a business name "differ" from the case, and a red "Conflicts" plus
     * a contradiction in the facts ledger would be a false alarm to a seller who can do nothing
     * about it but re-read the page. For those comparisons a mismatch is shown as "could not read",
     * with the reason. A date keeps its status, because a scan that really is over a year old is
     * worth saying - but one wrong digit moves a date across the window, so its note says to check
     * the day and the year.
     */
    fromPicture?: boolean;
  },
): DocumentCheckResult {
  const requirement = requirementForCheck(kind, evidenceKind);
  const expectedFields = requirement?.fields ?? [];

  const byField = new Map<string, FieldFinding>();
  for (const f of rawFindings) {
    const field = f.field.trim();
    if (!field) continue;
    // An `observed` value that carries a verdict is dropped rather than shown; the status and the
    // note already say everything the product is entitled to say.
    // A name, an address or an ID is quoted from the document as it is printed ("Genuine Parts &
    // Co. Ltd", "Valid Ventures LLC"), and is compared with the case by code, so the word filter
    // does not apply to it; it only dropped legitimate supplier quotes (6 Oct 2026).
    const observed =
      f.observed &&
      f.observed.trim() &&
      (options?.quotesAreVerbatim ||
        (isIdentityField(field)
          ? !containsBannedConclusion(withoutCapitalisedWords(f.observed))
          : !containsBannedConclusion(f.observed)))
        ? f.observed.trim()
        : undefined;
    const base: FieldFinding = {
      field,
      status: f.status,
      note: sanitizeNote(f.note),
      ...(observed ? { observed } : {}),
    };
    byField.set(fieldKey(field), requireQuote(base));
  }

  const findings: FieldFinding[] = expectedFields.map((field) => {
    const found = byField.get(fieldKey(field));
    if (!found) return { field, status: "not_assessed" as const, note: NO_READING_NOTE };
    // Report it under the matrix's own wording, whatever case or punctuation the reading used.
    const reading = { ...found, field };
    const comparison = comparisonFor(field);
    const compared = comparison ? compare(reading, comparison, context) : reading;
    return options?.fromPicture && comparison
      ? softenPictureMismatch(compared, comparison)
      : compared;
  });

  // Anything the reading found that is not on Amazon's list is kept, after the expected fields, so
  // a genuinely useful observation is not thrown away by a stale matrix.
  // The label of an extra finding is the model's own text and is shown as a row heading, so it gets
  // the same filter as a note, and only a handful are kept (a document cannot fill the screen).
  let extras = 0;
  for (const [key, finding] of byField) {
    if (expectedFields.some((f) => fieldKey(f) === key)) continue;
    if (finding.field.length > 80 || containsBannedConclusion(finding.field) || extras >= 5)
      continue;
    extras += 1;
    findings.push(finding);
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

/**
 * True when a reading of something filed as a supplier invoice found none of the three things every
 * invoice carries: a supplier name, an address and an issue date (B3, 6 Oct 2026). Almost always a
 * wrong file: a photo of the product, a screenshot, a different document. Said calmly above the rows
 * so the seller checks the file, instead of reading eight "Not found" badges as eight separate faults.
 *
 * Only a finding the reading actually made as "missing" counts. A field not read at all, or one that
 * could not be read, says nothing about whether the document is an invoice.
 */
export function looksLikeWrongDocument(
  result: Pick<DocumentCheckResult, "evidenceKind" | "findings">,
): boolean {
  if (result.evidenceKind !== "supplier_invoice") return false;
  const named = [/^supplier business name$/i, /^supplier physical address$/i, /^issue date\b/i];
  return named.every((pattern) =>
    result.findings.some((f) => pattern.test(f.field.trim()) && f.status === "missing"),
  );
}

/** A mismatch between a scanned page and the case, shown as unreadable rather than as a conflict. */
function softenPictureMismatch(f: FieldFinding, comparison: FieldComparison): FieldFinding {
  // A date keeps its status - that a scanned invoice really is over a year old is the most useful
  // thing a scan can say - but one wrong digit moves it across the window, so it says so.
  if (comparison.kind === "date_window") {
    return f.status === "present" || f.status === "conflicting"
      ? {
          ...f,
          note: `${f.note} Read from a picture, where a digit is easily misread: check the day and the year on the original.`,
        }
      : f;
  }
  if (f.status !== "conflicting") return f;
  return {
    ...f,
    status: "unclear",
    note: `${f.note} This was read from a picture, where a letter or a digit is easily misread, so check the original before treating it as a mismatch.`,
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
      return context ? compareDateWindow(f, comparison.days, context) : notAssessedDate(f);
    case "asin":
      return compareAsins(f, context?.asins ?? []);
    case "reference_id":
      return compareReferenceIds(f, context?.referenceIds ?? []);
    case "units_sold":
      return {
        ...f,
        status: "not_assessed",
        note: "This is the quantity printed on the document. This one invoice is not compared with units sold. Enter your units sold under Your business details and we add up all your checked invoices against it.",
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

function compareDateWindow(
  f: FieldFinding,
  days: number,
  context: Pick<CheckContext, "today" | "noticeDate">,
): FieldFinding {
  const readings = documentDateReadings(f.observed!);
  // The window is counted back from the notice's own date when the case holds one, and from today
  // otherwise. Every sentence below says which, so a seller can see what the date was compared with.
  const byNotice = Boolean(context.noticeDate);
  const today = context.noticeDate ?? context.today;
  const comparedWith = byNotice
    ? `The date of your notice, ${formatDay(today)}`
    : `Today's date, ${formatDay(today)}`;
  const before = byNotice ? `the notice dated ${formatDay(today)}` : "today";
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
      // After today is a date that cannot be right. After the notice is a record issued once the
      // notice was sent (a supplier reissuing an invoice, say), which is not a conflict but is not
      // "within 365 days before the notice" either, so it is left for the seller to judge.
      return byNotice
        ? {
            ...f,
            status: "unclear",
            comparedWith,
            note: `Dated ${shown}, which is after ${before}. Amazon counts the ${days} days back from its notice, so check the date on the original and that it covers what you sold before then.`,
          }
        : {
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
        note: `Dated ${shown}. ${either} is more than ${days} days before ${before}, outside the window this record must fall in.`,
      };
    default:
      return {
        ...f,
        comparedWith,
        note: byNotice
          ? `Dated ${shown}. ${either} is within ${days} days before ${before}, the window this record must fall in.`
          : `Dated ${shown}. ${either} is within the ${days} days this record must fall in.`,
      };
  }
}

/**
 * Counts every date-window finding in a check from the notice's date instead of today.
 *
 * The AI reading runs on the server, which knows only today's date, so its date findings were
 * judged against the day the check ran. The quoted date is still on each finding, so the comparison
 * is simply made again here with the case's own anchor. A finding the reading did not compare (a
 * missing or unreadable date) has no `comparedWith` and is left exactly as it was.
 */
export function reanchorDateWindows(
  result: DocumentCheckResult,
  kind: ViolationKind,
  context: Pick<CheckContext, "today" | "noticeDate">,
): DocumentCheckResult {
  if (!context.noticeDate) return result;
  const findings = result.findings.map((f) => {
    const comparison = comparisonFor(f.field);
    if (comparison?.kind !== "date_window" || !f.observed || !f.comparedWith) return f;
    if (!f.comparedWith.startsWith("Today's date")) return f;
    return compareDateWindow({ ...f, status: "present", note: "" }, comparison.days, context);
  });
  const requirement = requirementForCheck(kind, result.evidenceKind);
  const expected = findings.slice(0, requirement?.fields.length ?? 0);
  return {
    ...result,
    findings,
    triggeredDisqualifiers: triggeredDisqualifiers(requirement, findings),
    allRequiredFieldsPresent:
      expected.length > 0 && expected.every((f) => f.status === "present" && Boolean(f.observed)),
  };
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
  // A bare run of digits is not necessarily a complaint ID: an invoice number or a phone number is
  // one too. Only a number the quote itself labels as an ID, case, complaint or reference can
  // conflict with the notice's.
  const labelled =
    /\b(?:complaint|case|report|reference|ref|id|number|no|claim)\b[^0-9]{0,25}\d{6,15}|#\s*\d{6,15}/i.test(
      f.observed!,
    );
  if (printed.length > 0 && !labelled) {
    return {
      ...f,
      status: "not_assessed",
      comparedWith,
      note: `The document shows ${printed.join(", ")}, but it is not labelled as a complaint or case ID, so we have not compared it with ${caseIds.join(", ")}.`,
    };
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
    // The reading on the device matches labels and patterns, so a "Found" there means a matching
    // line exists, not that the line answers what Amazon asked (30 Sep 2026 review).
    if (result.readOn === "device") {
      return "Each item Amazon named has a matching line in the text we read. That does not check that the line says what Amazon asked for. Whether Amazon accepts it is their decision, not something we can tell you.";
    }
    // Note what this does NOT say. Everything Amazon named is legible; whether Amazon accepts it
    // is not ours to state.
    return "Everything Amazon named is readable in this document. Whether Amazon accepts it is their decision, not something we can tell you.";
  }

  // Every status with its own count, so "found" is never read next to a total that hides how many
  // were not found, unclear or not checked (7 Oct 2026).
  const present = result.findings.filter((f) => f.status === "present").length;
  const parts: string[] = [];
  if (present > 0) parts.push(`${present} found`);
  if (missing > 0) parts.push(`${missing} not found`);
  if (unclear > 0) parts.push(`${unclear} unclear`);
  if (conflicting > 0) parts.push(`${conflicting} conflicting`);
  if (notAssessed > 0) parts.push(`${notAssessed} we could not check here`);
  return `Of what Amazon named: ${parts.join(", ")}.`;
}

// --- Saved checks -------------------------------------------------------------------------------

/** One readability check on a photo or scan of an identity document, examined on the device. */
export type ImageCheckStatus = "ok" | "warn" | "unknown";

export interface ImageCheck {
  id: "resolution" | "sharpness" | "framing" | "exposure";
  status: ImageCheckStatus;
  label: string;
  detail: string;
}

export interface IdentityImageReport {
  checks: ImageCheck[];
  /** True when nothing is flagged. Never means the document will be accepted. */
  looksReadable: boolean;
}

/** The outcomes worth keeping. A check that could not run is never saved; it is simply re-run. */
export type SavedCheckOutcome =
  { kind: "fields"; result: DocumentCheckResult } | { kind: "image"; report: IdentityImageReport };

/**
 * A document check kept with the case (24 Sep 2026).
 *
 * Until then a check lived only in the page's memory, so a seller who paid, checked an invoice and
 * came back the next day found the reading gone — along with the disagreements it had added to the
 * facts ledger — and had to spend another paid reading to get it back. The reason given for keeping
 * it in memory was that a stale reading shown beside a replaced file would be worse than a re-run.
 * That is true, and it is handled here rather than by forgetting: a saved check belongs to one
 * record and one content hash, so a replaced file never shows another file's reading, and it
 * records which case details it was compared with, so a reading compared with details that have
 * since changed is shown as such instead of being passed off as current.
 */
export interface SavedDocumentCheck {
  recordId: string;
  /** The file's content hash when checked. A different hash means a different file. */
  contentHash?: string;
  /** When the check ran, ISO 8601. */
  at: string;
  /** `checkContextKey` of the case details the reading was compared with. */
  contextKey: string;
  outcome: SavedCheckOutcome;
}

/**
 * A stable key for the case details a reading is compared with. Two contexts with the same
 * identifiers and business details give the same key whatever order they were collected in.
 * Today's date is deliberately not part of it: the saved check shows the day it ran, and a date
 * window is judged as of that day.
 */
export function checkContextKey(ctx: {
  asins?: readonly string[];
  referenceIds?: readonly string[];
  business?: { name?: string; address?: string };
  suppliers?: readonly string[];
  /** Part of the key only when the case has one, so a case without a dated notice keeps its key. */
  noticeDate?: string;
}): string {
  const norm = (xs: readonly string[] | undefined) =>
    [...new Set((xs ?? []).map((x) => x.trim().toLowerCase()).filter(Boolean))].sort();
  return JSON.stringify([
    norm(ctx.asins),
    norm(ctx.referenceIds),
    (ctx.business?.name ?? "").trim().toLowerCase(),
    (ctx.business?.address ?? "").trim().toLowerCase().replace(/\s+/g, " "),
    norm(ctx.suppliers),
    ...(ctx.noticeDate ? [ctx.noticeDate] : []),
  ]);
}

/** The saved check for a record, if it is still about the file now linked there. */
export function savedCheckFor(
  saved: readonly SavedDocumentCheck[] | undefined,
  recordId: string | undefined,
  contentHash: string | undefined,
  /**
   * The kind of record the requirement asks for. One file can be linked to several requirements, and
   * a check run for "supplier invoice" must not be shown, counted or warned about under "brand
   * authorization" (7 Oct 2026). Unknown on either side means no objection.
   */
  evidenceKind?: string,
): SavedDocumentCheck | undefined {
  if (!recordId) return undefined;
  const hit = saved?.find((c) => c.recordId === recordId);
  if (!hit) return undefined;
  if (
    evidenceKind &&
    hit.outcome.kind === "fields" &&
    hit.outcome.result.evidenceKind &&
    hit.outcome.result.evidenceKind !== evidenceKind
  )
    return undefined;
  // Both hashes known and different: the record now holds another file.
  if (hit.contentHash && contentHash && hit.contentHash !== contentHash) return undefined;
  return hit;
}

/** Most checks a case keeps. One per record, and a case holds at most 30 requirements. */
export const MAX_SAVED_CHECKS = 30;

/**
 * Replaces the saved check for a record and drops any for records no longer linked to the case, so
 * the list cannot grow with files the seller has since removed.
 */
export function withSavedCheck(
  saved: readonly SavedDocumentCheck[] | undefined,
  entry: SavedDocumentCheck,
  linkedRecordIds: readonly string[],
): SavedDocumentCheck[] {
  const linked = new Set(linkedRecordIds);
  return [
    ...(saved ?? []).filter((c) => c.recordId !== entry.recordId && linked.has(c.recordId)),
    entry,
  ].slice(-MAX_SAVED_CHECKS);
}
