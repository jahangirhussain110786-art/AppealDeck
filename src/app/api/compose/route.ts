import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { composePoa, critiquePoa, renderPoaText, isSeverityGated } from "@/core";
import type { CaseFileData, PoaDraft } from "@/core";
import { getApiUser, unauthorizedJsonResponse } from "@/lib/auth";
import { isLicenseActive, claimCasePass } from "@/lib/license";
import { serviceUnavailableResponse } from "@/lib/licenseGuard";
import { supabaseAdmin } from "@/lib/supabase/server";
import { rateLimitCompose, rateLimitDraft, tooManyRequestsResponse } from "@/lib/ratelimit";
import { recordActivation, deviceErrorResponse, deriveFingerprintFromRequest } from "@/lib/devices";
import { CaseDataSchema } from "@/lib/caseSchema";
import { workspaceCanCompose, professionalReviewApplies, routeWorkspace } from "@/core/workspace";
import { hasD6Allegation } from "@/core/violationKinds";
import { STORES } from "@/content/stores";
import { isGeminiConfigured } from "@/lib/llm/gemini";
import { buildDraftSources, draftResponse } from "@/lib/llm/draftResponse";
import { draftCacheKey, getCachedDraft, setCachedDraft } from "@/lib/draftCache";
import { verifyAiDraft } from "@/core/draftVerification";
import { draftRequestFrom } from "@/lib/draftRequest";
import type { DraftSections } from "@/core/draftVerification";

export const dynamic = "force-dynamic";

