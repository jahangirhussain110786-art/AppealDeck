import { NextResponse } from "next/server";
import { getApiUser, unauthorizedJsonResponse } from "@/lib/auth";
import { deliverPurchaseEmails } from "@/lib/purchaseOutbox";
import { rateLimitCompose, tooManyRequestsResponse } from "@/lib/ratelimit";
export async function POST() {
  const user = await getApiUser();
  if (!user) return unauthorizedJsonResponse();
  const rate = await rateLimitCompose(user);
  if (!rate.success) return tooManyRequestsResponse(rate);
  try {
    return NextResponse.json(await deliverPurchaseEmails(user.id));
  } catch {
    return NextResponse.json({ error: "Confirmation delivery is pending" }, { status: 503 });
  }
}
