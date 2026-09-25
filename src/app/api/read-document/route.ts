/**
 * AA-41 (AM-26): the product reads the seller's uploaded document.
 *
 * Founder direction, 22 Sep 2026: _"we are not selling the vault, we are selling solution... to
 * help them we need to read their files, we need to get help via API AI, wherever needed."_
 *
 * TWO THINGS THIS ROUTE WILL NOT DO, both deliberate:
 *
 * 1. **It will not accept an identity document.** Passports, national ID cards, driving licences
 *    and bank statements are refused here and checked in the browser instead
 *    (`src/lib/documentChecks/identity.ts`). The reason is liability, not ethics: the founder is
 *    personally liable as an individual in Pakistan, and a breach of a thousand invoices and a
 *    breach of a thousand passports are not the same event. Nobody needs a language model to tell
 *    a seller their passport photo is blurry. This is the AI assistant's recommendation under
 *    AM-26 / AA-41, adopted because the founder said to proceed without ruling on it — it is one
 *    constant away from server-side handling if they decide otherwise.
 * 2. **It will not store the document.** The bytes exist for the duration of one request. There is
 *    no upload table, no bucket, and no `sent_at` row — nothing here writes the document anywhere.
 *
 * Disclosure for both lives in `src/content/legal.ts`, updated in the same commit (AA-43).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser, unauthorizedJsonResponse } from "@/lib/auth";
import { claimCasePass, isLicenseActive } from "@/lib/license";
import { CaseIdSchema } from "@/lib/caseSchema";
import { rateLimitDocumentRead, tooManyRequestsResponse } from "@/lib/ratelimit";
import { callGemini, withGeminiBreaker } from "@/lib/llm/gemini";
import { VIOLATION_KINDS } from "@/core/violationKinds";
import {
  buildDocumentCheck,
  requirementForCheck,
  comparisonFor,
  type FieldFinding,
} from "@/core/documentCheck";
import type { EvidenceKind } from "@/core/evidenceModel";
import { MAX_CHECK_BASE64_CHARS } from "@/lib/documentChecks/limits";

export const dynamic = "force-dynamic";

/**
 * Handled in the browser, never sent here. Kept as data rather than a comment so the refusal is
 * testable and cannot drift away from the client's routing.
 */
export const BROWSER_ONLY_EVIDENCE_KINDS = ["identity_doc", "financial_instrument_doc"] as const;

/**
 * The catch-all kind, refused here — added 23 Sep 2026, and the reason is worth stating plainly.
 *
 * This route's header said the client and server "agree by construction rather than by convention".
 * That was not true: both read the same `evidenceKind` from the same request body, so the server's
 * refusal was a restatement of the client's claim rather than a check on it. And the client was
 * wrong — it stored every upload as `"other"` — which meant an identity document skipped the
 * browser-only route, arrived here labelled `"other"`, and on the two violation families whose
 * matrix defines an `"other"` requirement (`RELATED_ACCOUNT`, `PRODUCT_SAFETY`) was matched to that
 * requirement and sent to the model.
 *
 * The client bug is fixed. This is the rule that does not depend on it: **we do not read a document
 * we cannot name.** `"other"` means precisely that we cannot name it, so we cannot promise it is
 * not a passport or a bank statement, and the honest response is to decline rather than to guess.
 * It is the server's own reasoning about its own risk, so a future client bug cannot defeat it.
 *
 * The cost was two matrix entries that used `"other"` for documents deserving their own kinds — a
 * compliance/test report on `PRODUCT_SAFETY` and proof of resolution on `RELATED_ACCOUNT`. They were
 * given real kinds on 24 Sep 2026 (`compliance_report`, `account_resolution_proof`), which restored
 * the capability without reopening the hole: no matrix entry uses `"other"` now, so it only ever
 * means a record the seller named themselves.
 */
const UNNAMED_EVIDENCE_KIND = "other";

/** Shared with the client; see `limits.ts` for why it is set by the host's request limit. */
const MAX_BASE64_BYTES = MAX_CHECK_BASE64_CHARS;

const ACCEPTED_MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;

