/** Confirms a guest reminder from the link in the confirmation email (23 Oct 2026). A POST, from a button. */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { confirmGuestReminder } from "@/lib/guestReminders";

export const dynamic = "force-dynamic";

const Body = z.object({
  token: z
    .string()
    .length(48)
    .regex(/^[0-9a-f]+$/),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ status: "unknown" }, { status: 400 });
  try {
    return NextResponse.json({ status: await confirmGuestReminder(parsed.data.token) });
  } catch {
    return NextResponse.json({ error: "Not available right now." }, { status: 503 });
  }
}
