/**
 * One polite GET per source per day (4 Nov 2026). Five requests, a named user agent, a timeout and
 * two retries on a server-side hiccup. No crawling, no JavaScript execution, no login.
 *
 * The sign-in redirect is treated as a failure, not a page: Amazon answers an unauthenticated
 * request for a Seller Central help article with a 200 whose body is the sign-in form, so checking
 * only the status code is exactly how a watcher ends up reporting "no change" for months.
 */

const USER_AGENT =
  "AppealDeckPolicyWatch/1.0 (+https://appealdeck.com; policy-watch@appealdeck.com)";

const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchSource(source, { timeoutMs = 30_000, attempts = 3 } = {}) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (attempt > 0) await sleep(attempt === 1 ? 2_000 : 6_000);
    try {
      const response = await fetch(source.url, {
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          "user-agent": USER_AGENT,
          accept: "application/rss+xml, application/xml, text/html;q=0.9, */*;q=0.5",
          "accept-language": "en-US,en;q=0.9",
        },
      });

      if (/\/ap\/signin/i.test(response.url)) {
        return { ok: false, reason: "redirected to the sign-in page", status: response.status };
      }
      if (RETRY_STATUSES.has(response.status) && attempt < attempts - 1) {
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }
      if (!response.ok) {
        return { ok: false, reason: `HTTP ${response.status}`, status: response.status };
      }

      const body = await response.text();
      return {
        ok: true,
        body,
        status: response.status,
        finalUrl: response.url,
        bytes: body.length,
      };
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) break;
    }
  }
  return { ok: false, reason: lastError instanceof Error ? lastError.message : String(lastError) };
}
