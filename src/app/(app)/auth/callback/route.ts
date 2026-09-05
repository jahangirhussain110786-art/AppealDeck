import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeNext(explicitNext: string | null, origin: string): string {
  if (!explicitNext) return "/dashboard";
  if (
    !explicitNext.startsWith("/") ||
    explicitNext.startsWith("//") ||
    explicitNext.startsWith("/\\")
  ) {
    return "/dashboard";
  }
  try {
    if (new URL(explicitNext, origin).origin !== origin) {
      return "/dashboard";
    }
  } catch {
    return "/dashboard";
  }
  return explicitNext;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const explicitNext = searchParams.get("next");

  let next = safeNext(explicitNext, origin);
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
