import { expect, test } from "@playwright/test";

/**
 * Found on 7 Oct 2026 by running the suite in WebKit (Safari's engine): text entered before a
 * page's JavaScript arrives was lost or ignored. On /decode the pasted notice stayed in the box
 * while the Decode button stayed disabled for good; on the sign-in forms the typed email was wiped
 * when React took over. On a slow phone connection a seller can act on the page a second or two
 * before it is interactive, and pasting the notice is the first thing they do.
 *
 * The page's scripts are held back here so the box is filled before the page is interactive, in
 * every browser the suite runs in. Chromium and Firefox always coped; WebKit did not.
 */
test.use({ viewport: { width: 1000, height: 800 } });

const NOTICE =
  "Subject: Account deactivated\nDate: 2 October 2026\n\nYour Amazon selling account has been deactivated for inauthentic items. You may appeal within 30 days. Submit a plan of action.";

async function slowScripts(page: import("@playwright/test").Page, ms = 1500) {
  await page.route("**/_next/static/chunks/**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
    await route.continue();
  });
}

test("a notice pasted before the page is interactive still enables Decode", async ({ page }) => {
  await slowScripts(page);
  await page.goto("/decode", { waitUntil: "domcontentloaded" });
  const box = page.locator("#notice");
  await box.fill(NOTICE);
  // Hydration finishes; the box keeps its text and the button follows it.
  await expect(page.getByRole("button", { name: "Decode", exact: true })).toBeEnabled({
    timeout: 15_000,
  });
  await expect(box).toHaveValue(NOTICE);
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  await expect(page.getByText("Inauthentic item complaint").first()).toBeVisible();
});

test("an email typed before the sign-in page is interactive is still there afterwards", async ({
  page,
}) => {
  await slowScripts(page);
  for (const path of ["/login", "/signup", "/forgot-password"]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const email = page.getByLabel(/^email/i);
    await email.fill("seller@example.com");
    // Wait for the page to become interactive (the form's own scripts have run).
    await page.waitForLoadState("networkidle");
    await expect(email, path).toHaveValue("seller@example.com");
  }
});

test("a notice pasted into the home page box before it is interactive is carried to the decoder", async ({
  page,
}) => {
  await slowScripts(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator("#hero-notice").fill(NOTICE);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("#hero-notice")).toHaveValue(NOTICE);
  await page
    .getByRole("button", { name: /decode/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/decode/);
  await expect(page.getByText("Inauthentic item complaint").first()).toBeVisible({
    timeout: 15_000,
  });
});
