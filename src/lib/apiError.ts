/**
 * The sentence to show a seller when one of our API calls fails.
 *
 * The server's own message wins when it sent one (it is written for that request). Otherwise a
 * rate limit or a server error is said to be the service's trouble, never the seller's: a platform
 * error page (a gateway timeout, say) is HTML, and reading it as JSON used to put "Unexpected token
 * '<'" in front of a seller who had just paid for a response (found 7 Oct 2026, launch audit).
 */
export function apiErrorMessage(status: number, body: unknown, fallback: string): string {
  const message = (body as { error?: unknown } | null)?.error;
  if (typeof message === "string" && message.trim()) return message;
  if (status === 429 || status >= 500)
    return "The service is not available right now. Try again in a minute.";
  return fallback;
}
