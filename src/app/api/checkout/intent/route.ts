import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser, unauthorizedJsonResponse } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { CaseIdSchema, ViolationKindSchema } from "@/lib/caseSchema";
import { isSeverityGated } from "@/core";
import { LEGAL } from "@/content/legal";
import { rateLimitCompose, tooManyRequestsResponse } from "@/lib/ratelimit";
import { WorkspaceSchema } from "@/lib/workspaceSchema";
import { workspaceCanCompose } from "@/core/workspace";

const Body = z.object({
  caseId: CaseIdSchema,
  kind: ViolationKindSchema,
  consent: z.literal(true),
  // The vault-held case is browser-only — the server never otherwise sees its content, so the
  // client sends this one case's current workspace so eligibility can be checked before payment,
  // the same way /api/compose already does at draft time.
  workspace: WorkspaceSchema.optional(),
});
export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user?.email) return unauthorizedJsonResponse();
  const rate = await rateLimitCompose(user);
  if (!rate.success) return tooManyRequestsResponse(rate);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Choose a case and accept the checkout consent first." },
      { status: 400 },
    );
  if (isSeverityGated(parsed.data.kind))
    return NextResponse.json(
      { error: "This case requires professional help; an Appeal Pass is not offered." },
      { status: 403 },
    );
  if (parsed.data.workspace && !workspaceCanCompose(parsed.data.workspace))
    return NextResponse.json(
      {
        error:
          "This case does not currently need a drafted response. Confirm its response route in the case workspace before buying a Pass for it.",
      },
      { status: 422 },
    );
  const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS;
  if (!supabaseAdmin || !priceId)
    return NextResponse.json({ error: "Checkout is not configured." }, { status: 503 });
  const { data, error } = await supabaseAdmin
    .from("checkout_intents")
    .insert({
      user_id: user.id,
      email: user.email,
      case_id: parsed.data.caseId,
      price_id: priceId,
      consent_text: LEGAL.consent.withdrawalCheckbox.label,
    })
    .select("id")
    .single();
  if (error || !data)
    return NextResponse.json({ error: "Could not prepare checkout." }, { status: 503 });
  return NextResponse.json({ intentId: data.id, priceId });
}
