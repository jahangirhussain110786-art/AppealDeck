import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { composePoa, critiquePoa, renderPoaText, isSeverityGated } from "@/core";
import type { CaseFileData, PoaDraft } from "@/core";
import { getApiUser, unauthorizedJsonResponse } from "@/lib/auth";
import { isLicenseActive, claimCasePass } from "@/lib/license";
import { supabaseAdmin } from "@/lib/supabase/server";
import { rateLimitCompose, tooManyRequestsResponse } from "@/lib/ratelimit";
import { recordActivation, deviceErrorResponse, deriveFingerprintFromRequest } from "@/lib/devices";
import { CaseDataSchema } from "@/lib/caseSchema";
import { workspaceCanCompose } from "@/core/workspace";

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
  if (!(await isLicenseActive(user.id))) {
    return NextResponse.json(
      { error: "Appeal Pass required.", code: "case_pass_required" },
      { status: 403 },
    );
  }

  if (supabaseAdmin && email) {
    const fingerprint = await deriveFingerprintFromRequest(req, user.id);
    const result = await recordActivation(supabaseAdmin, {
      userId: user.id,
      email,
      fingerprint,
      userAgent: req.headers.get("user-agent"),
    });
    if (result.status !== "ok") {
      return deviceErrorResponse(result);
    }
  }

  if (!(await claimCasePass(user.id, caseData.id)))
    return NextResponse.json(
      { error: "An Appeal Pass is required for this case.", code: "case_pass_required" },
      { status: 403 },
    );
  const data: CaseFileData = caseData;

  const draft = composeDraft(data, attemptNumber);
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
 * Always deterministic. Preparing a response assembles the seller's own confirmed wording and exact
 * evidence references and sends nothing to any AI provider — the privacy policy says so, and
 * `legalDisclosures.test.ts` pins it.
 *
 * Until 24 Sep 2026 a legacy branch here rewrote Root Cause and Preventive Measures with Gemini
 * (AM-23) for a case with no workspace. Every case has had a workspace since 22 Sep, so no seller
 * could reach it, but a hand-built request without one could — which made the privacy sentence
 * true only for the product's own screens. It is removed. AI help with wording is now a separate,
 * opt-in step with a fact lock (`/api/improve-wording`), and its result is only ever what the seller
 * chooses to keep in their own fields.
 */
function composeDraft(data: CaseFileData, attemptNumber: number): PoaDraft {
  return composePoa(data, attemptNumber);
}
