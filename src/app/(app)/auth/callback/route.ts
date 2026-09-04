import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const explicitNext = searchParams.get("next");

  let next = explicitNext ?? "/";
  if (type === "recovery") {
    next = "/reset-password";
  }

  if (code) {
    const supabase = createSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
