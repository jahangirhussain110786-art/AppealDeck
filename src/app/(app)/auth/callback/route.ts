import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safeNext";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const explicitNext = searchParams.get("next");
  const continueTo = searchParams.get("continue");

  // The reset email's link carries `next=/reset-password`; Supabase's code flow adds no `type`, so
  // that is the only sign this is a recovery and the return path in `continue` must be kept.
  const isRecovery = type === "recovery" || explicitNext === "/reset-password";
  let next = safeNext(explicitNext, origin);
  if (isRecovery) {
    next = continueTo
      ? `/reset-password?next=${encodeURIComponent(safeNext(continueTo, origin))}`
      : "/reset-password";
  }

  // A provider that was refused (consent denied) comes back with an error and no code. Landing the
  // seller signed out on their destination with no word of why reads as a broken sign-in.
  if (searchParams.get("error") || searchParams.get("error_description")) {
    return NextResponse.redirect(`${origin}/login?error=link_failed`);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    // A code with no client to exchange it is not a sign-in: say so instead of pretending.
    if (!supabase) return NextResponse.redirect(`${origin}/login?error=link_failed`);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // A reason code, not Supabase's text: /login shows only its own wording (see login/page.tsx).
      return NextResponse.redirect(`${origin}/login?error=link_failed`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
