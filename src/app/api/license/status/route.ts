import { NextResponse } from "next/server";
import { getApiUser, unauthorizedJsonResponse } from "@/lib/auth";
import { fetchDocumentReview, fetchLicenseForUser } from "@/lib/license";
import { serviceUnavailableResponse } from "@/lib/licenseGuard";

export const dynamic = "force-dynamic";

/**
 * What the signed-in account holds, for one case when `?caseId=` is given.
 *
 * - `status` and `plan` answer "may this account prepare a response?": a Pass bound to the case,
 *   one not yet bound, or an Account Pass. A document review is deliberately not a Pass.
 * - `?for=documents` instead answers "may the AI read this case's documents?", which a document
 *   review also allows. The document check asks this before it sends a file anywhere.
 * - `hasReview` (with a case) says whether the case has a document review, so the pricing page can
 *   show the Appeal Pass at its credited price.
 */
export async function GET(request?: Request) {
  const user = await getApiUser();
  if (!user) {
    return unauthorizedJsonResponse();
  }
  const params = request ? new URL(request.url).searchParams : null;
  const caseId = params?.get("caseId") ?? undefined;
  const forDocuments = params?.get("for") === "documents";
  try {
    const { status, plan, expiresAt } = await fetchLicenseForUser(user.id, caseId);
    const hasReview = caseId ? await fetchDocumentReview(user.id, caseId) : false;
    if (forDocuments && status !== "active" && hasReview)
      return NextResponse.json(
        { status: "active", plan: "document_review", expiresAt: null, hasReview },
        { headers: { "Cache-Control": "no-store" } },
      );
    return NextResponse.json(
      { status, plan, expiresAt: expiresAt ?? null, hasReview },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return serviceUnavailableResponse();
  }
}
