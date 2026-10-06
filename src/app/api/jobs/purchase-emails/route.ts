import { NextRequest, NextResponse } from "next/server";
import { deliverPurchaseEmails } from "@/lib/purchaseOutbox";
import { isCronAuthorized } from "@/lib/cronAuth";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await deliverPurchaseEmails());
  } catch {
    return NextResponse.json({ error: "Queue unavailable" }, { status: 503 });
  }
}
