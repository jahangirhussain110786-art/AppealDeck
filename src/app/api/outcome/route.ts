import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser, unauthorizedJsonResponse } from "@/lib/auth";
import { isLicenseActive } from "@/lib/license";
import { rateLimitOutcome, tooManyRequestsResponse } from "@/lib/ratelimit";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// EF-5 opt-in outcome record (see src/core/outcomeModel.ts for the full design note). The request
// body IS the entire stored record — there is no field here, or anywhere in this route, that
// could carry a case ID, a name, an email, or any notice text. Signing in is required only as an
// abuse guard (a real customer, rate-limited); the row written contains nothing that identifies
// who sent it.
const OutcomeBody = z.object({
  kind: z.enum([
    "FUNDS",
    "INAUTHENTIC_DOCUMENTS",
    "INTELLECTUAL_PROPERTY",
    "LISTING",
    "POLICY",
    "RELATED_ACCOUNT",
    "UNKNOWN",
  ]),
  marketplace: z.string().trim().min(1).max(40).default("unknown"),
  docType: z.enum(["poa", "ip_dispute", "funds_appeal", "listing_appeal", "followup_nudge"]),
  attempts: z.number().int().min(1).max(20),
  readinessAtSubmit: z.number().int().min(0).max(100),
  outcome: z.enum(["approved", "rejected", "no_response", "withdrawn"]),
  daysToOutcome: z.number().int().min(0).max(3650),
});

export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return unauthorizedJsonResponse();
  }

  if (!(await isLicenseActive(user.email))) {
    return NextResponse.json({ error: "Appeal Pass required." }, { status: 403 });
  }

  const rate = await rateLimitOutcome(user);
  if (!rate.success) {
    return tooManyRequestsResponse(rate);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = OutcomeBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body." },
      { status: 400 },
    );
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Not configured." }, { status: 501 });
  }

  const { kind, marketplace, docType, attempts, readinessAtSubmit, outcome, daysToOutcome } =
    parsed.data;

  const { error } = await supabaseAdmin.from("outcome_events").insert({
    kind,
    marketplace,
    doc_type: docType,
    attempts,
    readiness_at_submit: readinessAtSubmit,
    outcome,
    days_to_outcome: daysToOutcome,
  });

  if (error) {
    // Most likely cause: migration 0008_outcome_events.sql hasn't been applied yet to this
    // Supabase project (it's new as of 11 Sep 2026, applied manually per docs/DEPLOYMENT.md §4).
    console.error("POST /api/outcome: insert failed", error.message);
    return NextResponse.json({ error: "Could not record outcome." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
