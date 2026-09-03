import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { composePoa, critiquePoa, renderPoaText } from "@/core";
import type { CaseFileData } from "@/core";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { rateLimitCompose, tooManyRequestsResponse } from "@/lib/ratelimit";
import { recordActivation, deviceErrorResponse, fingerprintFromRequest } from "@/lib/devices";

export const dynamic = "force-dynamic";

const CaseFile = z
  .object({
    kind: z.string().min(1),
    state: z.string().optional(),
    rootCause: z.string().optional(),
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
  const user = await requireUser();
  const email = (user.email ?? "").trim().toLowerCase();

  const rate = await rateLimitCompose(user);
  if (!rate.success) {
    return tooManyRequestsResponse(rate);
  }

  if (supabaseAdmin && email) {
    const { data: license } = await supabaseAdmin
      .from("licenses")
      .select("status")
      .eq("email", email)
      .maybeSingle();
    if (!license || license.status !== "active") {
      return NextResponse.json({ error: "Active Appeal Pass required." }, { status: 403 });
    }

    const fingerprint = await deriveFingerprintFromRequest(req, user);
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

  const draft = composePoa(data, attemptNumber);
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

async function deriveFingerprintFromRequest(
  req: NextRequest,
  user: { id: string; email?: string | null },
): Promise<string> {
  return fingerprintFromRequest({
    userAgent: req.headers.get("user-agent") ?? "",
    ip:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "0.0.0.0",
    acceptLanguage: req.headers.get("accept-language") ?? "",
    userId: user.id,
  });
}
