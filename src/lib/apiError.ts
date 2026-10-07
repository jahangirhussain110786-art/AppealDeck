/**
 * The sentence to show a seller when one of our API calls fails.
 *
 * The server's own message wins when it sent one (it is written for that request). A device-limit
 * refusal arrived as the bare code "device_cap_reached" and was shown as "Action not completed:
 * device_cap_reached" to a seller who had just paid (found 7 Oct 2026, launch audit). Otherwise a
 * rate limit or a server error is said to be the service's trouble, never the seller's: a platform
 * error page (a gateway timeout, say) is HTML, and reading it as JSON used to put "Unexpected token
 * '<'" in front of a seller who had just paid for a response (found 7 Oct 2026, launch audit).
 */
export function apiErrorMessage(status: number, body: unknown, fallback: string): string {
  const fields = body as { message?: unknown; error?: unknown } | null;
  // `message` is the sentence written for the seller. `error` is sometimes a code instead
  // ("device_cap_reached"), which a seller must never be shown, so `message` is read first.
  for (const candidate of [fields?.message, fields?.error])
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  if (status === 429 || status >= 500)
    return "The service is not available right now. Try again in a minute.";
  return fallback;
}
