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

test("Dex's line follows what the visitor is doing on the decoder", async ({ page }) => {
  await page.goto("/decode");
  await expect(page.getByText("Paste your notice. I mark what matters.")).toBeVisible();
  await page
    .getByLabel("Your notice")
    .fill("Subject: your account\n\nPlease send an invoice for ASIN B0DN3Y6RW9.");
  // once there is text he tells the visitor what to do next
  await expect(
    page.getByText(/Press Decode when it is all pasted\.|Paste the whole email, top to bottom\./),
  ).toBeVisible();
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  await expect(page.getByText("The problem").first()).toBeVisible();
  // and when the answer is on screen, where to start
  await expect(page.getByText("Start with what Amazon asks for.")).toBeVisible();
});
