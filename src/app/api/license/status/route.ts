import { NextResponse } from "next/server";
import { getApiUser, unauthorizedJsonResponse } from "@/lib/auth";
import { fetchLicenseForUser } from "@/lib/license";
import { serviceUnavailableResponse } from "@/lib/licenseGuard";

export const dynamic = "force-dynamic";

export async function GET(request?: Request) {
  const user = await getApiUser();
  if (!user) {
    return unauthorizedJsonResponse();
  }
  const caseId = request
    ? (new URL(request.url).searchParams.get("caseId") ?? undefined)
    : undefined;
  try {
    const { status, plan } = await fetchLicenseForUser(user.id, caseId);
    return NextResponse.json({ status, plan }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return serviceUnavailableResponse();
  }
}
