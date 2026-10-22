import { NextResponse } from "next/server";
import { getApiUser, unauthorizedJsonResponse } from "@/lib/auth";
import { fetchProStatus } from "@/lib/license";
import { serviceUnavailableResponse } from "@/lib/licenseGuard";

export const dynamic = "force-dynamic";

/**
 * Whether the signed-in account is a verified professional, and how many case credits it can spend
 * now. Reads only the account's own rows; verification itself is done by hand by the founder.
 */
export async function GET() {
  const user = await getApiUser();
  if (!user) return unauthorizedJsonResponse();
  try {
    return NextResponse.json(await fetchProStatus(user.id), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return serviceUnavailableResponse();
  }
}
