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
import type { CaseFacts, Workspace } from "@/core/workspace";

/** "Complaint ID: 1234567890" — the identifier rights-owner notices cite. */
const COMPLAINT_ID = /\bcomplaint(?:\s*(?:id|number|no\.?|#))?\s*[:#]?\s*(\d{6,15})\b/gi;

export interface DocumentCheckCaseData {
  asins: string[];
  referenceIds: string[];
  /** The seller's own statement of their registered business details (`Workspace.caseFacts`). */
  business?: { name?: string; address?: string };
  suppliers?: string[];
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
  return {
    ...checkCaseDataFrom([
      ws.notice,
      ws.formInstructions,
      ...ws.previousRequests.flatMap((p) => [p.notice, p.formInstructions]),
    ]),
    ...caseFactsForCheck(ws.caseFacts),
  };
}
