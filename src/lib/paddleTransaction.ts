/**
 * Reads what Paddle actually charged for a transaction, at email-delivery time (24 Oct 2026).
 *
 * The outbox row does not store an amount, and the confirmation should state what the buyer paid
 * after any discount rather than only the list price. This is a read-only lookup: any missing key,
 * rejected request or unusable response returns null, and the email falls back to pointing at
 * Paddle's own receipt rather than guessing.
 */

export interface PaidAmount {
  /** Paddle's lowest-unit `grand_total`, which includes any credit applied. */
  amountCents: number;
  currency: string;
}

export async function fetchPaidAmount(transactionId: string): Promise<PaidAmount | null> {
  const key = process.env.PADDLE_API_KEY;
  if (!key || !/^txn_[a-z0-9]+$/i.test(transactionId)) return null;
  const base =
    process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
      ? "https://api.paddle.com"
      : "https://sandbox-api.paddle.com";
  try {
    const response = await fetch(`${base}/transactions/${encodeURIComponent(transactionId)}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return null;
    const { data } = await response.json();
    const totals = data?.details?.totals;
    const raw = totals?.grand_total ?? totals?.total;
    const currency = data?.currency_code;
    if (
      data?.id !== transactionId ||
      typeof raw !== "string" ||
      !/^\d{1,12}$/.test(raw) ||
      typeof currency !== "string" ||
      !/^[A-Z]{3}$/.test(currency)
    )
      return null;
    return { amountCents: Number(raw), currency };
  } catch {
    return null;
  }
}
