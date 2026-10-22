import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser, unauthorizedJsonResponse } from "@/lib/auth";
import { CaseIdSchema } from "@/lib/caseSchema";
import { spendCaseCredit } from "@/lib/license";
import { serviceUnavailableResponse } from "@/lib/licenseGuard";
import { rateLimitCompose, tooManyRequestsResponse } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const Body = z.object({ caseId: CaseIdSchema });

/**
 * A verified professional spends one case credit to give one case an Appeal Pass. It is a button the
 * professional presses, never something a draft or a check does by itself, so a credit is never
 * spent by accident. The database decides (migration 0018, `use_case_credit`), under a lock, so two
 * presses cannot spend two credits on one case.
 */
export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user) return unauthorizedJsonResponse();
  const rate = await rateLimitCompose(user);
  if (!rate.success) return tooManyRequestsResponse(rate);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a case." }, { status: 400 });
  let result;
  try {
    result = await spendCaseCredit(user.id, parsed.data.caseId);
  } catch {
    return serviceUnavailableResponse();
  }
  switch (result) {
    case "used":
    case "covered":
      return NextResponse.json({ result });
    case "already_used":
      return NextResponse.json({ result }, { status: 409 });
    case "not_verified":
      return NextResponse.json({ result }, { status: 403 });
    case "no_credit":
      return NextResponse.json({ result }, { status: 402 });
  }
}
