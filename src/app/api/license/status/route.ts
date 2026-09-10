import { NextResponse } from "next/server";
import { getApiUser, unauthorizedJsonResponse } from "@/lib/auth";
import { fetchLicenseByEmail } from "@/lib/license";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return unauthorizedJsonResponse();
  }
  const { status, plan } = await fetchLicenseByEmail(user.email);
  return NextResponse.json({ status, plan }, { headers: { "Cache-Control": "no-store" } });
}
