/**
 * The case data a document check can be compared with, read from the seller's own notice text.
 *
 * Added 24 Sep 2026 (ChatGPT audit item H). The checker was asked whether an invoice's line items
 * matched "the ASIN(s)" and whether a retraction letter cited "the complaint ID", and was never told
 * either. These are the identifiers Amazon itself put in the notice, so they are the only honest
 * thing to compare a document against.
 *
 * Every request on the case is read, not only the current one: Amazon's reply to a first appeal
 * rarely repeats the ASIN the original notice named, and a check run after that reply must still be
 * able to match it.
 */

import { extractEntities, entitiesOfKind } from "@/core/entities";
import { parseNotice } from "@/core/noticeParser";
import type { CaseFacts, Workspace } from "@/core/workspace";

/** "Complaint ID: 1234567890" — the identifier rights-owner notices cite. */
const COMPLAINT_ID = /\bcomplaint(?:\s*(?:id|number|no\.?|#))?\s*[:#]?\s*(\d{6,15})\b/gi;

export interface DocumentCheckCaseData {
  asins: string[];
  referenceIds: string[];
  /** The seller's own statement of their registered business details (`Workspace.caseFacts`). */
  business?: { name?: string; address?: string };
  suppliers?: string[];
  /**
   * The date of Amazon's notice (YYYY-MM-DD), read from its own header. A record's age is counted
   * back from this date, not from the day the seller checks it. Absent when the notice carries no
   * date, in which case the window is counted from today and the finding says so. Never sent to the
   * server: the check is re-anchored here, in the browser, after the reading comes back.
   */
  noticeDate?: string;
}

/**
 * The date of the notice a check should count from: the current request's own header date, else the
 * most recent earlier request that has one. Read by the same parser the deadlines use, so the two
 * can never disagree about which day the notice was received.
 */
export function noticeDateFrom(texts: readonly string[]): string | undefined {
  for (const text of texts) {
    if (!text?.trim()) continue;
    const day = parseNotice(text).receivedOn;
    if (day) return day;
  }
  return undefined;
}

export function checkCaseDataFrom(texts: readonly string[]): DocumentCheckCaseData {
  const asins = new Set<string>();
  const referenceIds = new Set<string>();
  for (const text of texts) {
    if (!text) continue;
    const entities = extractEntities(text);
    for (const e of entitiesOfKind(entities, "asin")) asins.add(e.value.toUpperCase());
    for (const e of entitiesOfKind(entities, "case_id")) referenceIds.add(e.value);
    for (const m of text.matchAll(COMPLAINT_ID)) referenceIds.add(m[1]!);
  }
  // Capped to what the API accepts, so a notice listing dozens of ASINs still gets a check.
  return { asins: [...asins].slice(0, 20), referenceIds: [...referenceIds].slice(0, 20) };
}

/**
 * The business details the seller stated, in the shape a check sends. Only what they actually
 * entered: an empty field is left out rather than sent blank, so the server can tell "not stated"
 * from "stated as nothing".
 */
export function caseFactsForCheck(
  facts: CaseFacts | undefined,
): Pick<DocumentCheckCaseData, "business" | "suppliers"> {
  if (!facts) return {};
  const name = facts.businessName?.trim();
  const address = facts.businessAddress?.trim();
  const suppliers = (facts.suppliers ?? [])
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
  return {
    ...(name || address
      ? { business: { ...(name ? { name } : {}), ...(address ? { address } : {}) } }
      : {}),
    ...(suppliers.length > 0 ? { suppliers } : {}),
  };
}

/**
 * Everything a check on this case is compared with: the identifiers from every request Amazon has
 * sent on it, and the business details the seller stated. One function, so the check that runs and
 * the test for whether a saved check is still current can never read the case differently.
 */
export function checkCaseDataForWorkspace(ws: Workspace): DocumentCheckCaseData {
  const noticeDate = noticeDateFrom([
    ws.notice,
    ...[...ws.previousRequests].reverse().map((p) => p.notice),
  ]);
  return {
    ...checkCaseDataFrom([
      ws.notice,
      ws.formInstructions,
      ...ws.previousRequests.flatMap((p) => [p.notice, p.formInstructions]),
    ]),
    ...caseFactsForCheck(ws.caseFacts),
    ...(noticeDate ? { noticeDate } : {}),
  };
}
