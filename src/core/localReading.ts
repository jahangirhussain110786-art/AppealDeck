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

/**
 * Characters that print as nothing but split a word for a pattern: a zero-width space inside an
 * email or a phone number made the whole contact line unreadable, and the supplier "had no
 * contact". Only these four: the joiners and direction marks (U+200C to U+200F) are meaningful in
 * Persian and Indic scripts and are left alone.
 */
const INVISIBLE = /[​⁠﻿­]/g;

/** One line per line of the document, spaces collapsed, blank lines dropped, long lines bounded. */
export function documentLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(INVISIBLE, "").replace(/\s+/g, " ").trim())
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
/** Dates with the month written out: nothing else looks like them. */
const NAMED_DATE_PATTERNS = [
  new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s+${MONTH}\\.?,?\\s+\\d{4}\\b`, "gi"),
  new RegExp(`\\b${MONTH}\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4}\\b`, "gi"),
  new RegExp(`\\b\\d{1,2}[-./]${MONTH}\\.?[-./,\\s]+\\d{4}\\b`, "gi"),
];
/**
 * A numeric date that is not a piece of a longer chain of numbers. "01.23.45.67.89" (a French
 * phone number) and "23-05-05" (a sort code) both read as dates, and an invoice number such as
 * "INV-03-06-2026-001" holds one. The character before must not be a digit or a separator, and the
 * one after must not continue the chain. Written without lookbehind, which Safari before 16.4
 * rejects as a syntax error for the whole file: the character before is matched, then set aside.
 */
const NUMERIC_DATE =
  /(^|[^\d./-])(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[/.-]\d{1,2}[/.-](?:\d{4}|\d{2}))(?!\d|[./-]\d)/g;

/** Every full date in a line, in order, each once, as printed. */
function datesInLine(line: string): Array<{ index: number; text: string }> {
  const found: Array<{ index: number; text: string }> = [];
  for (const re of NAMED_DATE_PATTERNS) {
    for (const m of line.matchAll(re)) found.push({ index: m.index, text: m[0] });
  }
  for (const m of line.matchAll(NUMERIC_DATE)) {
    found.push({ index: m.index + m[1]!.length, text: m[2]! });
  }
  // A date the date reader cannot read (a month 13) is not a date.
  const valid = found.filter((d) => documentDateReadings(d.text).length > 0);
  valid.sort((a, b) => a.index - b.index || b.text.length - a.text.length);
  // Two patterns can match the same characters.
  const out: typeof valid = [];
  for (const d of valid) {
    const last = out[out.length - 1];
    if (!last || d.index >= last.index + last.text.length) out.push(d);
  }
  return out;
}

/** The first full date in a line, as printed. */
export function dateIn(line: string): string | undefined {
  return datesInLine(line)[0]?.text;
}

/** A date printed in a line, with the words just before it, which say which date it is. */
interface PrintedDate {
  text: string;
  label: string;
  /** Which line it was on, so two dates on one line can be told apart from two on different ones. */
  lineIndex: number;
  /** The label was the line above (a header over a row of values), not words beside the date. */
  labelFromAbove: boolean;
}

/**
 * Every date in the document with its label: the words before it on the line, back to the previous
 * date, so "Invoice date: 3 June 2026    Due date: 3 July 2026" gives each its own. A date that
 * starts its line takes a short line above it as its label ("Invoice date" / "3 June 2026") - but
 * only when it is the line's one date. Over a row of several dates the header is a row of labels
 * ("Invoice date  Due date"), and giving all of it to the first date made the due date look like
 * the only date left (30 Sep 2026 review).
 */
function printedDates(lines: readonly string[]): PrintedDate[] {
  const out: PrintedDate[] = [];
  lines.forEach((line, i) => {
    let previousEnd = 0;
    const onLine = datesInLine(line);
    for (const d of onLine) {
      let label = line.slice(previousEnd, d.index).trim();
      let labelFromAbove = false;
      if (!label && d.index === 0 && i > 0 && onLine.length === 1) {
        const above = lines[i - 1]!;
        if (above.length <= 40 && !dateIn(above)) {
          label = above;
          labelFromAbove = true;
        }
      }
      out.push({ text: d.text, label: label.slice(-40), lineIndex: i, labelFromAbove });
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
 * printed, ordered, a statement period - and a phone number, a sort code or an account number,
 * which the numeric date pattern can mistake for a date. Each was once read as the issue date, so
 * an old invoice looked recent because the day it was printed came first (30 Sep 2026 review).
 */
const NOT_ISSUE_LABEL =
  /\b(?:due|paid|payment|deliver\w*|ship\w*|expir\w*|valid|until|birth|received|tested|print\w*|generated|created|order(?:ed)?|po|purchase order|statement|period|tel|telephone|phone|fax|sort code|iban|routing|account (?:no|number))\b/i;

/**
 * The date the document was issued, as candidates. One candidate is an answer. More than one, or
 * `ambiguous`, means the words cannot say which - and the reading then says so rather than picking:
 * the first tier that has any date wins (an "invoice date" label, then any "date" label, then a
 * bare date), unless the survivor is a bare date and a due/paid/printed date sat on its line or
 * was labelled by the header above it. In those layouts ("Invoice date  Due date" over two dates,
 * or the two labels stacked over the two dates) the label that belonged to the survivor was
 * consumed by its neighbour, and the survivor may be the due date.
 */
function issueDateCandidates(dates: readonly PrintedDate[]): {
  dates: string[];
  ambiguous: boolean;
} {
  const excluded = dates.filter((d) => NOT_ISSUE_LABEL.test(d.label));
  const usable = dates.filter((d) => !excluded.includes(d));
  const tiers = [
    usable.filter((d) => ISSUE_LABEL.test(d.label)),
    usable.filter((d) => /\bdate\b/i.test(d.label)),
    usable,
  ];
  const tierIndex = tiers.findIndex((t) => t.length > 0);
  if (tierIndex < 0) return { dates: [], ambiguous: false };
  const tier = tiers[tierIndex]!;
  const distinct = [...new Set(tier.map((d) => d.text))];
  if (tierIndex === 2 && distinct.length === 1) {
    const sharing = excluded.filter(
      (e) => e.labelFromAbove || tier.some((s) => s.lineIndex === e.lineIndex),
    );
    if (sharing.length > 0) {
      const all = [...tier, ...sharing].sort((a, b) => dates.indexOf(a) - dates.indexOf(b));
      return { dates: [...new Set(all.map((d) => d.text))], ambiguous: true };
    }
  }
  return { dates: distinct, ambiguous: false };
}

/**
 * Words that mark a date as the one a narrative field asks about. Specific phrases, not stems: a
 * bare "removed" or "from" matched "Removable wall decal, ordered" and "Printed from SharePoint on",
 * and the first date on the page was then shown as the day a product stopped being sold.
 */
const STOPPED_LABEL =
  /\b(?:(?:sales?|selling|listing|shipping|shipments?)\b.{0,20}\b(?:stopp\w*|ceas\w*|discontinu\w*|suspend\w*|halt\w*)|(?:stopp\w*|ceas\w*|discontinu\w*|suspend\w*|halt\w*)\b.{0,20}\b(?:sales?|selling|shipping|shipments?)|removed from sale|delisted|taken off sale)\b/i;
const EFFECT_LABEL =
  /\b(?:effective(?: date)?|took effect|comes? into (?:effect|force)|in force from|with effect from)\b/i;

const PHONE = /\+?\d[\d\s().-]{6,}\d/;
/** Unicode letters and digits, so an internationalised address ("kontakt@müller.de") is an email. */
const EMAIL = /[\p{L}\p{N}_.+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+/u;
/** A number after "Tel:", "Phone", "Sales" and the like: a phone number at any length. */
const LABELLED_PHONE =
  /\b(?:tel|telephone|phone|ph|mobile|mob|cell|fax|contact|call|sales|office|main|direct|hotline|whatsapp)\b\.?\s*(?:no\b\.?|number|#)?\s*[:.#-]?\s*(\+?\(?\d[\d\s().-]*\d)/i;
/**
 * What sits just before a number when the number is an identifier, not a phone: "Invoice
 * INV-2026-0000123", "Tax ID: 123456789012", "Order 4471". A run of ten or more digits is a phone
 * number in the eyes of `PHONE`, and a supplier block that carries the invoice number under the
 * address would have had it quoted as the supplier's phone.
 */
const ID_BEFORE =
  /(?:invoice|inv|order|po|ref|reference|tax|vat|gst|ein|abn|acn|tin|duns|no|number|id|account|acct|customer|cust|serial|sku|asin|case|#)\b[\s.:#-]*[A-Z]*[\s.:#-]*$/i;
/**
 * A US ZIP+4 ("43219-1234") is nine digits and looks like a phone number, and it sat in the supplier
 * block on the very line of the address, so the address was called missing and the ZIP the phone.
 * It is replaced by a comma, which also stops it joining a number that follows into one long run.
 */
const ZIP_PLUS_4 = /\b\d{5}-\d{4}\b/g;

/**
 * An email address or a phone number in a line. `strict` is for the field that asks for the
 * supplier's phone, where a false "Found" is the costly mistake: an unlabelled run of digits is
 * accepted there only if it starts with "+" or is essentially the whole line. A registration or
 * bank number sits beside its name ("P.IVA 12345678901", "IBAN GB29 NWBK 6016 1331 9268 19",
 * "SIRET 123 456 789 00012") and used to be quoted as the phone.
 */
function contactIn(line: string, strict = false): string | undefined {
  const email = EMAIL.exec(line)?.[0];
  if (email) return email;
  // A short local number is still a number ("Tel: 555-0142"), but a label followed by two digits
  // is not: "Contact 24 Hour Supply" is a name.
  const labelled = LABELLED_PHONE.exec(line)?.[1];
  if (labelled && labelled.replace(/\D/g, "").length >= 6) return labelled.trim();
  const scan = line.replace(ZIP_PLUS_4, ",");
  const found = PHONE.exec(scan);
  if (!found) return undefined;
  const digits = found[0].replace(/\D/g, "").length;
  if (digits < 9 || digits > 15) return undefined;
  if (ID_BEFORE.test(scan.slice(Math.max(0, found.index - 24), found.index))) return undefined;
  if (strict && !found[0].trim().startsWith("+")) {
    const around = `${scan.slice(0, found.index)} ${scan.slice(found.index + found[0].length)}`;
    if (/[A-Za-z]/.test(around.replace(/\b(?:ext|extension|x)\b\.?/gi, ""))) return undefined;
  }
  return found[0].trim();
}

/**
 * A line with its emails, phone numbers and the words that introduced them taken out, so what is
 * left can be judged on its own: "1450 Industrial Parkway, Columbus OH 43219 | Tel: (614) 555-0193"
 * is an address with a phone beside it, not a phone.
 */
function withoutContacts(line: string): string {
  return line
    .replace(ZIP_PLUS_4, ",")
    .replace(new RegExp(EMAIL.source, "gu"), " ")
    .replace(new RegExp(LABELLED_PHONE.source, "gi"), " ")
    .replace(new RegExp(PHONE.source, "g"), " ");
}

/**
 * A fax number is not the number Amazon rings, and it was quoted as the supplier's phone. Removed
 * unless a phone label shares it ("Tel/Fax: 614-555-0193", "Fax / Tel: ...").
 */
const FAX_NUMBER =
  /\bfax\b(?:(?!\b(?:tel|telephone|phone|ph|mobile)\b)\D){0,12}\+?\(?\d[\d\s().-]*\d/gi;
function withoutFaxNumbers(line: string): string {
  return line.replace(FAX_NUMBER, (match, offset: number) =>
    /\b(?:tel|telephone|phone|ph)\b[\s./&,+-]*$/i.test(line.slice(Math.max(0, offset - 20), offset))
      ? match
      : " ",
  );
}

/** Digits that could be a phone number in a format we did not pick out: never "absent" then. */
const DIGIT_RUN = /\p{Nd}[\p{Nd}\s().-]{4,}\p{Nd}/u;
/** A word that says a contact is given on this line, even if we cannot read it as one. */
const CONTACT_WORD = /@|\b(?:e-?mail|tel|telephone|phone|mobile|mob|fax|contact|call)\b/i;
/** An explicit "there is none": "Tel: n/a" is an answer, and the answer is that there is no phone. */
const NO_CONTACT_GIVEN =
  /\b(?:n\/a|n\.a\.?|none|unknown|tbd|on request|not (?:available|provided|given))\b/i;

/** How many letters a line still has once its contact and the words that introduce it are gone. */
function lettersBesideContact(line: string): number {
  return withoutContacts(line)
    .replace(
      /\b(?:tel|telephone|phone|mobile|mob|fax|email|e-mail|contact|call|no|number)\b/gi,
      " ",
    )
    .replace(/[^A-Za-z]/g, "").length;
}

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
  /^(?:invoice|inv|order|po|ref|reference|tax|vat|gst|ein|abn|acn|tin|duns|registration|reg|company (?:no|number|reg)|account|acct|customer|client|page|item|sku|qty)\b/i;

/**
 * A line that is part of an address. A line that also carries an email or a phone number is judged
 * on what is left of it and only by its street words: "1450 Industrial Parkway, Columbus OH 43219
 * | Tel: (614) 555-0193" is an address, and "Tel: 01632 960001 | Fax: 01632 960002" is not (its
 * five-digit runs are not ZIP codes).
 */
function isAddress(line: string): boolean {
  if (dateIn(line) || NUMBER_LABEL.test(line)) return false;
  const carriesContact = contactIn(line) !== undefined;
  const text = carriesContact ? withoutContacts(line) : line;
  const digits = /\d/.test(text);
  const comma = text.includes(",");
  if ((STREET.test(text) && digits) || (STREET_WEAK.test(text) && digits && comma)) return true;
  if (carriesContact) return false;
  return (
    (POSTCODE.test(line) && /[A-Za-z]{2}/.test(line)) ||
    (POSTCODE6.test(line) && comma && /[A-Za-z]{3}/.test(line))
  );
}

/**
 * A line that is a street address in its own right, as opposed to a city and a postcode. "Columbus,
 * OH 43219" alone is not where a supplier can be visited, and was shown as "Found" for the physical
 * address. A post-office box is a mailing address, not a physical one.
 */
function streetLine(line: string): boolean {
  if (dateIn(line) || NUMBER_LABEL.test(line)) return false;
  const text = contactIn(line) !== undefined ? withoutContacts(line) : line;
  if (/\bp\.?\s?o\.?\s?box\b/i.test(text)) return false;
  const digits = /\d/.test(text);
  return (
    (STREET.test(text) && digits) ||
    (STREET_WEAK.test(text) && digits && text.includes(",")) ||
    /^\d+[A-Za-z]?\s+[A-Za-z]/.test(text)
  );
}

/**
 * The quantity as printed: a table row that ends "<quantity> <unit price> <amount>", which may
 * start its line (a row split across lines: description, then "40 $6.20 $248.00"); failing that a
 * labelled quantity. Not on an address line: "Unit 12" in an address matched "unit" plus a number
 * and was quoted as the quantity (30 Sep 2026).
 */
function quantityIn(lines: readonly string[]): string | undefined {
  const rows = lines.filter((l) =>
    /(?:^|\s)\d[\d,]*\s+[$£€]?\s?\d[\d,]*\.\d{2}\s+[$£€]?\s?\d[\d,]*\.\d{2}\s*$/.test(l),
  );
  if (rows.length > 0) return rows.join("; ");
  return lines
    .filter((l) => !isAddress(l))
    .map((l) => /\b(?:qty|quantity|units?|pcs|pieces)\b[\s.:#]*(\d[\d,]*)/i.exec(l)?.[0])
    .find(Boolean);
}

/** A line about a company, a tax or a bank number: not about a complaint, whatever else it says. */
const NOT_A_COMPLAINT_LINE =
  /\b(?:vat|tax|ust|gst|company|registration|ein|abn|duns|iban|swift|routing|account)\b/i;

const ASIN = /\bB0[A-Z0-9]{8}\b/g;
/** OCR often reads the zero in "B0" as the letter O; an ASIN never has an O there. */
const ASIN_OCR = /\bB[0O][A-Z0-9]{8}\b/g;
/** A supplier's own code is labelled as one, and can be shaped like an ASIN ("SKU: B0805KN01A"). */
const OWN_CODE_LABEL = /(?:SKU|ITEM\s*#?|PART\s*(?:NO\.?|NUMBER|#)|MODEL|MPN)[\s:#.-]*$/;
function asinsIn(text: string, source: TextSource): string[] {
  const upper = text.toUpperCase();
  const labelledAsOwnCode = (index: number) =>
    OWN_CODE_LABEL.test(upper.slice(Math.max(0, index - 14), index));
  if (source !== "ocr") {
    return [
      ...new Set(
        [...upper.matchAll(ASIN)].filter((m) => !labelledAsOwnCode(m.index)).map((m) => m[0]),
      ),
    ];
  }
  const found: string[] = [];
  for (const m of upper.matchAll(ASIN_OCR)) {
    if (labelledAsOwnCode(m.index)) continue;
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
  new RegExp(`^(?:${words})\\b(?:\\s*\\([^)]*\\))?\\s*[.|]?\\s*(?::\\s*(.*))?$`, "i");
/** Where the supplier is named. "Remit to" is a payment address and only ends a block. */
const SUPPLIER_START_WORDS = "from|supplier|seller|vendor|sold by|issued by|bill from|manufacturer";
const SUPPLIER_WORDS = `${SUPPLIER_START_WORDS}|remit to|payable to`;
/**
 * Who is billed. A ship-to block is where goods go, which is not always who is billed. The forms
 * an invoice actually writes: "Bill-To", "Billed to", "Billing address", "Invoice address",
 * "Customer details", "Purchaser" - each ended nothing when it was missing here, and the buyer's
 * address and phone were read as the supplier's.
 */
const BUYER_WORDS =
  "bill(?:ed)?[\\s-]to(?: party)?|buyer|sold[\\s-]to|customer|invoice(?:d)?[\\s-]to|billing(?: address| details)|invoice address|customer details|client|applicant|importer|account holder|purchaser";
const SHIP_WORDS =
  "ship(?:ped)?[\\s-]to|deliver(?:ed)?[\\s-]to|(?:shipping|delivery) (?:address|details)|consignee";
const SUPPLIER_LABEL = labelled(SUPPLIER_WORDS);
/** Starts a supplier block; unlike SUPPLIER_LABEL, not "remit to", whose address is not the supplier's. */
const SUPPLIER_START = labelled(SUPPLIER_START_WORDS);
/** A bare "To" is the other half of a "From" / "To" pair of headers. */
const BUYER_LABEL = labelled(`${BUYER_WORDS}|to`);
const SHIP_LABEL = labelled(SHIP_WORDS);
/** Ends a block without being a buyer or a supplier: a person's name follows it. */
const ORDERED_BY_LABEL = labelled("ordered by");
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
  "The supplier and the buyer sit next to each other in this document, and we cannot tell reliably where one ends and the other begins, so we have not tried to separate them. Check both on the original.";
/**
 * The header of the line-item table: two of its column words. "Description  Price  Total" has no
 * "qty" or "amount", so it once passed as ordinary text and the table's rows ("Floor Mat 60x90 cm
 * 5.00 100.00", which has "floor" and a number) were read as the supplier's address.
 */
function isTableHeader(line: string): boolean {
  const words = line.match(
    /\b(?:qty|quantity|description|unit price|amount|item|price|rate|total|cost|sku|hsn|particulars)\b/gi,
  );
  return new Set((words ?? []).map((w) => w.toLowerCase())).size >= 2;
}

/** A line that ends in a price ("Floor Mat 60x90 cm 5.00 100.00"): a table row, not a block's text. */
const ENDS_IN_MONEY = /\d[\d,]*\.\d{2}\s*$/;

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
      ORDERED_BY_LABEL.test(line) ||
      isTableHeader(line) ||
      ENDS_IN_MONEY.test(line)
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
/**
 * Management-system and laboratory-competence standards (quality, environment, safety at work,
 * "ISO/IEC 17025" for the test house itself) are not a product's test. ISO/IEC 17025 was quoted as
 * "the standard it was tested against" on a report that named the real one two lines away.
 */
const MANAGEMENT_STANDARD =
  /\bISO(?:\/IEC)?\s?(?:9000|9001|14001|17020|17021|17025|17065|22000|26000|27001|31000|45001|50001|13485|8601|3834)\b/i;
/** The first standard a product could be tested against in a line, leaving out ISO 9001 and kin. */
function standardIn(line: string): string | undefined {
  return [...line.matchAll(STANDARD)].map((m) => m[0]).find((s) => !MANAGEMENT_STANDARD.test(s));
}
/** Words that say a standard is what a product was tested to, or complies with. */
const TESTED_TO =
  /\b(?:tested|complies|complied|compliance|conforms?|conformity|standard|accordance|according|meets|requirements?)\b/i;

/**
 * Words that make a line an assurance, a placeholder or a denial rather than a record: a promise
 * ("we assure you"), an offer to provide it later, a blank, a denial. A line that carries one is
 * never "Found"; it is quoted as a pointer. The disqualifier the evidence matrix names for a test
 * report is "a supplier's own assurance with no test document behind it", and the first version of
 * this reading called that "Found" (30 Sep 2026 review). "No" followed by an identifier is not a
 * denial ("Report No. 1042", "Report No.: TR-2026-0142"), but "Test report: No" is.
 */
const HEDGE =
  /\b(?:not|no(?![.:#]?\s*\d)(?![.:#]+\s*[A-Za-z0-9/-]*\d)|none|never|without|n\/a|n\.a|missing|unavailable|unknown|tbd|tbc|to be (?:confirmed|provided|completed|announced)|to follow|coming soon|being prepared|draft|sample|specimen|template|example|revoked|invalid|superseded|expired|pending|on request|upon request|if (?:required|requested|needed)|can be (?:provided|supplied)|will (?:be )?(?:provided|supplied)|assure[ds]?|assurance|on[- ]site|in[- ]house|own lab(?:oratory)?)\b/i;
/** A blank or a form field: "Laboratory: ______", "[name of laboratory]", "fill in". */
const PLACEHOLDER = /_{2,}|\[[^\]]*\]|\bfill in\b/i;
/**
 * For a test report, its laboratory and its standard: words that turn the record into an offer, a
 * request, a demand or a claim about it - "Please provide a test report", "Test report available
 * for download", "We can send the test report", "Every batch is supplied with a test report".
 * Kept out of the base list because a retraction letter's natural wording ("has been withdrawn",
 * "please withdraw the complaint") contains several of them.
 */
const RECORD_HEDGE =
  /\b(?:claims?|withdrawn|cancell?ed|void|please|provide|submit|attach|available|send|sent|share|forward|(?:is|are|will be) required|must|should|needs?|supplied with|comes? with|provided with|included|each batch|every batch|requested)\b/i;
/**
 * For a retraction and an authorization: a demand, a refusal, a promise or a condition instead of
 * the act - "Please withdraw your listing", "We reserve the right to withdraw this letter", "We
 * will retract the complaint once you sign", "We refuse to retract".
 */
const DEMAND =
  /\b(?:please|must|should|refuse[ds]?|declin\w+|unable|unwilling|reserve[ds]?|right to|may|might|would|will|if|once|until|unless|demand\w*|subject to)\b/i;

/** A line short and plain enough to be the record itself rather than a sentence about it. */
const isClean = (line: string, extra?: RegExp) =>
  line.length <= 140 &&
  !HEDGE.test(line) &&
  !PLACEHOLDER.test(line) &&
  !(extra && extra.test(line));

/**
 * Generic words around a party's name: what is left of "Testing laboratory: ______" once the
 * qualifiers are gone is nothing, so it names no one. "Issuing laboratory:" and a bare
 * "Laboratory" or "Rights owner:" are labels, not answers.
 */
const PARTY_QUALIFIERS =
  /\b(?:testing|test|issuing|accredited|independent|third[- ]party|certified|the|our|name|of|number|no|laborator(?:y|ies)|lab|house|cent(?:re|er)|certification|notified|body|rights?|owner|trademark|brand|is|are|by)\b/gi;
function namesAParty(line: string, phrase: RegExp): boolean {
  const remainder = line
    .replace(new RegExp(phrase.source, "gi"), " ")
    .replace(PARTY_QUALIFIERS, " ");
  return /[\p{L}\p{N}]{2,}/u.test(remainder);
}

interface KeywordField {
  field: RegExp;
  /** A phrase that names the record itself. */
  strong?: RegExp;
  /** A word that only sits near the answer. */
  weak?: RegExp;
  /** The strong phrase counts only on a `isClean` line (with `hedge` added, if given). */
  clean?: boolean;
  hedge?: RegExp;
  /** The strong phrase names a party (a laboratory, a rights owner): a bare label is a pointer. */
  namesParty?: boolean;
  /** At least this many distinct Amazon order numbers before "Found" (one is a pointer). */
  minOrders?: number;
}

/**
 * Fields answered by a keyword. `strong` is a phrase that names the record itself ("test report",
 * a laboratory, an Amazon order number), and its first line is quoted as found. `weak` is a word
 * that only sits near the answer ("returned", "model", "dispose"): a line that mentions it is
 * quoted as a pointer and the field stays "not checked", because "Return address" and "Disposable
 * gloves" both matched and were shown as a green "Found" (30 Sep 2026 review). A field that is a
 * narrative ("how each complaint was resolved") has only `weak`.
 *
 * `clean` means the strong phrase counts only on a line that is plainly the record: short, and with
 * no promise, denial, blank or "on request" in it (`isClean`). "A certificate of compliance is
 * available on request" names the record and is the opposite of having it. A line that names the
 * record but is not clean is quoted as a pointer.
 *
 * The second review (same day) found the strong phrases too loose for four fields: "Retractable
 * dog leash" and "Right of withdrawal" were a retraction; "Every batch is supplied with a test
 * report" was one; "Become an authorized distributor today!" was an authorization; "Fast shipment
 * worldwide!" was a shipping record. They now name the act or the record, not a stem.
 */
const KEYWORD_FIELDS: ReadonlyArray<KeywordField> = [
  {
    field: /\btest report or compliance certificate\b/i,
    strong:
      /\b(?:test report|certificate of (?:compliance|conformity)|compliance certificate|conformity certificate)\b/i,
    clean: true,
    hedge: RECORD_HEDGE,
  },
  {
    field: /\bissuing laboratory\b/i,
    strong:
      /\b(?:laborator(?:y|ies)|test(?:ing)? (?:lab|house|cent(?:re|er))|certification body|notified body)\b/i,
    clean: true,
    hedge: RECORD_HEDGE,
    namesParty: true,
  },
  {
    // A letter or a licence. The bare word is everywhere ("returns need prior authorization",
    // "authorized staff may sign"), and "authorized distributor" is what marketing pages say, so
    // both only point.
    field: /\bauthori[sz]|\blicen[cs]e\b|\bbrand letter\b/i,
    strong:
      /\b(?:letter of authori[sz]ation|authori[sz]ation letter|authori[sz]ation to (?:sell|distribute|resell)|licen[cs]e (?:agreement|to sell))\b/i,
    weak: /\b(?:authori[sz](?:e[ds]?|ation)|licen[cs]e[ds]?)\b/i,
    clean: true,
    hedge: DEMAND,
  },
  {
    field: /\brights-owner name\b/i,
    strong:
      /\b(?:rights? owner|trademark owner|brand owner)\b|\bowner of (?:the |United States |U\.?S\.? |EU |European Union )?(?:trademark|brand)/i,
    clean: true,
    namesParty: true,
  },
  {
    // The act, aimed at the complaint: not a stem, which found "Retractable dog leash".
    field: /\bretraction\b/i,
    strong:
      /\b(?:withdraw|retract)\w* (?:our|the|this|my|all|any) (?:complaint|claim|notice|report|allegation)|\b(?:we|i)\b.{0,40}\b(?:withdraw|retract)\w*\b.{0,40}\b(?:complaint|claim|notice|report|allegation)|\b(?:complaint|claim|notice|allegation)\b.{0,40}\b(?:withdrawn|retracted)\b|\bretraction of (?:the |our |this )?(?:complaint|claim|notice)/i,
    clean: true,
    hedge: DEMAND,
  },
  {
    field: /\border or sales report\b|\bexport of the individual orders\b/i,
    // Amazon's order number, or the front of one that wrapped onto the next line. One number is
    // not a report: a customer's order confirmation has one.
    strong: /\b\d{3}-\d{7}-(?:\d{7}\b|$)|\b(?:amazon-)?order[- ]id\b/i,
    weak: /\b(?:orders?|sales) (?:report|log|export)\b|\borders? and\b.{0,40}\blog\b/i,
    minOrders: 2,
  },
  {
    field: /\bcomplaint, return or claim\b/i,
    weak: /\b(?:complaints?|returns?|returned|refunds?|refunded|claims?)\b/i,
  },
  {
    field: /\bpurchase orders or shipping records\b/i,
    strong:
      /\b(?:purchase order|P\.?O\.? ?(?:no|number|#)|bill of lading|waybill|packing slip|tracking (?:no|number)|shipment (?:id|no|number|date))\b/i,
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
    !NOT_A_NAME.test(line) &&
    // A header that stands alone is a label, not a name: "To" over the buyer's column was quoted
    // as the supplier's name.
    !SUPPLIER_LABEL.test(line) &&
    !BUYER_LABEL.test(line) &&
    !SHIP_LABEL.test(line)
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
    const issued = issueDateCandidates(dates);
    if (issued.dates.length === 0)
      return notChecked(
        field,
        "Every date we found is marked as something other than when the document was issued (due, paid, printed and the like). Check the issue date on the original.",
      );
    // More than one candidate and nothing to choose between them: say so, do not pick the first.
    if (issued.dates.length > 1 || issued.ambiguous)
      return {
        field,
        status: "unclear",
        observed: clip(issued.dates.join(", ")),
        note: "We found more than one date and could not tell which is when the document was issued. Check the issue date on the original.",
      };
    return present(
      field,
      issued.dates[0]!,
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
    if (found.length === 0)
      return notChecked(
        field,
        "We found no ASIN in the text we read. Check each line is the product Amazon named.",
      );
    // "The affected ASIN(s) and quantity" asks for two things. The ASIN alone was reported as the
    // whole answer, with the quantity never read - and a record of destruction "without a date or a
    // quantity" is exactly what the evidence matrix names as a disqualifier.
    if (/\bquantity\b/i.test(field) && !quantityIn(lines))
      return {
        field,
        status: "unclear",
        observed: found.join(", "),
        note: "An ASIN is printed, but we could not find a quantity, and this record needs both. Check the document.",
      };
    return present(field, found.join(", "), "The ASINs printed in the document.");
  }

  if (comparison?.kind === "reference_id") {
    // Every number on a line that names a complaint, case or notice, not the first such line:
    // "Our reference: 90210123456" before "Complaint ID 11223344556" made a correct ID a conflict.
    // A bare "ref" is not a label (it is the sender's own reference), and a line about a company,
    // tax or bank number is not about a complaint at all. A number that is part of a longer code
    // ("556677-8899", "RL-2026-000481", "DE123456789") is not an ID, nor is one after "tel" or
    // "fax". `compareReferenceIds` matches the notice's IDs against all that remain.
    const ids = new Set<string>();
    for (const line of lines) {
      if (!/\b(?:complaint|case|notice|report|claim|ticket|id)\b/i.test(line)) continue;
      if (NOT_A_COMPLAINT_LINE.test(line)) continue;
      for (const m of line.matchAll(/\d{6,15}/g)) {
        const before = line[m.index - 1] ?? " ";
        const after = line[m.index + m[0].length] ?? " ";
        if (/[\w-]/.test(before) || /[\w-]/.test(after)) continue;
        // "call +49 30 1234567": the number follows a phone word within a few words.
        if (
          /\b(?:tel|phone|fax|mobile|cell|call|contact)\b[^.\n]{0,30}$/i.test(
            line.slice(0, m.index),
          )
        )
          continue;
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
    const section = sectionAfter(lines, SUPPLIER_START);
    const name = section?.lines.find(looksLikeName);
    if (name) return present(field, name, "Read from the supplier section of the document.");
    const listed = ctx.suppliers?.find((s) => lines.some((l) => includesLoosely(l, s)));
    const line = listed ? lines.find((l) => includesLoosely(l, listed)) : undefined;
    return line
      ? present(field, line, "A supplier you listed, found in the text we read.")
      : notChecked(field, NO_SUPPLIER_SECTION);
  }

  if (comparison?.kind === "units_sold") {
    const quoted = quantityIn(lines);
    return quoted
      ? present(field, quoted, FOUND)
      : notChecked(
          field,
          "We could not pick out the quantity in the text we read. Check it on the original.",
        );
  }

  if (/\bsupplier\b.*\baddress\b/i.test(field)) {
    const section = sectionAfter(lines, SUPPLIER_START);
    if (!section) return notChecked(field, NO_SUPPLIER_SECTION);
    // A street line, or the city-and-postcode line directly under one. A city and postcode alone
    // ("Columbus, OH 43219"), or a post-office box, is not where a supplier can be visited, and was
    // shown as "Found" for the physical address.
    const address = section.lines.filter(
      (l, i) => streetLine(l) || (isAddress(l) && i > 0 && streetLine(section.lines[i - 1]!)),
    );
    if (address.length > 0)
      return present(field, address.join(", "), "Read from the supplier section of the document.");
    // "Not found" only when nothing left in the section could be an address: the name, the phone
    // and email and a note such as "(no address given)" are set aside first. Anything else may be
    // an address in a form we do not recognise (a Shenzhen block and park, "Via Roma 12"), and
    // saying it is absent beside the very line that holds it was wrong (30 Sep 2026 review). A line
    // that is a phone number and something more ("Warehouse annex, gate C  Tel: 555-0142") stays.
    const name = section.lines.find(looksLikeName);
    const rest = section.lines.filter(
      (l) =>
        l !== name &&
        !/^\(.*\)$/.test(l) &&
        !(contactIn(l) !== undefined && lettersBesideContact(l) < 3),
    );
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
    const section = sectionAfter(lines, SUPPLIER_START);
    if (!section) return notChecked(field, NO_SUPPLIER_SECTION);
    // Strict: an unlabelled run of digits beside words is a registration or bank number, not a
    // phone. A fax number is set aside unless a phone label shares it.
    const contact = section.lines.map((l) => contactIn(withoutFaxNumbers(l), true)).find(Boolean);
    if (contact) return present(field, contact, "Read from the supplier section of the document.");
    // Nothing read as a phone or an email. A number in another script, an email broken over two
    // lines, a registration number or a fax alone may still be the contact, and a block cut short
    // may hold one further down: none of those is "absent". An explicit "Tel: n/a" is an answer.
    const answered = (l: string) => !NO_CONTACT_GIVEN.test(l);
    const numberUnsure = section.lines.some(
      (l) => answered(l) && DIGIT_RUN.test(l) && !isAddress(l),
    );
    const contactUnsure = section.lines.some(
      (l) => answered(l) && CONTACT_WORD.test(l) && !isAddress(l),
    );
    if (numberUnsure || contactUnsure || !section.complete)
      return {
        field,
        status: "unclear",
        observed: clip(section.lines.join(", ")),
        note: numberUnsure
          ? "We could not tell whether a number in the supplier section is a phone number. Check it on the original."
          : contactUnsure
            ? "The supplier section has a contact line we could not read as a phone number or an email address. Check it on the original."
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
      withStandard.find((l) => isClean(l, RECORD_HEDGE) && TESTED_TO.test(l)) ??
      withStandard.find((l) => isClean(l, RECORD_HEDGE));
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
    // One Amazon order number is a customer's order confirmation; a report has several.
    const ordersEnough =
      !keyword.minOrders ||
      new Set(lines.flatMap((l) => l.match(/\b\d{3}-\d{7}-/g) ?? [])).size >= keyword.minOrders ||
      named.some((l) => /\border[- ]id\b/i.test(l));
    const strong = ordersEnough
      ? named.find(
          (l) =>
            (!keyword.clean || isClean(l, keyword.hedge)) &&
            (!keyword.namesParty || namesAParty(l, keyword.strong!)),
        )
      : undefined;
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
 * Headings that name a document which is not an invoice for goods already bought: a quotation, a
 * pro-forma, a credit note, an order. Amazon asks for a completed invoice, and the matrix names
 * "quotations or proforma" as a disqualifier; every one of these read exactly like an invoice
 * (name, address, date, ASIN and buyer all "Found") because nothing looked at what the document
 * is. Found in the first lines only: a line elsewhere that says "quotation" is body text.
 */
const NOT_AN_INVOICE_HEADING =
  /\b(?:pro[- ]?forma|quotation|quote|estimate|credit note|debit note|purchase order|order confirmation|sales order|packing slip|delivery note|delivery order|remittance advice|statement of account)\b/i;

/**
 * A pointer, never a verdict: the heading is quoted, the seller is asked to check it is a final
 * invoice, and nothing says the document is or is not one. Only for the supplier-invoice list.
 */
function documentTypeFinding(
  fields: readonly string[],
  lines: readonly string[],
): FieldFinding | undefined {
  if (!fields.some((f) => /\bsupplier business name\b|\bissue date\b/i.test(f))) return undefined;
  const heading = lines.slice(0, 8).find((l) => l.length <= 60 && NOT_AN_INVOICE_HEADING.test(l));
  if (!heading) return undefined;
  return {
    field: "what kind of document this is",
    status: "unclear",
    observed: clip(heading),
    note: "The heading reads as something other than an invoice for goods already bought. Amazon asks for a completed invoice, so check this is a final invoice and not a quotation, an order or a credit note.",
  };
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
  const findings = fields.map((field) => readField(field, lines, lines.join("\n"), ctx, source));
  const kind = documentTypeFinding(fields, lines);
  return kind ? [...findings, kind] : findings;
}

/** Too little text to read anything from: a scan with no text layer, or a blank page. */
export function hasReadableText(text: string): boolean {
  return wordCount(text) >= 5;
}

/** Words of three letters or more: what "readable" is counted in. */
export function wordCount(text: string): number {
  return (text.match(/[A-Za-z]{3,}/g) ?? []).length;
}
