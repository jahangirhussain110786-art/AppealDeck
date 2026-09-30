/**
 * Reading a document on the seller's own device, without AI (29 Sep 2026).
 *
 * The backup for when the AI reading cannot run: it is not switched on, Google is busy or over its
 * quota, the seller is not signed in, or the file is too large to send. `lib/documentChecks/
 * localReader.ts` gets the words out of the file (the PDF's own text, or OCR of a photo or a scan)
 * and this module finds, for each field Amazon's list asks for, the line that answers it: by labels
 * ("From", "Bill to", "Date"), by patterns (an ASIN, a date, a phone number, a standard such as
 * "UL 62368-1") and by keywords.
 *
 * It quotes; `buildDocumentCheck` compares, exactly as for the AI reading. So a date window, an ASIN
 * match or a buyer-name mismatch is judged by the same code whichever way the words were read.
 *
 * What it cannot do, and so never claims: understand a document. A field it cannot answer from
 * labels and patterns is "not checked", never "not found" on a guess. Only a text PDF, whose words
 * are exactly the document's, can make a finding "not found", and only inside a section it could
 * identify and only when nothing left in that section could be the item: a supplier block that
 * holds just a name, an email and "(no address given)" has no address. A block with a line we
 * cannot classify is "could not read", not absent. OCR can mis-read, so there the same finding is
 * always "could not read". A word that merely sits near an answer ("returned", "model") is quoted
 * as a pointer and stays "not checked", so a device reading never shows a green "Found" for a line
 * that does not answer the question.
 */

import { comparisonFor, type FieldFinding } from "./documentCheck";
import { documentDateReadings } from "./documentDate";

/** Where the words came from: the PDF's own text layer, or OCR of an image. */
export type TextSource = "pdf_text" | "ocr";

/** The case details a line can be searched for. Compared later by `buildDocumentCheck`. */
export interface LocalReadingContext {
  business?: { name?: string; address?: string };
  suppliers?: readonly string[];
}

const MAX_QUOTE = 240;
const clip = (s: string) => (s.length > MAX_QUOTE ? `${s.slice(0, MAX_QUOTE - 1)}…` : s);

/**
 * The longest line the patterns below are run over. A line of a million characters (a PDF with no
 * line breaks, or a hostile file) made the email pattern quadratic and froze the page; no field a
 * seller's document answers needs more than a few hundred characters in one line.
 */
const MAX_LINE = 400;

/** A line cut at spaces into pieces no longer than MAX_LINE, so nothing is lost, only bounded. */
function boundedLine(line: string): string[] {
  const out: string[] = [];
  let rest = line;
  while (rest.length > MAX_LINE) {
    const at = rest.lastIndexOf(" ", MAX_LINE);
    const cut = at > MAX_LINE / 2 ? at : MAX_LINE;
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) out.push(rest);
  return out;
}

/** One line per line of the document, spaces collapsed, blank lines dropped, long lines bounded. */
export function documentLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .flatMap(boundedLine);
}

/** Letters and digits only, lower case: "Harbor Goods, Ltd." contains "harbor goods ltd". */
function loose(s: string): string {
  return ` ${s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()} `;
}
function includesLoosely(line: string, value: string): boolean {
  const v = loose(value);
  return v.trim().length > 0 && loose(line).includes(v);
}

// --- Patterns ------------------------------------------------------------------------------------

const MONTH =
  "(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)";
