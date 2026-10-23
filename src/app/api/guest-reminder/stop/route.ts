/** Stops every reminder to an address, from the link in any reminder email (23 Oct 2026). A POST, from a button. */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stopGuestReminders } from "@/lib/guestReminders";

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
    const stopped = await stopGuestReminders(parsed.data.token);
    return NextResponse.json({ status: stopped ? "stopped" : "unknown" });
  } catch {
    return NextResponse.json({ error: "Not available right now." }, { status: 503 });
  }
}
