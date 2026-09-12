import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { composePoa, critiquePoa, renderPoaText } from "@/core";
import type { CaseFileData, PoaDraft } from "@/core";
import { getApiUser, unauthorizedJsonResponse } from "@/lib/auth";
import { isLicenseActive } from "@/lib/license";
import { supabaseAdmin } from "@/lib/supabase/server";
import { rateLimitCompose, tooManyRequestsResponse } from "@/lib/ratelimit";
import { recordActivation, deviceErrorResponse, deriveFingerprintFromRequest } from "@/lib/devices";
import { isGeminiConfigured, composeBreakerOptions } from "@/lib/llm/gemini";
import { checkBreaker, recordBreaker, fingerprintForRequest } from "@/lib/breaker";
import { composePoaWithLlm, applyLlmSections } from "@/lib/llm/composePoaLlm";

export const dynamic = "force-dynamic";

const CaseFile = z
  .object({
    kind: z.string().min(1),
    state: z.string().optional(),
    rootCause: z.string().optional(),
    preventiveMeasures: z.string().optional(),
    timelineEvents: z
      .array(
        z.object({
          date: z.string(),
          description: z.string(),
        }),
      )
      .optional(),
    priorAppealCount: z.number().int().nonnegative().optional(),
    evidenceSlots: z.record(z.string(), z.unknown()).optional(),
    actionItems: z.array(z.unknown()).optional(),
    attemptCount: z.number().int().nonnegative().optional(),
  })
  .passthrough();

const ComposeBody = z.object({
  caseData: CaseFile,
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

  if (!(await isLicenseActive(email))) {
    return NextResponse.json({ error: "Appeal Pass required." }, { status: 403 });
  }

  if (supabaseAdmin && email) {
    const fingerprint = await deriveFingerprintFromRequest(req, user.id);
    const result = await recordActivation(supabaseAdmin, {
      userId: user.id,
      email,
      fingerprint,
      userAgent: req.headers.get("user-agent"),
    });
    if (result.status === "over_cap") {
      return deviceErrorResponse(result);
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = ComposeBody.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Field 'caseData.kind' is required.";
    return NextResponse.json({ error: first }, { status: 400 });
  }

  const { caseData, attemptNumber = 1 } = parsed.data;
  const data = caseData as unknown as CaseFileData;

  const draft = await composeDraft(data, attemptNumber, req, user.id);
  const critique = critiquePoa(draft, data);

  return NextResponse.json({
    draft: {
      docType: draft.docType,
      mode: draft.mode,
      sections: draft.sections,
      watermark: draft.watermark,
      metadata: draft.metadata,
    },
    critique,
    rendered: renderPoaText(draft),
  });
}

/**
 * Deterministic draft first, always — `composePoa()` never fails and never costs anything.
 * Only attempts the real AI-drafted rewrite (Task 4 / AM-23) when Gemini is configured and this
 * user's dedicated compose breaker allows it; any failure at any step (breaker closed, Gemini
 * down, malformed output, a rejected phrase) silently keeps the deterministic draft — this must
 * never be the difference between a seller getting a draft and getting an error page.
 */
async function composeDraft(
  data: CaseFileData,
  attemptNumber: number,
  req: NextRequest,
  userId: string,
): Promise<PoaDraft> {
  const deterministic = composePoa(data, attemptNumber);

  if (!isGeminiConfigured()) {
    return deterministic;
  }

  const fingerprint = fingerprintForRequest(req, userId);
  const check = await checkBreaker(composeBreakerOptions, fingerprint);
  if (!check.allowed) {
    return deterministic;
  }

  const llm = await composePoaWithLlm(data);
  await recordBreaker(composeBreakerOptions, { ok: llm.ok, context: check.context });

  if (!llm.ok) {
    return deterministic;
  }

  return applyLlmSections(deterministic, data, llm.sections);
}
