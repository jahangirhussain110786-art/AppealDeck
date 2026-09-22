/**
 * AA-40 (AM-26): the narrow channel by which a local case tells the server "remind me on this date".
 *
 * Opt-in per case. The body carries a due date, a coarse violation kind, and the vault's own opaque
 * case id — deliberately nothing else. See `supabase/migrations/0011_case_reminders.sql`.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { VIOLATION_KINDS } from "@/core/violationKinds";
import { getApiUser, unauthorizedJsonResponse } from "@/lib/auth";
import { rateLimitOutcome, tooManyRequestsResponse } from "@/lib/ratelimit";
import { upsertCaseReminder, deleteCaseReminder, getCaseReminder } from "@/lib/caseReminders";

export const dynamic = "force-dynamic";

/** Same shape as the vault's case ids (`CaseIdSchema` in caseSchema.ts). */
const CaseRef = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);

const Body = z.object({
  caseRef: CaseRef,
  kind: z.enum(VIOLATION_KINDS),
  // A reminder must be a real instant. A far-future date is accepted — sellers legitimately set
  // dates months out for funds cases — but an unparseable one is rejected rather than coerced.
  dueAt: z.string().datetime(),
});

const DeleteBody = z.object({ caseRef: CaseRef });

export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user) return unauthorizedJsonResponse();

  const rate = await rateLimitOutcome(user);
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

  try {
    await upsertCaseReminder({
      userId: user.id,
      caseRef: parsed.data.caseRef,
      kind: parsed.data.kind,
      dueAt: parsed.data.dueAt,
    });
    return NextResponse.json({ ok: true });
  } catch {
    // The seller's case is untouched either way — this only affects whether an email is sent.
    return NextResponse.json({ error: "Reminders are unavailable right now." }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getApiUser();
  if (!user) return unauthorizedJsonResponse();

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = DeleteBody.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  try {
    await deleteCaseReminder(user.id, parsed.data.caseRef);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Reminders are unavailable right now." }, { status: 503 });
  }
}

export async function GET(req: NextRequest) {
  const user = await getApiUser();
  if (!user) return unauthorizedJsonResponse();

  const caseRef = req.nextUrl.searchParams.get("caseRef");
  const parsed = CaseRef.safeParse(caseRef);
  if (!parsed.success) return NextResponse.json({ error: "Invalid caseRef." }, { status: 400 });

  try {
    const reminder = await getCaseReminder(user.id, parsed.data);
    return NextResponse.json({ reminder });
  } catch {
    return NextResponse.json({ error: "Reminders are unavailable right now." }, { status: 503 });
  }
}
