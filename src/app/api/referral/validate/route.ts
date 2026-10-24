import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser, unauthorizedJsonResponse } from "@/lib/auth";
import { rateLimitCompose, tooManyRequestsResponse } from "@/lib/ratelimit";
import { validateReferral } from "@/lib/referrals";

export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user) return unauthorizedJsonResponse();
  const rate = await rateLimitCompose(user);
  if (!rate.success) return tooManyRequestsResponse(rate);
  const body = z.object({ code: z.string().max(32) }).safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Enter a partner code." }, { status: 400 });
  try {
    const offer = await validateReferral(body.data.code, user.id);
    return NextResponse.json({ code: offer.code, discount: "$25", currency: "USD" });
  } catch {
    return NextResponse.json(
      { error: "We could not apply that code. Check it or remove it to continue." },
      { status: 422 },
    );
  }
}
