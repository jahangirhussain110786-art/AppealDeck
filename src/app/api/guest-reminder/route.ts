/**
 * Asks for one email reminder before the date in a decoded notice (23 Oct 2026), for a visitor with
 * no account. See `src/lib/guestReminders.ts` for the rules and the migration for what is kept.
 *
 * The body carries an address, the coarse kind of notice and the day the notice states, and the
 * visitor's consent. No label or other text from the caller is stored or emailed: the label is ours,
 * so the form cannot be used to put words of the caller's choosing into an email to someone else.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { VIOLATION_KINDS } from "@/core/violationKinds";
import { isDay, requestGuestReminder } from "@/lib/guestReminders";
import { rateLimitGuestReminder } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/** What the reminder says it is about. Ours, never the caller's. */
export const GUEST_REMINDER_LABEL = "The date your notice states";

const Body = z.object({
  email: z.string().trim().min(5).max(254).email(),
  kind: z.enum(VIOLATION_KINDS),
  dueOn: z.string().refine(isDay, "Invalid date."),
  consent: z.literal(true),
});

const unavailable = () =>
  NextResponse.json({ error: "Email reminders are not available right now." }, { status: 503 });

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "0.0.0.0";
  if (!(await rateLimitGuestReminder(ip)))
    return NextResponse.json(
      { error: "Too many requests today. Try again tomorrow." },
      { status: 429 },
    );

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Enter a valid email address and tick the box to confirm." },
      { status: 400 },
    );

  try {
    const result = await requestGuestReminder({
      email: parsed.data.email,
      kind: parsed.data.kind,
      dueOn: parsed.data.dueOn,
      label: GUEST_REMINDER_LABEL,
    });
    switch (result.status) {
      case "pending":
        return NextResponse.json({ status: "pending" });
      case "already_confirmed":
        return NextResponse.json({ status: "already" });
      case "too_late":
        return NextResponse.json(
          { error: "That date is today or has passed, so there is nothing to remind you of." },
          { status: 422 },
        );
      case "limit":
        return NextResponse.json(
          { error: "That address already has the most reminders we send." },
          { status: 409 },
        );
    }
  } catch {
    return unavailable();
  }
}
