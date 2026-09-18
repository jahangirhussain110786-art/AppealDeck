import { NextRequest, NextResponse } from "next/server";
import { deliverPurchaseEmails } from "@/lib/purchaseOutbox";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await deliverPurchaseEmails());
  } catch {
    return NextResponse.json({ error: "Queue unavailable" }, { status: 503 });
  }
}
