import { NextResponse } from "next/server";
import { foundingSpotsLeft } from "@/lib/founding";
import { foundingEnabled, foundingSpots } from "@/lib/plans";

export const dynamic = "force-dynamic";

/**
 * How many founding spots are left, for the pricing page. Public on purpose: a counter nobody can
 * check is not a counter. The answer is cached for a minute by the CDN so the page cannot be used to
 * hammer Paddle, and it says `null` rather than a guess when the offer is off or the count
 * cannot be read, in which case the page shows no offer at all.
 */
export async function GET() {
  if (!foundingEnabled()) {
    return NextResponse.json(
      { spotsLeft: null, total: null },
      { headers: { "Cache-Control": "public, s-maxage=60" } },
    );
  }
  let spotsLeft: number | null = null;
  try {
    spotsLeft = await foundingSpotsLeft();
  } catch {
    spotsLeft = null;
  }
  return NextResponse.json(
    { spotsLeft, total: foundingSpots() },
    {
      headers: {
        "Cache-Control": spotsLeft === null ? "no-store" : "public, s-maxage=60",
      },
    },
  );
}