const Body = z.object({
  /** The case the document belongs to. A check is Appeal Pass work for that case, not the account. */
  caseId: CaseIdSchema,
  kind: z.enum(VIOLATION_KINDS),
  evidenceKind: z.string().min(1).max(64),
  mimeType: z.enum(ACCEPTED_MIME),
  /** Base64 without the data: prefix. */
  data: z.string().min(1).max(MAX_BASE64_BYTES),
  /**
   * Case data the reading is compared with — identifiers from the seller's own notice, nothing
   * else. Optional: without it the comparisons are reported as not assessed rather than guessed.
   * Never sent to the model; the comparison is done in `buildDocumentCheck`.
   */
  context: z
    .object({
      asins: z
        .array(z.string().regex(/^B0[A-Z0-9]{8}$/))
        .max(20)
        .default([]),
      referenceIds: z
        .array(z.string().regex(/^\d{6,15}$/))
        .max(20)
        .default([]),
      /** The seller's own statement of their registered details (`Workspace.caseFacts`). */
      business: z
        .object({
          name: z.string().trim().min(1).max(300).optional(),
          address: z.string().trim().min(1).max(1000).optional(),
        })
        .optional(),
      suppliers: z.array(z.string().trim().min(1).max(300)).max(20).optional(),
    })
    .optional(),
});

const FindingSchema = z.object({
  field: z.string().min(1).max(200),
  status: z.enum(["present", "missing", "unclear", "conflicting"]),
  observed: z.string().max(500).optional(),
  note: z.string().max(500),
});

const ModelResponse = z.object({ findings: z.array(FindingSchema).max(40) });

const RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          field: { type: "string" },
          status: { type: "string", enum: ["present", "missing", "unclear", "conflicting"] },
          observed: { type: "string" },
          note: { type: "string" },
        },
        required: ["field", "status", "note"],
      },
    },
  },
  required: ["findings"],
} as const;

const SYSTEM_PROMPT = [
  "You read a business document an Amazon seller has uploaded and report, field by field, what is legible in it.",
  "",
  "You are NOT judging the document. You must never state or imply that a document is authentic, genuine, valid, verified, fake or forged — nobody outside Amazon can determine that, and a seller acting on such a claim would be harmed by it. Report only what you can see.",
  "",
  "For each field you are given:",
  "- 'present' — the field is legible and answers the requirement. Quote what you read in 'observed'.",
  "- 'missing' — the field is genuinely not in the document.",
  "- 'unclear' — something is there but you cannot read it, or it is ambiguous. Use this rather than guessing.",
  "- 'conflicting' — two parts of the document disagree with each other.",
  "",
  "Never invent a value. If you cannot quote it from the document, the status is 'unclear', not 'present'.",
  "",
  "Some fields name a comparison — a time window, units sold, matching ASINs, a matching complaint ID or seller account. You are not given the information to make that comparison, so do not make it. Report whether the underlying value is printed, and quote it exactly as printed: the date as written, every ASIN or ID shown, the quantities listed. Mark it 'present' if it is printed; we compare it ourselves.",
  "Write each note as one plain sentence describing the document. Never predict whether Amazon will accept it.",
].join("\n");