const ComposeBody = z.object({
  caseData: CaseDataSchema,
  attemptNumber: z.number().int().min(1).max(99).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return unauthorizedJsonResponse();
  }
  const email = (user.email ?? "").trim().toLowerCase();

  const rate = await rateLimitCompose(user);
  if (!rate.success) {
    return tooManyRequestsResponse(rate);
  }

  let body: unknown;
  try {
    const raw = await req.text();
    if (new TextEncoder().encode(raw).length > 200_000)
      return NextResponse.json({ error: "Case is too large." }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = ComposeBody.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Field 'caseData.kind' is required.";
    return NextResponse.json({ error: first }, { status: 400 });
  }

  const { caseData, attemptNumber = 1 } = parsed.data;
  /*
    D6, checked here from what was posted and never from a flag the client asserts. A latched case,
    a notice or an unapplied reply that carries a fabricated-documents, fraud or child-safety
    allegation, and any route that comes out `specialist` are refused with the referral wording,
    whoever calls this route and whatever the client chose to send.
  */
  if (
    caseData.workspace &&
    (professionalReviewApplies(caseData.workspace) ||
      routeWorkspace(caseData.workspace).protocol === "specialist" ||
      caseData.workspace.replies.some((r) => !r.applied && hasD6Allegation(r.text)))
  )
    return NextResponse.json(
      { error: STORES.d6Release.why, code: "professional_review" },
      { status: 422 },
    );
  if (caseData.workspace && !workspaceCanCompose(caseData.workspace))
    return NextResponse.json(
      {
        error:
          "Confirm a supported response route before drafting. This request may need clarification or professional review.",
      },
      { status: 422 },
    );
  if (isSeverityGated(caseData.kind))
    return NextResponse.json(
      { error: "This case requires professional help. Self-serve drafting is unavailable." },
      { status: 403 },
    );
  let active: boolean;
  try {
    active = await isLicenseActive(user.id);
  } catch {
    return serviceUnavailableResponse();
  }
  if (!active) {
    return NextResponse.json(
      { error: "Appeal Pass required.", code: "case_pass_required" },
      { status: 403 },
    );
  }

  let hasCasePass: boolean;
  try {
    hasCasePass = await claimCasePass(user.id, caseData.id);
  } catch {
    return serviceUnavailableResponse();
  }
  if (!hasCasePass)
    return NextResponse.json(
      { error: "An Appeal Pass is required for this case.", code: "case_pass_required" },
      { status: 403 },
    );

  // The device cap is applied after the Pass check, so a request for a case with no Pass cannot use
  // up one of the seller's device slots.
  if (supabaseAdmin && email) {
    const fingerprint = await deriveFingerprintFromRequest(req, user.id);
    let result;
    try {
      result = await recordActivation(supabaseAdmin, {
        userId: user.id,
        email,
        fingerprint,
        userAgent: req.headers.get("user-agent"),
      });
    } catch {
      return serviceUnavailableResponse();
    }
    if (result.status !== "ok") {
      return deviceErrorResponse(result);
    }
  }
  const data: CaseFileData = caseData;

  const ownDraft = composeDraft(data, attemptNumber);

  /*
    7 Oct 2026, founder decision: the AI writes the Plan of Action's three narrative sections from
    the seller's own answers, the notice and the records they reviewed. It is never trusted: a
    draft that adds a date, a number, a name or a document the material does not contain is thrown
    away (`verifyAiDraft`), and the seller's own wording, which the deterministic draft is built
    from, is returned alongside so they can switch back. Everything that names a file stays code.
  */
  let draft = ownDraft;
  let ai: AiStatus = { status: "not_applicable" };
  if (data.workspace && data.workspace.protocol === "operational") {
    const aiRequest = draftRequestFrom(data.workspace, data.kind, attemptNumber);
    if (aiRequest) {
      if (!isGeminiConfigured()) {
        ai = { status: "fallback", reason: "not_configured" };
      } else {
        // The same material gets the same draft, without another model call. What comes back from
        // the cache is checked again before it is used.
        const cacheKey = draftCacheKey(user.id, aiRequest);
        const cached = await getCachedDraft(cacheKey);
        if (cached && verifyAiDraft(buildDraftSources(aiRequest), cached).ok) {
          draft = withAiSections(ownDraft, cached);
          ai = { status: "used", retried: false };
        } else {
          const allowance = await rateLimitDraft(user);
          if (!allowance.success) {
            ai = {
              status: "fallback",
              reason: allowance.unavailable ? "unavailable" : "daily_limit",
            };
          } else {
            const outcome = await draftResponse(aiRequest);
            if (outcome.ok) {
              draft = withAiSections(ownDraft, outcome.sections);
              ai = { status: "used", retried: outcome.retried };
              await setCachedDraft(cacheKey, outcome.sections);
            } else {
              ai = { status: "fallback", reason: outcome.reason, detail: outcome.detail };
            }
          }
        }
      }
    }
  }
  const view = (d: PoaDraft) => ({
    docType: d.docType,
    mode: d.mode,
    sections: d.sections,
    watermark: d.watermark,
    metadata: d.metadata,
  });

  return NextResponse.json({
    draft: view(draft),
    critique: critiquePoa(draft, data),
    rendered: renderPoaText(draft),
    ai,
    ...(ai.status === "used"
      ? {
          ownWording: {
            draft: view(ownDraft),
            critique: critiquePoa(ownDraft, data),
            rendered: renderPoaText(ownDraft),
          },
        }
      : {}),
  });
}

type AiStatus =
  | { status: "not_applicable" }
  | { status: "used"; retried: boolean }
  | { status: "fallback"; reason: string; detail?: string };

const AI_SECTIONS = {
  "Root Cause": "rootCause",
  "Corrective Actions": "correctiveActions",
  "Preventive Measures": "preventiveMeasures",
} as const;

/** The deterministic draft with the three narrative sections replaced, and marked as AI-written. */
function withAiSections(draft: PoaDraft, sections: DraftSections): PoaDraft {
  return {
    ...draft,
    sections: draft.sections.map((s) => {
      const key = AI_SECTIONS[s.heading as keyof typeof AI_SECTIONS];
      return key ? { ...s, body: sections[key], source: "ai" as const } : s;
    }),
    metadata: { ...draft.metadata, aiDrafted: true },
  };
}

/**
 * The seller's own draft, assembled in code from their confirmed wording and exact evidence
 * references. It is what every response starts from, what the AI draft is checked against, and
 * what the seller gets when the AI cannot run or its draft fails the fact check.
 *
 * History: until 24 Sep 2026 a legacy branch here rewrote sections with Gemini (AM-23) for a case
 * with no workspace, and from 24 Sep this function sent nothing to any AI provider. On 7 Oct 2026
 * the founder decided the AI writes the Plan of Action's narrative sections; that now happens in
 * `POST` above, behind `verifyAiDraft`, and the privacy page says so (`legalDisclosures.test.ts`
 * pins it).
 */
function composeDraft(data: CaseFileData, attemptNumber: number): PoaDraft {
  return composePoa(data, attemptNumber);
}
