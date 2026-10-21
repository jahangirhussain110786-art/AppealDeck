import { expect, test, type Page } from "@playwright/test";

// Dex, the guide in the corner of every page: one line, a picture that never catches a click, two small
// buttons, and a "hide" choice that is remembered.
const tip = (page: Page) => page.getByRole("button", { name: "Show Dex's tip" });
const picture = (page: Page) => page.locator("[data-no-print] img").first();

test("Dex greets on the home page, can be hidden, and stays hidden after a reload", async ({
  page,
}) => {
  await page.goto("/");
  await expect(tip(page)).toBeVisible();
  await expect(page.getByText("Paste a notice and I will mark it.")).toBeVisible();

  await page.getByRole("button", { name: "Hide Dex" }).click();
  await expect(tip(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Show Dex, your guide" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "Show Dex, your guide" })).toBeVisible();
  await expect(tip(page)).toHaveCount(0);

  await page.getByRole("button", { name: "Show Dex, your guide" }).click();
  await expect(tip(page)).toBeVisible();
});

test("Dex is calm where a seller may be reading bad news, and never catches a click", async ({
  page,
}) => {
  await page.goto("/decode");
  const img = picture(page);
  await expect(img).toHaveAttribute("src", /dex-explaining-/);
  await expect(img).toHaveAttribute("alt", "");
  // A click on the picture goes to whatever is underneath it.
  await expect(img).toHaveCSS("pointer-events", "none");
  // The decoder still works with him on screen.
  await page
    .getByLabel("Your notice")
    .fill("Subject: your account\n\nPlease send an invoice for ASIN B0DN3Y6RW9.");
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  await expect(page.getByText("The problem").first()).toBeVisible();
});

test("the tip button shows and hides his line, and he is not a chat box", async ({ page }) => {
  await page.goto("/pricing");
  const line = page.getByText("Compare the plans, then choose.");
  await expect(line).toBeVisible();
  await tip(page).click();
  await expect(line).toHaveCount(0);
  await tip(page).click();
  await expect(line).toBeVisible();
  const corner = page.locator("[data-no-print]").filter({ has: tip(page) });
  await expect(corner.getByRole("textbox")).toHaveCount(0);
});

test("Dex wakes up in 3D once the visitor moves, and draws something", async ({ page }) => {
  // Automated browsers never get 3D unless asked, so the page's own speed is not changed under test.
  await page.addInitScript(() => window.localStorage.setItem("appealdeck-dex3d", "on"));
  await page.goto("/pricing");
  const hasWebGL = await page.evaluate(() =>
    Boolean(document.createElement("canvas").getContext("webgl2")),
  );
  test.skip(!hasWebGL, "This browser has no WebGL, so the picture stays, which is the fallback.");
  await page.mouse.move(300, 300);
  await page.mouse.move(640, 480);
  const canvas = page.locator("[data-no-print] canvas");
  await expect(canvas).toBeVisible({ timeout: 45_000 });
  // an empty canvas is a tiny transparent PNG; a drawn character is much larger
  await expect
    .poll(async () => (await canvas.screenshot()).length, { timeout: 30_000 })
    .toBeGreaterThan(8000);
  // the hide control still works with 3D on
  await page.getByRole("button", { name: "Hide Dex" }).click();
  await expect(canvas).toHaveCount(0);
});
