/**
 * Where the Upstash Redis REST credentials come from.
 *
 * Set by hand, they are `UPSTASH_REDIS_REST_URL` / `_TOKEN`. Vercel's Storage → Upstash
 * integration (used for production on 28 Sep 2026) injects the same values as
 * `KV_REST_API_URL` / `KV_REST_API_TOKEN` instead, and without this fallback the rate limiter
 * and the spend breaker would treat production as unconfigured and refuse every request.
 * The explicit UPSTASH_ names win when both are present. The read-only token is never used:
 * the limiter and the breaker both write.
 */
export function redisCredentials(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}
