import { expect, test } from "@playwright/test";

test.use({ trace: "off", video: "off" });

test("separate guest tabs cannot purge each other's in-progress case", async ({
  page,
  context,
}) => {
  await page.goto("/case?mode=classic&kind=POLICY");
  await page
    .getByPlaceholder("Type your answer...")
    .fill("A supplier review step was missing from our process.");
  await page.getByTestId("interview-continue").click();
  await expect(page.getByText("Key dates", { exact: true })).toBeVisible();
  const other = await context.newPage();
  await other.goto("/dashboard");
  await expect(other.getByText("No case on this device yet", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Key dates", { exact: true })).toBeVisible();
});

test("guest case survives sign-in and remains private after sign-out", async ({ page }) => {
  test.skip(
    !process.env.DEV_LOGIN_EMAIL || !process.env.DEV_LOGIN_PASSWORD,
    "Dev authentication fixture required",
  );
  test.setTimeout(90000);
  await page.goto("/case?mode=classic&kind=POLICY");
  await page
    .getByPlaceholder("Type your answer...")
    .fill("A supplier review step was missing from our process.");
  await page.getByTestId("interview-continue").click();
  await expect(page.getByText("Key dates", { exact: true })).toBeVisible();
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(process.env.DEV_LOGIN_EMAIL!);
  await page.getByLabel(/^password$/i).fill(process.env.DEV_LOGIN_PASSWORD!);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.goto("/case");
  await expect(page.getByText("Key dates", { exact: true })).toBeVisible();
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
  // Return with a new guest draft after this account already has an older case.
  await page.goto("/case?mode=classic&kind=POLICY");
  await page
    .getByPlaceholder("Type your answer...")
    .fill("A second case has a different supplier review gap.");
  await page.getByTestId("interview-continue").click();
  await expect(page.getByText("Key dates", { exact: true })).toBeVisible();
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(process.env.DEV_LOGIN_EMAIL!);
  await page.getByLabel(/^password$/i).fill(process.env.DEV_LOGIN_PASSWORD!);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByLabel("Current case").locator("option")).toHaveCount(2);
  await page.route("**/api/compose", (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({
        error: "An Appeal Pass is required for this case.",
        code: "case_pass_required",
      }),
    }),
  );
  await page.goto("/compose");
  await expect(page.getByText("$199", { exact: false }).first()).toBeVisible();
});
