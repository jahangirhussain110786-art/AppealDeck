/**
 * Stops every reminder to an address, from the link in any reminder email (23 Oct 2026).
 *
 * The token may arrive in the query, in a JSON body (the page's button), or in a form body. Mail
 * clients that honour List-Unsubscribe-Post post `List-Unsubscribe=One-Click` to the URL from the
 * header, with the token already in the query, so there is no page and no second press.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stopGuestReminders } from "@/lib/guestReminders";

export const dynamic = "force-dynamic";

const Token = z
  .string()
  .length(48)
  .regex(/^[0-9a-f]+$/);

export async function POST(req: NextRequest) {
  const queryToken = new URL(req.url).searchParams.get("token");
  const type = req.headers.get("content-type") ?? "";
  let token: unknown = queryToken;
  if (
    !token &&
    (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data"))
  ) {
    const form = await req.formData().catch(() => null);
    token = form?.get("token") ?? null;
  }
  if (!token) {
    const body = await req.json().catch(() => null);
    token = body?.token ?? null;
  }
  const parsed = Token.safeParse(token);
  if (!parsed.success) return NextResponse.json({ status: "unknown" }, { status: 400 });
  try {
    const stopped = await stopGuestReminders(parsed.data);
    return NextResponse.json({ status: stopped ? "stopped" : "unknown" });
  } catch {
    return NextResponse.json({ error: "Not available right now." }, { status: 503 });
  }
}
