import { expect, test, type BrowserContext } from "@playwright/test";

/**
 * A seller who comes back to a case after their sign-in has expired (30 Sep 2026).
 *
 * The access token lasts an hour; sellers routinely return after days. The page render refreshes
 * the session — spending the refresh token — but a page render cannot save the new cookies, so the
 * proxy has to. This test proves the whole path against the real Supabase, with no shortcut:
 *
 * 1. sign in as the dev account and note the session cookie;
 * 2. rewrite it so it says it expired two minutes ago (a real, refreshable session — only its
 *    clock is wrong);
 * 3. request a page that needs a signed-in seller, using the request API so no page script runs.
 *    That matters: the browser's own client would refresh the session on load and hide the fault,
 *    which is why ordinary tests never saw it;
 * 4. check the response carries the refreshed session cookie, then request again and check the
 *    seller is still signed in without needing another refresh.
 *
 * Verified 30 Sep 2026 against the old proxy: the first request came back signed in but with no
 * cookie, so the new tokens were dropped and every later request had to refresh again. (A second
 * request twelve seconds later still succeeded on this Supabase project, so no forced sign-out was
 * reproduced; whether one happens depends on the project's refresh-token reuse setting.)
 */

const AUTH_COOKIE = /^sb-.+-auth-token(?:\.(\d+))?$/;
const CHUNK = 3180; // @supabase/ssr's cookie chunk size

test.skip(
  !process.env.DEV_LOGIN_EMAIL || !process.env.DEV_LOGIN_PASSWORD,
  "Dev authentication fixture required",
);

async function ageSession(context: BrowserContext): Promise<string> {
  const all = await context.cookies();
  const parts = all
    .filter((c) => AUTH_COOKIE.test(c.name))
    .sort(
      (a, b) =>
        Number(AUTH_COOKIE.exec(a.name)![1] ?? 0) - Number(AUTH_COOKIE.exec(b.name)![1] ?? 0),
    );
  expect(parts.length, "the sign-in should have left a session cookie").toBeGreaterThan(0);

  const baseName = parts[0]!.name.replace(/\.\d+$/, "");
  const joined = parts.map((c) => c.value).join("");
  const encoded = joined.startsWith("base64-");
  const json = encoded
    ? Buffer.from(joined.slice("base64-".length), "base64url").toString("utf8")
    : decodeURIComponent(joined);
  const session = JSON.parse(json) as { expires_at: number };
  session.expires_at = Math.floor(Date.now() / 1000) - 120;

  const rewritten = JSON.stringify(session);
  const value = encoded
    ? `base64-${Buffer.from(rewritten, "utf8").toString("base64url")}`
    : encodeURIComponent(rewritten);
  const pieces = value.match(new RegExp(`.{1,${CHUNK}}`, "g")) ?? [value];

  const template = parts[0]!;
  await context.clearCookies({ name: AUTH_COOKIE });
  await context.addCookies(
    pieces.map((piece, i) => ({
      name: pieces.length === 1 ? baseName : `${baseName}.${i}`,
      value: piece,
      domain: template.domain,
      path: template.path,
      httpOnly: template.httpOnly,
      secure: template.secure,
      sameSite: template.sameSite,
      expires: template.expires,
    })),
  );
  return baseName;
}

test("a seller returning after the session expired stays signed in, and the refresh is saved", async ({
  page,
  context,
}) => {
  test.setTimeout(120_000);

  await page.goto("/login");
  await page.getByLabel(/email/i).fill(process.env.DEV_LOGIN_EMAIL!);
  await page.getByLabel(/^password$/i).fill(process.env.DEV_LOGIN_PASSWORD!);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/dashboard/);

  const cookieName = await ageSession(context);

  // /billing sends a signed-out visitor to /login, so a 200 means the server still saw the seller.
  const first = await page.request.get("/billing", { maxRedirects: 0 });
  expect(first.status(), "the first visit after expiry should still be signed in").toBe(200);

  const saved = first
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie" && h.value.startsWith(cookieName));
  expect(
    saved.length,
    "the refreshed session should be saved to the browser, not dropped",
  ).toBeGreaterThan(0);

  // The saved cookie must actually work: the next visit needs no refresh, so it saves nothing more.
  const second = await page.request.get("/billing", { maxRedirects: 0 });
  expect(second.status(), "the next visit should be signed in").toBe(200);
  const again = second
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie" && h.value.startsWith(cookieName));
  expect(again, "a session that was just refreshed should not need refreshing again").toHaveLength(
    0,
  );
});
