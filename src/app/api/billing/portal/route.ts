import { NextResponse } from "next/server";
import { getApiUser, unauthorizedJsonResponse } from "@/lib/auth";
import { fetchProSubscription } from "@/lib/license";
import { serviceUnavailableResponse } from "@/lib/licenseGuard";
import { rateLimitCompose, tooManyRequestsResponse } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/**
 * A link to cancel or manage a Pro plan (22 Oct 2026). A subscription must be as easy to stop as it
 * was to start, so this opens Paddle's own customer portal for the signed-in account's own
 * subscription and returns its address. It needs `PADDLE_API_KEY` (a server-only secret); without it
 * it answers 503 with `portal_unavailable`, and the Billing page then tells the seller to write to
 * billing@, which cancels it the same day.
 *
 * Nothing about any other customer can be reached: the customer and subscription ids come from this
 * account's own licence row, never from the request.
 */
export async function POST() {
  const user = await getApiUser();
  if (!user) return unauthorizedJsonResponse();
  const rate = await rateLimitCompose(user);
  if (!rate.success) return tooManyRequestsResponse(rate);
  const apiKey = process.env.PADDLE_API_KEY;
  let subscription;
  try {
    subscription = await fetchProSubscription(user.id);
  } catch {
    return serviceUnavailableResponse();
  }
  if (!subscription)
    return NextResponse.json({ error: "No active Pro plan on this account." }, { status: 404 });
  if (!apiKey)
    return NextResponse.json(
      { error: "The billing portal is not switched on.", code: "portal_unavailable" },
      { status: 503 },
    );
  const base =
    process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
      ? "https://api.paddle.com"
      : "https://sandbox-api.paddle.com";
  try {
    const res = await fetch(
      `${base}/customers/${encodeURIComponent(subscription.customerId)}/portal-sessions`,
      {
        method: "POST",
        signal: AbortSignal.timeout(8000),
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_ids: [subscription.subscriptionId] }),
      },
    );
    if (!res.ok)
      return NextResponse.json(
        { error: "The billing portal could not be opened.", code: "portal_unavailable" },
        { status: 503 },
      );
    const body = (await res.json()) as {
      data?: {
        urls?: {
          general?: { overview?: string };
          subscriptions?: { id?: string; cancel_subscription?: string }[];
        };
      };
    };
    const own = body.data?.urls?.subscriptions?.find((s) => s.id === subscription.subscriptionId);
    const url = own?.cancel_subscription ?? body.data?.urls?.general?.overview;
    if (!url || !url.startsWith("https://"))
      return NextResponse.json(
        { error: "The billing portal could not be opened.", code: "portal_unavailable" },
        { status: 503 },
      );
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json(
      { error: "The billing portal could not be opened.", code: "portal_unavailable" },
      { status: 503 },
    );
  }
}
