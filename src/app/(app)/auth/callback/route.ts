import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safeNext";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const explicitNext = searchParams.get("next");
  const continueTo = searchParams.get("continue");

  let next = safeNext(explicitNext, origin);
  if (type === "recovery") {
    next = continueTo
      ? `/reset-password?next=${encodeURIComponent(safeNext(continueTo, origin))}`
      : "/reset-password";
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        // A reason code, not Supabase's text: /login shows only its own wording (see login/page.tsx).
        return NextResponse.redirect(`${origin}/login?error=link_failed`);
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