const DATE_PATTERNS = [
  new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s+${MONTH}\\.?,?\\s+\\d{4}\\b`, "i"),
  new RegExp(`\\b${MONTH}\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4}\\b`, "i"),
  new RegExp(`\\b\\d{1,2}[-./]${MONTH}\\.?[-./,\\s]+\\d{4}\\b`, "i"),
  /\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/,
  /\b\d{1,2}[/.-]\d{1,2}[/.-](?:\d{4}|\d{2})\b/,
];

/** The first full date in a line, as printed. A date the date reader cannot read is not a date. */
export function dateIn(line: string): string | undefined {
  let best: { at: number; text: string } | undefined;
  for (const re of DATE_PATTERNS) {
    const m = re.exec(line);
    if (m && (!best || m.index < best.at)) best = { at: m.index, text: m[0] };
  }
  return best && documentDateReadings(best.text).length > 0 ? best.text : undefined;
}

/** A date printed in a line, with the words just before it, which say which date it is. */
interface PrintedDate {
  text: string;
  label: string;
}

const GLOBAL_DATE_PATTERNS = DATE_PATTERNS.map((re) => new RegExp(re.source, `${re.flags}g`));

/** Every full date in a line, in order, each once. */
function datesInLine(line: string): Array<{ index: number; text: string }> {
  const found: Array<{ index: number; text: string }> = [];
  for (const re of GLOBAL_DATE_PATTERNS) {
    for (const m of line.matchAll(re)) {
      if (documentDateReadings(m[0]).length > 0) found.push({ index: m.index, text: m[0] });
    }
  }
  found.sort((a, b) => a.index - b.index || b.text.length - a.text.length);
  // Two patterns can match the same characters ("14/07/2026" as day-first and year-last).
  const out: typeof found = [];
  for (const d of found) {
    const last = out[out.length - 1];
    if (!last || d.index >= last.index + last.text.length) out.push(d);
  }
  return out;
}

/**
 * Every date in the document with its label: the words before it on the line, back to the previous
 * date, so "Invoice date: 3 June 2026    Due date: 3 July 2026" gives each its own. A date that
 * starts its line takes a short line above it as its label ("Invoice date" / "3 June 2026").
 */
function printedDates(lines: readonly string[]): PrintedDate[] {
  const out: PrintedDate[] = [];
  lines.forEach((line, i) => {
    let previousEnd = 0;
    for (const d of datesInLine(line)) {
      let label = line.slice(previousEnd, d.index).trim();
      if (!label && d.index === 0 && i > 0) {
        const above = lines[i - 1]!;
        if (above.length <= 40 && !dateIn(above)) label = above;
      }
      out.push({ text: d.text, label: label.slice(-40) });
      previousEnd = d.index + d.text.length;
    }
  });
  return out;
}

/** A label that says a date is when the document was issued. */
const ISSUE_LABEL =
  /\b(?:invoice date|date of issue|issue date|date issued|issued(?: on)?|dated)\b/i;
/**
 * Labels of dates that are not when a document was issued: due, paid, delivered, expiring, tested,
 * printed, ordered, a statement period. Each was once read as the issue date, so an old invoice
 * looked recent because the day it was printed came first (30 Sep 2026 review).
 */
const NOT_ISSUE_LABEL =
  /\b(?:due|paid|payment|deliver\w*|ship\w*|expir\w*|valid|until|birth|received|tested|print\w*|generated|created|order(?:ed)?|po|purchase order|statement|period)\b/i;

/** The first tier that has any date, and the distinct dates in it. */
function issueDateTier(dates: readonly PrintedDate[]): string[] {
  const usable = dates.filter((d) => !NOT_ISSUE_LABEL.test(d.label));
  const tiers = [
    usable.filter((d) => ISSUE_LABEL.test(d.label)),
    usable.filter((d) => /\bdate\b/i.test(d.label)),
    usable,
  ];
  const tier = tiers.find((t) => t.length > 0) ?? [];
  return [...new Set(tier.map((d) => d.text))];
}

/** Words that mark a date as the one a narrative field asks about. */
const STOPPED_LABEL =
  /\b(?:stopp\w*|discontinu\w*|remov\w*|withdr\w*|recall\w*|destr\w*|dispos\w*|delist\w*|ceased)\b/i;
const EFFECT_LABEL = /\b(?:effective|took effect|with effect|as of|since|from)\b/i;

const PHONE = /\+?\d[\d\s().-]{6,}\d/;
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/;
/** A number after "Tel:", "Phone", "Fax" and the like: a phone number at any length. */
const LABELLED_PHONE =
  /\b(?:tel|telephone|phone|ph|mobile|mob|cell|fax|contact|call)\b\.?\s*[:.#-]?\s*(\+?\(?\d[\d\s().-]*\d)/i;
function contactIn(line: string): string | undefined {
  const email = EMAIL.exec(line)?.[0];
  if (email) return email;
  const labelled = LABELLED_PHONE.exec(line)?.[1];
  if (labelled) return labelled.trim();
  const phone = PHONE.exec(line)?.[0];
  const digits = phone?.replace(/\D/g, "").length ?? 0;
  return phone && digits >= 9 && digits <= 15 ? phone.trim() : undefined;
}
/** Digits that could be a phone number in a format we did not pick out: never "absent" then. */
const DIGIT_RUN = /\d[\d\s().-]{4,}\d/;

const STREET =
  /\b(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr|boulevard|blvd|parkway|pkwy|way|court|ct|place|pl|highway|hwy|suite|ste|unit|floor|building|bldg|industrial|estate|po box|p\.o\. box)\b\.?/i;
/**
 * Street words used outside the US and UK. Some are ordinary words ("via", "park", "block"), so
 * they count only on a line that also has a number and a comma, like an address written out.
 */
const STREET_WEAK =
  /\b(?:block|plot|sector|zone|district|park|tower|via|viale|piazza|corso|calle|avenida|rue|strasse|straße|platz|weg|allee|nagar|colony)\b/i;
/** A US ZIP code or a UK postcode. */
const POSTCODE = /\b\d{5}(?:-\d{4})?\b|\b[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}\b/;
/** A six-digit postal code (India, China, Singapore and others): only on a line with a comma. */
const POSTCODE6 = /\b\d{6}\b/;
/** A line that starts by naming a number that is not an address: an invoice or order number. */
const NUMBER_LABEL =
  /^(?:invoice|inv|order|po|ref|reference|tax|vat|gst|account|acct|customer|client|page|item|sku|qty)\b/i;
function isAddress(line: string): boolean {
  if (contactIn(line) || dateIn(line) || NUMBER_LABEL.test(line)) return false;
  const digits = /\d/.test(line);
  const comma = line.includes(",");
  return (
    (STREET.test(line) && digits) ||
    (STREET_WEAK.test(line) && digits && comma) ||
    (POSTCODE.test(line) && /[A-Za-z]{2}/.test(line)) ||
    (POSTCODE6.test(line) && comma && /[A-Za-z]{3}/.test(line))
  );
}

const ASIN = /\bB0[A-Z0-9]{8}\b/g;
/** OCR often reads the zero in "B0" as the letter O; an ASIN never has an O there. */
const ASIN_OCR = /\bB[0O][A-Z0-9]{8}\b/g;
function asinsIn(text: string, source: TextSource): string[] {
  const upper = text.toUpperCase();
  if (source !== "ocr") return [...new Set([...upper.matchAll(ASIN)].map((m) => m[0]))];
  const found: string[] = [];
  for (const m of upper.matchAll(ASIN_OCR)) {
    const token = m[0];
    // An ordinary word that starts "BO" ("BOULEVARDS") has no digit after it; an ASIN read through
    // a scan almost always does. Without this a street name became a product code. The result
    // names the O-for-zero reading in the picture note, which every OCR reading carries.
    if (token[1] === "O" && !/\d/.test(token.slice(2))) continue;
    found.push(`B0${token.slice(2)}`);
  }
  return [...new Set(found)];
}

/** A label alone ("FROM (SUPPLIER)", "Bill to") or a label with a colon and a value. */
const labelled = (words: string) =>
  new RegExp(`^(?:${words})\\b(?:\\s*\\([^)]*\\))?\\s*(?::\\s*(.*))?$`, "i");
const SUPPLIER_WORDS =
  "from|supplier|seller|vendor|sold by|issued by|remit to|bill from|manufacturer";
/** Who is billed. A ship-to block is where goods go, which is not always who is billed. */
const BUYER_WORDS =
  "bill(?:ed)? to|buyer|sold to|customer|invoice to|client|applicant|importer|account holder";
const SHIP_WORDS = "ship(?:ped)? to|deliver(?:ed)? to";
const SUPPLIER_LABEL = labelled(SUPPLIER_WORDS);
const BUYER_LABEL = labelled(BUYER_WORDS);
const SHIP_LABEL = labelled(SHIP_WORDS);
/**
 * A line that holds a supplier label and a buyer label together: "FROM BILL TO". That is two
 * columns drawn side by side, which pdf.js reads across, so the two blocks arrive interleaved
 * ("Harbor Goods Wholesale Ltd Brightwater Home Goods LLC"). Neither can be told apart reliably.
 */
const SIDE_BY_SIDE = new RegExp(
  `^(?:${SUPPLIER_WORDS})\\b.{0,60}\\b(?:${BUYER_WORDS}|${SHIP_WORDS})\\b|^(?:${BUYER_WORDS}|${SHIP_WORDS})\\b.{0,60}\\b(?:${SUPPLIER_WORDS})\\b`,
  "i",
);
const SIDE_BY_SIDE_NOTE =
  "This document sets the supplier and the buyer side by side, and the words of the two blocks run together, so we have not tried to separate them. Check both on the original.";
function isTableHeader(line: string): boolean {
  return (
    (line.match(/\b(?:qty|quantity|description|unit price|amount|item)\b/gi) ?? []).length >= 2
  );
}

/** The most lines read from under a label. Longer, and we say the block is longer than we read. */
const SECTION_MAX = 12;

/**
 * The lines of a labelled section: everything after the label, up to the next label or a table's
 * header. Null when the document has no such label. `complete` is false when the cap ended it, so a
 * field "missing" from a block we did not finish reading is not called absent.
 */
function sectionAfter(
  lines: readonly string[],
  label: RegExp,
): { lines: string[]; complete: boolean } | null {
  const at = lines.findIndex((l) => l.length <= 60 && label.test(l));
  if (at < 0) return null;
  const inline = label.exec(lines[at]!)?.[1]?.trim();
  const out = inline ? [inline] : [];
  let complete = true;
  for (const line of lines.slice(at + 1)) {
    if (
      SUPPLIER_LABEL.test(line) ||
      BUYER_LABEL.test(line) ||
      SHIP_LABEL.test(line) ||
      isTableHeader(line)
    )
      break;
    if (out.length >= SECTION_MAX) {
      complete = false;
      break;
    }
    out.push(line);
  }
  return out.length > 0 ? { lines: out, complete } : null;
}

/** A standard or regulation a product is tested against. */
const STANDARD =
  /\b(?:UL|IEC|EN|ISO(?:\/IEC)?|ASTM|ANSI|BS|CSA|IEEE)\s?[A-Z]?\s?\d{2,}(?:[-.:/]\d+)*\b|\b16 CFR(?: Part)? \d+\b|\bCPSIA\b/g;
/** Management-system standards (quality, environment, safety at work) are not a product's test. */
const MANAGEMENT_STANDARD = /\bISO\s?(?:9001|14001|45001|13485|27001|50001|22000|37001|3834)\b/i;
/** The first standard a product could be tested against in a line, leaving out ISO 9001 and kin. */
function standardIn(line: string): string | undefined {
  return [...line.matchAll(STANDARD)].map((m) => m[0]).find((s) => !MANAGEMENT_STANDARD.test(s));
}
/** Words that say a standard is what a product was tested to, or complies with. */
const TESTED_TO =
  /\b(?:tested|complies|complied|compliance|conforms?|conformity|standard|accordance|according|meets|requirements?)\b/i;

/**
 * Words that make a line an assurance rather than a record: a promise ("we assure you"), an offer
 * to provide it later, a denial, or a place that is not a test house. A line that carries one is
 * never "Found"; it is quoted as a pointer. The disqualifier the evidence matrix names for a test
 * report is "a supplier's own assurance with no test document behind it", and the first version of
 * this reading called that "Found" (30 Sep 2026 review). "No" followed by a number is an
 * identifier ("Report No. 1042"), not a denial.
 */
const HEDGE =
  /\b(?:not|no(?![.:#]?\s*\d)|none|never|without|n\/a|on request|upon request|if (?:required|requested|needed)|can be (?:provided|supplied)|will (?:be )?(?:provided|supplied)|assure[ds]?|assurance|claims?|on[- ]site|in[- ]house|own lab(?:oratory)?|expired|pending)\b/i;
/** A line short and plain enough to be the record itself rather than a sentence about it. */
const isClean = (line: string) => line.length <= 140 && !HEDGE.test(line);

/**
 * Fields answered by a keyword. `strong` is a phrase that names the record itself ("test report",
 * a laboratory, an Amazon order number), and its first line is quoted as found. `weak` is a word
 * that only sits near the answer ("returned", "model", "dispose"): a line that mentions it is
 * quoted as a pointer and the field stays "not checked", because "Return address" and "Disposable
 * gloves" both matched and were shown as a green "Found" (30 Sep 2026 review). A field that is a
 * narrative ("how each complaint was resolved") has only `weak`.
 *
 * `clean` means the strong phrase counts only on a line that is plainly the record: short, and with
 * no promise, denial or "on request" in it (`isClean`). "A certificate of compliance is available
 * on request" names the record and is the opposite of having it. A line that names the record but
 * is not clean is quoted as a pointer.
 */
const KEYWORD_FIELDS: ReadonlyArray<{
  field: RegExp;
  strong?: RegExp;
  weak?: RegExp;
  clean?: boolean;
}> = [
  {
    field: /\btest report or compliance certificate\b/i,
    strong:
      /\b(?:test report|certificate of (?:compliance|conformity)|compliance certificate|conformity certificate)\b/i,
    clean: true,
  },
  {
    field: /\bissuing laboratory\b/i,
    strong:
      /\b(?:laborator(?:y|ies)|test(?:ing)? (?:lab|house|cent(?:re|er))|certification body|notified body)\b/i,
    clean: true,
  },
  {
    // A letter or a licence, or an authorized distributor. The bare word is everywhere ("returns
    // need prior authorization", "authorized staff may sign") and only points.
    field: /\bauthori[sz]|\blicen[cs]e\b|\bbrand letter\b/i,
    strong:
      /\b(?:letter of authori[sz]ation|authori[sz]ation letter|authori[sz]ed (?:distributor|reseller|retailer|dealer)|authori[sz]ation to (?:sell|distribute|resell)|licen[cs]e (?:agreement|to sell))\b/i,
    weak: /\b(?:authori[sz](?:e[ds]?|ation)|licen[cs]e[ds]?)\b/i,
    clean: true,
  },
  {
    field: /\brights-owner name\b/i,
    strong:
      /\b(?:rights? owner|trademark owner|brand owner|owner of (?:the |United States |U\.?S\.? |EU |European Union )?(?:trademark|brand))/i,
    clean: true,
  },
  { field: /\bretraction\b/i, strong: /\b(?:retract\w*|withdraw\w*)\b/i, clean: true },
  {
    field: /\border or sales report\b|\bexport of the individual orders\b/i,
    // Amazon's order number, or the front of one that wrapped onto the next line.
    strong: /\b\d{3}-\d{7}-(?:\d{7}\b|$)/,
    weak: /\b(?:orders?|sales) (?:report|log|export)\b|\borders? and\b.{0,40}\blog\b/i,
  },
  {
    field: /\bcomplaint, return or claim\b/i,
    weak: /\b(?:complaints?|returns?|returned|refunds?|refunded|claims?)\b/i,
  },
  {
    field: /\bpurchase orders or shipping records\b/i,
    strong:
      /\b(?:purchase order|P\.?O\.? ?(?:no|number|#)|bill of lading|tracking (?:no|number)|shipment)\b/i,
  },
  {
    field: /\bwhat happened to the affected inventory\b/i,
    weak: /\b(?:destroy\w*|dispos\w*|recall\w*|removal order|returned to (?:the )?supplier|liquidat\w*)\b/i,
  },
  { field: /\bmodel number\b/i, weak: /\b(?:model|manufacturer)\b/i },
];

// --- Findings ------------------------------------------------------------------------------------

const NOT_CHECKED =
  "We cannot judge this from the words alone, so we have not checked it. Look for it on the original.";
const FOUND = "Found in the text we read. Check it says what Amazon asked for.";

const present = (field: string, observed: string, note: string): FieldFinding => ({
  field,
  status: "present",
  observed: clip(observed),
  note,
});
const notChecked = (field: string, note = NOT_CHECKED): FieldFinding => ({
  field,
  status: "not_assessed",
  note,
});
/** Absent from a section we found: certain for a text PDF, only unreadable for OCR. */
const absentIn = (
  field: string,
  source: TextSource,
  observed: string,
  note: string,
): FieldFinding =>
  source === "pdf_text"
    ? { field, status: "missing", observed: clip(observed), note }
    : {
        field,
        status: "unclear",
        observed: clip(observed),
        note: `${note} The words were read from a picture, so check the original.`,
      };

/** A line that says which number or date follows, not who the supplier is. */
const NOT_A_NAME =
  /^(?:(?:invoice|inv|tax|vat|gst|order|po|ref|reference|page|total|amount|terms)\b\s*(?:no\b|number|num\b|#|id\b|date|:|\d)|(?:tax|vat|gst|abn|ein|date|attn|attention)\b)/i;
/** The supplier's name: the first line of the section that is not an address, contact or label. */
function looksLikeName(line: string): boolean {
  return (
    /[A-Za-z]{2}/.test(line) &&
    !isAddress(line) &&
    !contactIn(line) &&
    !dateIn(line) &&
    !/^\(.*\)$/.test(line) &&
    !NOT_A_NAME.test(line)
  );
}

const NO_SUPPLIER_SECTION =
  "We could not find a supplier section (such as “From” or “Supplier”) in the text we read. Check it on the original.";

function readField(
  field: string,
  lines: readonly string[],
  text: string,
  ctx: LocalReadingContext,
  source: TextSource,
): FieldFinding {
  const comparison = comparisonFor(field);

  if (comparison?.kind === "date_window") {
    const dates = printedDates(lines);
    if (dates.length === 0)
      return notChecked(
        field,
        "We found no full date (day, month and year) in the text we read. Check the date on the original.",
      );
    const issued = issueDateTier(dates);
    if (issued.length === 0)
      return notChecked(
        field,
        "Every date we found is marked as something other than when the document was issued (due, paid, printed and the like). Check the issue date on the original.",
      );
    // More than one candidate and nothing to choose between them: say so, do not pick the first.
    if (issued.length > 1)
      return {
        field,
        status: "unclear",
        observed: clip(issued.join(", ")),
        note: "We found more than one date and could not tell which is when the document was issued. Check the issue date on the original.",
      };
    return present(
      field,
      issued[0]!,
      "A date printed in the document. Check it is the one Amazon asked about.",
    );
  }

  if (/\bdate\b|\btook effect\b/i.test(field) && !/\bdate range\b/i.test(field)) {
    // A date field that is not the issue date ("the date the product stopped being sold"): only a
    // date whose own label says so. The first date on the page is not an answer to it.
    const wanted = /\bstopped\b/i.test(field) ? STOPPED_LABEL : EFFECT_LABEL;
    const match = printedDates(lines).find((d) => wanted.test(d.label));
    return match
      ? present(
          field,
          match.text,
          "A date printed in the document. Check it is the one Amazon asked about.",
        )
      : notChecked(
          field,
          "We found no date marked as the one this asks about. Check the date on the original.",
        );
  }

  if (comparison?.kind === "asin") {
    const found = asinsIn(text, source);
    return found.length > 0
      ? present(field, found.join(", "), "The ASINs printed in the document.")
      : notChecked(
          field,
          "We found no ASIN in the text we read. Check each line is the product Amazon named.",
        );
  }

  if (comparison?.kind === "reference_id") {
    // Every number on a line that names a complaint, case or reference, not the first such line:
    // "Our reference: 90210123456" before "Complaint ID 11223344556" made a correct ID a conflict.
    // A number after "tel" or "fax" is a phone number, not an ID. `compareReferenceIds` matches
    // the notice's IDs against all of them.
    const ids = new Set<string>();
    for (const line of lines) {
      if (!/\b(?:complaint|case|reference|ref|id)\b/i.test(line)) continue;
      for (const m of line.matchAll(/\d{6,15}/g)) {
        if (/\b(?:tel|phone|fax|mobile|cell)\b\D{0,12}$/i.test(line.slice(0, m.index))) continue;
        ids.add(m[0]);
      }
    }
    return ids.size > 0
      ? present(
          field,
          [...ids].join(", "),
          "The numbers printed beside a complaint, case or reference.",
        )
      : notChecked(field, "We found no complaint or case ID in the text we read.");
  }

  // Supplier and buyer blocks drawn side by side arrive interleaved. Say so; do not guess.
  // Either the two labels share a line, or the right column sat a little lower and they arrive as
  // two lines in a row with no block between them.
  const isSupplierLabel = (l: string) => l.length <= 60 && SUPPLIER_LABEL.test(l);
  const isBuyerLabel = (l: string) => l.length <= 60 && (BUYER_LABEL.test(l) || SHIP_LABEL.test(l));
  const sideBySide =
    lines.some((l) => l.length <= 100 && SIDE_BY_SIDE.test(l)) ||
    lines.some(
      (l, i) =>
        i + 1 < lines.length &&
        ((isSupplierLabel(l) && isBuyerLabel(lines[i + 1]!)) ||
          (isBuyerLabel(l) && isSupplierLabel(lines[i + 1]!))),
    );
  const fromSupplierOrBuyer =
    comparison?.kind === "account_record" ||
    comparison?.kind === "supplier" ||
    /\bsupplier\b.*\b(?:address|phone|contact)\b/i.test(field);
  if (sideBySide && fromSupplierOrBuyer) return notChecked(field, SIDE_BY_SIDE_NOTE);

  if (comparison?.kind === "account_record") {
    const section = sectionAfter(lines, BUYER_LABEL);
    if (section)
      return present(
        field,
        section.lines.join(", "),
        "Read from the buyer section of the document.",
      );
    // Only where goods are sent, or only the seller's own name somewhere: neither says who the
    // document is billed to, and comparing either with the seller's details would have said
    // "shows your name" for an invoice issued BY the seller or billed to someone else.
    const ship = sectionAfter(lines, SHIP_LABEL);
    if (ship)
      return {
        field,
        status: "unclear",
        observed: clip(ship.lines.join(", ")),
        note: "We found a ship-to block but no bill-to block. Where goods are sent is not always who is billed, so we have not compared it with your business details. Check it on the original.",
      };
    const name = ctx.business?.name?.trim();
    const at = name ? lines.findIndex((l) => includesLoosely(l, name)) : -1;
    if (at >= 0)
      return {
        field,
        status: "unclear",
        observed: clip(lines[at]!),
        note: "Your business name appears in the text, but we could not find a buyer section (such as “Bill to”), so we cannot tell whether it is the buyer or the seller. Check it on the original.",
      };
    return notChecked(
      field,
      "We could not find a buyer section (such as “Bill to”) in the text we read, so we have not compared it with your business details. Check it on the original.",
    );
  }

  if (comparison?.kind === "supplier") {
    const section = sectionAfter(lines, SUPPLIER_LABEL);
    const name = section?.lines.find(looksLikeName);
    if (name) return present(field, name, "Read from the supplier section of the document.");
    const listed = ctx.suppliers?.find((s) => lines.some((l) => includesLoosely(l, s)));
    const line = listed ? lines.find((l) => includesLoosely(l, listed)) : undefined;
    return line
      ? present(field, line, "A supplier you listed, found in the text we read.")
      : notChecked(field, NO_SUPPLIER_SECTION);
  }

  if (comparison?.kind === "units_sold") {
    // A table row that ends "<quantity> <unit price> <amount>" is the quantity as printed.
    // The quantity may start the line (a row split across lines: description, then "40 $6.20 $248.00").
    const rows = lines.filter((l) =>
      /(?:^|\s)\d[\d,]*\s+[$£€]?\s?\d[\d,]*\.\d{2}\s+[$£€]?\s?\d[\d,]*\.\d{2}\s*$/.test(l),
    );
    // Otherwise a labelled quantity. Not on an address line: "Unit 12" in an address matched
    // "unit" plus a number and was quoted as the quantity (30 Sep 2026).
    const labelledQty = lines
      .filter((l) => !isAddress(l))
      .map((l) => /\b(?:qty|quantity|units?|pcs|pieces)\b[\s.:#]*(\d[\d,]*)/i.exec(l)?.[0])
      .find(Boolean);
    const quoted = rows.length > 0 ? rows.join("; ") : labelledQty;
    return quoted
      ? present(field, quoted, FOUND)
      : notChecked(
          field,
          "We could not pick out the quantity in the text we read. Check it on the original.",
        );
  }

  if (/\bsupplier\b.*\baddress\b/i.test(field)) {
    const section = sectionAfter(lines, SUPPLIER_LABEL);
    if (!section) return notChecked(field, NO_SUPPLIER_SECTION);
    const address = section.lines.filter(isAddress);
    if (address.length > 0)
      return present(field, address.join(", "), "Read from the supplier section of the document.");
    // "Not found" only when nothing left in the section could be an address: the name, the phone
    // and email and a note such as "(no address given)" are set aside first. Anything else may be
    // an address in a form we do not recognise (a Shenzhen block and park, "Via Roma 12"), and
    // saying it is absent beside the very line that holds it was wrong (30 Sep 2026 review).
    const name = section.lines.find(looksLikeName);
    const rest = section.lines.filter((l) => l !== name && !contactIn(l) && !/^\(.*\)$/.test(l));
    if (rest.length > 0 || !section.complete)
      return {
        field,
        status: "unclear",
        observed: clip(section.lines.join(", ")),
        note: section.complete
          ? "We could not tell which line, if any, is the street address. Check the supplier section on the original."
          : "The supplier section is longer than we read, so we cannot say whether it has a street address. Check it on the original.",
      };
    return absentIn(
      field,
      source,
      section.lines.join(", "),
      "The supplier section we read has no street address.",
    );
  }

  if (/\bsupplier\b.*\b(?:phone|contact)\b/i.test(field)) {
    const section = sectionAfter(lines, SUPPLIER_LABEL);
    if (!section) return notChecked(field, NO_SUPPLIER_SECTION);
    const contact = section.lines.map(contactIn).find(Boolean);
    if (contact) return present(field, contact, "Read from the supplier section of the document.");
    // Digits in a format we did not pick out may still be a phone number, and a block cut short
    // may hold one further down: neither is "absent".
    const unsure = section.lines.some((l) => DIGIT_RUN.test(l) && !isAddress(l));
    if (unsure || !section.complete)
      return {
        field,
        status: "unclear",
        observed: clip(section.lines.join(", ")),
        note: unsure
          ? "We could not tell whether a number in the supplier section is a phone number. Check it on the original."
          : "The supplier section is longer than we read, so we cannot say whether it has a phone number. Check it on the original.",
      };
    return absentIn(
      field,
      source,
      section.lines.join(", "),
      "The supplier section we read has no phone number or email address.",
    );
  }

  if (/\bstandard or regulation\b/i.test(field)) {
    // A line that says what the product was tested to, and denies nothing. A standard named in
    // an assurance ("we do not claim compliance with UL 62368-1") or in a factory's quality
    // certificate (ISO 9001) is not the answer; it is quoted as a pointer.
    const withStandard = lines.filter((l) => standardIn(l));
    const line =
      withStandard.find((l) => isClean(l) && TESTED_TO.test(l)) ??
      withStandard.find((l) => isClean(l));
    if (line) return present(field, standardIn(line)!, FOUND);
    return withStandard.length > 0
      ? {
          field,
          status: "not_assessed",
          observed: clip(withStandard[0]!),
          note: "A line that names a standard is quoted here, but it reads as a promise or a denial rather than what the product was tested to. Read the document to check.",
        }
      : notChecked(field);
  }

  const keyword = KEYWORD_FIELDS.find((k) => k.field.test(field));
  if (keyword) {
    // A clean line that names the record is the answer. A line that names it but is a promise, a
    // denial or a sentence about it is only a pointer, as is a weak match.
    const named = keyword.strong ? lines.filter((l) => keyword.strong!.test(l)) : [];
    const strong = named.find((l) => !keyword.clean || isClean(l));
    if (strong) return present(field, strong, FOUND);
    const weak = named[0] ?? (keyword.weak ? lines.find((l) => keyword.weak!.test(l)) : undefined);
    if (weak)
      return {
        field,
        status: "not_assessed",
        observed: clip(weak),
        note: "A line that mentions it is quoted here, but we cannot tell whether it answers what Amazon asked. Read the document to check.",
      };
    return notChecked(
      field,
      "We did not find this in the text we read. It may not be there, or it may be worded differently. Check the original.",
    );
  }

  return notChecked(field);
}

/**
 * A reading of every field on Amazon's list, from the document's words. Pass the result to
 * `buildDocumentCheck`, which makes the comparisons and enforces the vocabulary.
 */
export function readFieldsFromText(
  text: string,
  fields: readonly string[],
  ctx: LocalReadingContext,
  source: TextSource,
): FieldFinding[] {
  const lines = documentLines(text);
  return fields.map((field) => readField(field, lines, lines.join("\n"), ctx, source));
}

/** Too little text to read anything from: a scan with no text layer, or a blank page. */
export function hasReadableText(text: string): boolean {
  return (text.match(/[A-Za-z]{3,}/g) ?? []).length >= 5;
}
