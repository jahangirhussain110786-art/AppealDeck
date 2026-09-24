import { expect, test } from "@playwright/test";

/**
 * These tests guard product guarantees, not a particular screen. They were originally written
 * against `/case?mode=classic` — the guided interview — which was retired on 22 Sep 2026. The
 * guarantees did not go away with it, so the specs are rewritten to drive the case workspace, the
 * only journey now, rather than deleted alongside the surface they happened to use.
 *
 * What is being guarded, and why it is worth the wall-clock these tests cost:
 *  - a second browser tab must not destroy a guest's in-progress case (this project lost a case
 *    file to exactly that race on 19 Sep 2026)
 *  - a guest's work must survive signing in, and must not be visible after signing out
 *  - the compose API must reject malformed and severity-gated payloads
 */

test.use({ trace: "off", video: "off" });

/** The workspace autosaves drafts on a 900 ms debounce; this waits past it deterministically. */
async function typeNoticeAndSave(page: import("@playwright/test").Page, text: string) {
  await page.getByLabel("Amazon notice").fill(text);
  // Blur so the field commits, then wait out the debounce plus a margin for the vault write.
  await page.getByLabel("Amazon notice").blur();
  await page.waitForTimeout(1500);
}

test("separate guest tabs cannot purge each other's in-progress case", async ({
  page,
  context,
}) => {
  const notice = "A supplier review step was missing from our process.";
  await page.goto("/case?kind=POLICY");
  await typeNoticeAndSave(page, notice);

  const other = await context.newPage();
  await other.goto("/dashboard");
  await expect(other.getByText("No case on this device yet", { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Amazon notice")).toHaveValue(notice);
});

test("guest case survives sign-in and remains private after sign-out", async ({ page }) => {
  test.skip(
    !process.env.DEV_LOGIN_EMAIL || !process.env.DEV_LOGIN_PASSWORD,
    "Dev authentication fixture required",
  );
  test.setTimeout(90000);

  const firstNotice = "A supplier review step was missing from our process.";
  await page.goto("/case?kind=POLICY");
  await typeNoticeAndSave(page, firstNotice);

  await page.goto("/login");
  await page.getByLabel(/email/i).fill(process.env.DEV_LOGIN_EMAIL!);
  await page.getByLabel(/^password$/i).fill(process.env.DEV_LOGIN_PASSWORD!);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/dashboard/);

  await page.goto("/case");
  await expect(page.getByLabel("Amazon notice")).toHaveValue(firstNotice);

  // The compose API's own guards, checked from a real signed-in session.
  const malformed = await page.request.post("/api/compose", {
    data: { caseData: { id: "test-case", kind: "POLICY", actionItems: [null] } },
  });
  expect(malformed.status()).toBe(400);
  const severe = await page.request.post("/api/compose", {
    data: { caseData: { id: "test-case", kind: "INAUTHENTIC_DOCUMENTS" } },
  });
  expect(severe.status()).toBe(403);

  await page.getByRole("button", { name: /account|profile/i }).click();
  await page.getByRole("menuitem", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/login/);
  await page.goto("/dashboard");
  await expect(page.getByText("No case on this device yet", { exact: true })).toBeVisible();

  // A new guest draft, started while the account already holds an older case.
  await page.goto("/case?kind=POLICY");
  await typeNoticeAndSave(page, "A second case has a different supplier review gap.");

  await page.goto("/login");
  await page.getByLabel(/email/i).fill(process.env.DEV_LOGIN_EMAIL!);
  await page.getByLabel(/^password$/i).fill(process.env.DEV_LOGIN_PASSWORD!);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole("region", { name: "Your cases" }).getByRole("button")).toHaveCount(2);
});
