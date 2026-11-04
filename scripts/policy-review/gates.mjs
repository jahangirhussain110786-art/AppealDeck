/**
 * The deterministic half of the AI review (4 Nov 2026).
 *
 * The model's answer is not trusted; it is checked. Every rule below exists because the failure it
 * catches is one a reader cannot see: a quote the source never contained, a fee figure the model
 * remembered from training data, a claim that Amazon changed a rule when the item was a corporate
 * announcement. A proposal that fails any check is still written down, with the failures printed —
 * a rejected answer is information, and silently discarding it hides a model that has drifted.
 *
 * Nothing here writes to `src/`. The output is a dated proposal a person reads and applies.
 */

/** One phrase may not exceed this many words. Amazon's wording is theirs. */
export const MAX_QUOTE_WORDS = 20;
/** The whole proposal may not exceed this many quoted words. */
export const MAX_QUOTE_TOTAL_WORDS = 40;
/** Below this the proposal is written but marked for a careful read rather than "ready". */
export const READY_CONFIDENCE = 0.8;

export const CATEGORIES = [
  "fee",
  "policy",
  "enforcement",
  "api",
  "listing",
  "program",
  "corporate",
  "marketing",
  "unknown",
];

/** Where a change can land. `none` means it changes nothing a seller reads. */
export const AREAS = ["policy_brief", "playbook", "fees", "api", "none"];

export function wordCount(value) {
  return String(value).trim().split(/\s+/).filter(Boolean).length;
}

export function normaliseForMatch(value) {
  return String(value)
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Numbers the model must not have invented. Dates are excluded on purpose (a report is full of
 * them); a currency amount or a percentage is not a thing to guess about in a product that tells a
 * seller what a fee is.
 */
export function numericClaims(text) {
  const matches = String(text).match(/(?:[$£€]\s?\d[\d,.]*)|(?:\d[\d,.]*\s?%)/g) ?? [];
  return [...new Set(matches.map((value) => normaliseForMatch(value).replace(/\s+/g, "")))];
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

/**
 * @param {unknown} proposal parsed model answer
 * @param {{ reportText: string, reportUrls: string[] }} context what the model was allowed to see
 */
export function validateProposal(proposal, { reportText, reportUrls }) {
  const errors = [];
  const warnings = [];

  if (!proposal || typeof proposal !== "object" || Array.isArray(proposal)) {
    return { ok: false, status: "invalid", errors: ["the answer was not a JSON object"], warnings };
  }
  const answer = proposal;

  if (typeof answer.relevant !== "boolean") errors.push("relevant must be true or false");

  const confidence = Number(answer.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    errors.push("confidence must be a number from 0 to 1");
  }

  if (!CATEGORIES.includes(answer.category)) {
    errors.push(`category must be one of: ${CATEGORIES.join(", ")}`);
  }

  const whatChanged = typeof answer.what_changed === "string" ? answer.what_changed.trim() : "";
  if (answer.relevant === true && whatChanged.length < 10) {
    errors.push("what_changed must state the change in one sentence");
  }
  if (whatChanged.length > 600) errors.push("what_changed is longer than 600 characters");

  if (answer.seller_impact !== undefined && typeof answer.seller_impact !== "string") {
    errors.push("seller_impact must be a string");
  }

  if (!isStringArray(answer.areas) || answer.areas.some((area) => !AREAS.includes(area))) {
    errors.push(`areas must be a list drawn from: ${AREAS.join(", ")}`);
  } else if (answer.relevant === true && answer.areas.length === 0) {
    errors.push("a relevant change must name at least one area");
  }

  const sources = isStringArray(answer.sources) ? answer.sources : [];
  if (answer.relevant === true && sources.length === 0) {
    errors.push("a relevant change must cite at least one source from the report");
  }
  for (const source of sources) {
    if (!reportUrls.includes(source)) {
      errors.push(`source is not in today's report: ${source}`);
    }
  }

  const quoted = isStringArray(answer.quoted) ? answer.quoted : [];
  let totalWords = 0;
  const haystack = normaliseForMatch(reportText);
  for (const phrase of quoted) {
    const words = wordCount(phrase);
    totalWords += words;
    if (words > MAX_QUOTE_WORDS) {
      errors.push(`a quoted phrase is ${words} words (limit ${MAX_QUOTE_WORDS})`);
    }
    if (!haystack.includes(normaliseForMatch(phrase))) {
      // The strongest check here: an invented quote cannot fake being in the document.
      errors.push(`a quoted phrase does not appear in the report: "${phrase.slice(0, 60)}"`);
    }
  }
  if (totalWords > MAX_QUOTE_TOTAL_WORDS) {
    errors.push(
      `the proposal quotes ${totalWords} words in total (limit ${MAX_QUOTE_TOTAL_WORDS})`,
    );
  }

  for (const claim of numericClaims(`${whatChanged} ${answer.seller_impact ?? ""}`)) {
    if (!haystack.replace(/\s+/g, "").includes(claim)) {
      errors.push(`a figure in the proposal is not in the report: ${claim}`);
    }
  }

  if (typeof answer.next_check !== "string" || answer.next_check.trim().length < 3) {
    warnings.push("no next_check was given; a person still has to know what to verify");
  }

  if (errors.length) return { ok: false, status: "invalid", errors, warnings };

  if (answer.relevant !== true) {
    return { ok: true, status: "not-relevant", errors, warnings };
  }

  return {
    ok: true,
    status: confidence >= READY_CONFIDENCE ? "ready" : "needs-review",
    errors,
    warnings,
  };
}
