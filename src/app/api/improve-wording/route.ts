/**
 * Wording help for one section of a seller's response (24 Sep 2026, founder-approved).
 *
 * Runs only when the seller presses "Improve the wording" on a section. Never part of preparing
 * the response: `/api/compose` stays deterministic and sends nothing to any AI provider, and the
 * privacy policy says both things. The section text exists for the duration of one request; nothing
 * here stores it.
 *
 * Appeal Pass work for this case, like document checks: the cheap any-Pass check first, so an
 * unpaid request is refused before its body is read, then the Pass for the case the body names.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser, unauthorizedJsonResponse } from "@/lib/auth";
import { claimCasePass, isLicenseActive } from "@/lib/license";
import { CaseIdSchema } from "@/lib/caseSchema";
import { rateLimitWording, tooManyRequestsResponse } from "@/lib/ratelimit";
import { withGeminiBreaker } from "@/lib/llm/gemini";
import { VIOLATION_KINDS } from "@/core/violationKinds";
import {
  improveWording,
  MAX_WORDING_CHARS,
  WORDING_SECTIONS,
  type ImproveWordingDeps,
} from "@/lib/llm/improveWording";

export const dynamic = "force-dynamic";

const Body = z.object({
  caseId: CaseIdSchema,
  kind: z.enum(VIOLATION_KINDS),
  section: z.enum(WORDING_SECTIONS),
  text: z.string().min(1).max(MAX_WORDING_CHARS),
  question: z.string().max(500).optional(),
});

export async function handleImproveWording(
  req: NextRequest,
  deps?: ImproveWordingDeps,
): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedJsonResponse();

  if (!(await isLicenseActive(user.id))) {
    return NextResponse.json(
      { error: "Wording help comes with the Appeal Pass.", code: "case_pass_required" },
      { status: 402 },
    );
  }

  const rate = await rateLimitWording(user);
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
  const { caseId, kind, section, text, question } = parsed.data;

  if (!(await claimCasePass(user.id, caseId))) {
    return NextResponse.json(
      {
        error:
          "Wording help comes with the Appeal Pass for this case. Your Pass covers a different case.",
        code: "case_pass_required",
      },
      { status: 402 },
    );
  }

  const result = await improveWording(
    { section, text, violation: kind, ...(question ? { question } : {}) },
    deps,
  );
  return NextResponse.json(result);
}

export const POST = withGeminiBreaker((req) => handleImproveWording(req));