export async function handleReadDocument(req: NextRequest): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedJsonResponse();

  // Reading documents is Appeal Pass work: it is the expensive, high-value part of preparing a
  // response, and it runs a paid model against a whole file. This first check is only the cheap
  // one — any active Pass at all — so an unpaid request is refused before its body is read. The
  // check that matters, a Pass for *this* case, follows once the body names the case.
  if (!(await isLicenseActive(user.id))) {
    return NextResponse.json(
      { error: "An Appeal Pass is required to check documents." },
      { status: 402 },
    );
  }

  const rate = await rateLimitDocumentRead(user);
  if (!rate.success) return tooManyRequestsResponse(rate);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body." },
      { status: 400 },
    );
  }

  const { caseId, kind, evidenceKind, mimeType, data, context } = parsed.data;

  if ((BROWSER_ONLY_EVIDENCE_KINDS as readonly string[]).includes(evidenceKind)) {
    return NextResponse.json(
      {
        error:
          "Identity and financial documents are checked on your own device and are never uploaded.",
        browserOnly: true,
      },
      { status: 422 },
    );
  }

  if (evidenceKind === UNNAMED_EVIDENCE_KIND) {
    return NextResponse.json(
      {
        error:
          "We only read documents we can identify, and this record is not one of them. Nothing was read or sent on. Review the original yourself and note what it shows.",
      },
      { status: 422 },
    );
  }

  /*
    24 Sep 2026 (ChatGPT audit §9). The offer is one Appeal Pass per case, and compose enforces it
    with `claimCasePass`; this route checked only that the account held *some* active Pass, so a
    Pass bought for one case unlocked document checks on every other case. Same rule as compose
    now: a Pass bound to this case, or an unassigned one, which this binds to it. Placed after the
    two refusals above, which cost nothing and must answer the same way for everyone.
  */
  if (!(await claimCasePass(user.id, caseId))) {
    return NextResponse.json(
      {
        error:
          "Document checks come with the Appeal Pass for this case. Your Pass covers a different case.",
        code: "case_pass_required",
      },
      { status: 402 },
    );
  }

  /*
    The `UNKNOWN` fallback, added 23 Sep 2026 alongside the fix that makes the evidence kind correct
    in the first place. `EVIDENCE_MATRIX.UNKNOWN` is an empty array, and a case started by typing a
    notice straight into `/case` is `UNKNOWN` — so this route refused every document on the most
    ordinary path into the product, and refused it with "that document type is not one Amazon asks
    for on this case" about a record the seller had been asked for by name.

    Only the field list is borrowed, which is what this route uses: what a compliant invoice has to
    show does not change with the violation that prompted the request. The lookup is shared with
    `buildDocumentCheck` so the fields the model is asked about are the fields reported back.
  */
  const requirement = requirementForCheck(kind, evidenceKind as EvidenceKind);
  if (!requirement) {
    return NextResponse.json(
      { error: "That document type is not one Amazon asks for on this case." },
      { status: 400 },
    );
  }

  const result = await callGemini({
    task: "read-document",
    messages: [
      { role: "system", text: SYSTEM_PROMPT },
      {
        role: "user",
        text: [
          `Document type: ${requirement.kind}.`,
          "Report on exactly these fields, using the field names verbatim:",
          ...requirement.fields.map((f) =>
            comparisonFor(f)
              ? `- ${f} (quote the value as printed; do not make the comparison)`
              : `- ${f}`,
          ),
          "",
          "Return JSON only.",
        ].join("\n"),
        documents: [{ data, mimeType }],
      },
    ],
    temperature: 0,
    maxOutputTokens: 2048,
    responseJsonSchema: RESPONSE_JSON_SCHEMA,
  });

  if (!result.ok) {
    // Degrades to "we could not read it", never to a fabricated reading. The seller's own manual
    // review of the requirement list still works exactly as before.
    return NextResponse.json(
      {
        ok: false,
        reason: "unavailable",
        message:
          result.reason === "not_configured"
            ? "Document reading is not switched on."
            : result.reason === "spend_cap"
              ? "Document reading has reached today's limit for the whole service. It resets at midnight UTC; nothing about your case has changed."
              : result.reason === "busy"
                ? "Google's AI service is busy right now. Try again in a minute; nothing about your case has changed."
                : "We could not read that document. Nothing about your case has changed.",
      },
      { status: 200 },
    );
  }

  let json: unknown;
  try {
    const text = result.text.trim();
    json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  } catch {
    return NextResponse.json(
      { ok: false, reason: "unavailable", message: "We could not read that document." },
      { status: 200 },
    );
  }

  const validated = ModelResponse.safeParse(json);
  if (!validated.success) {
    return NextResponse.json(
      { ok: false, reason: "unavailable", message: "We could not read that document." },
      { status: 200 },
    );
  }

  // `buildDocumentCheck` is what enforces the vocabulary: it strips any note or quote that draws a
  // conclusion, and re-adds requirements the model omitted as `missing`.
  // Today is the server's UTC date. A window of months is not moved by a timezone, and a date the
  // client supplied would be a date the client chose.
  const check = buildDocumentCheck(
    kind,
    evidenceKind as EvidenceKind,
    validated.data.findings as FieldFinding[],
    {
      today: new Date().toISOString().slice(0, 10),
      asins: context?.asins ?? [],
      referenceIds: context?.referenceIds ?? [],
      ...(context?.business ? { business: context.business } : {}),
      ...(context?.suppliers ? { suppliers: context.suppliers } : {}),
    },
  );

  return NextResponse.json({ ok: true, check });
}

export const POST = withGeminiBreaker(handleReadDocument);
