import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Retired route (founder direction, 22 Sep 2026: "retire the classic interview").
 *
 * `/compose` was the classic interview's drafting step. Every case now lives in the workspace,
 * whose Response tab does the same job with the request routing, evidence links and submission
 * history attached — so this redirects there rather than 404ing, because sellers have this URL in
 * bookmarks and in the purchase-confirmation flow.
 *
 * `requireUser("/compose")` is kept deliberately: signed-out visitors must still land on
 * `/login?next=/compose` so they return to a real destination after signing in, and two e2e tests
 * assert exactly that.
 */
export default async function ComposePage() {
  await requireUser("/compose");
  redirect("/case?view=response");
}
