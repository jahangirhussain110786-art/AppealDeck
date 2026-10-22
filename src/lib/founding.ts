import { supabaseAdmin } from "@/lib/supabase/server";
import { foundingEnabled, foundingSpots } from "@/lib/plans";

/**
 * Founding spots left, or null when the offer is off or the count could not be read (the offer is
 * then simply not shown, never guessed).
 *
 * It counts every Pass ever sold through Paddle, refunded or not, so a refund can never reopen a spot
 * and the number shown can only fall. It is advisory: the hard limit is the usage limit set on the
 * Paddle discount, which Paddle enforces at checkout.
 */
export async function foundingSpotsLeft(): Promise<number | null> {
  if (!foundingEnabled() || !supabaseAdmin) return null;
  const { count, error } = await supabaseAdmin
    .from("licenses")
    .select("id", { count: "exact", head: true })
    .eq("provider", "paddle");
  if (error || count === null) return null;
  return Math.max(0, foundingSpots() - count);
}
