import { expect, test, type Page } from "@playwright/test";

/**
 * The theme contract: the app follows the browser's colour scheme until the seller picks a theme
 * in the app. From then on the pick sticks — across reloads and against the browser's own scheme
 * — until they choose again, and "System" hands control back to the browser.
 */
async function openThemeMenu(page: Page) {
  const trigger = page.getByRole("button", { name: "Colour theme" });
  const menu = page.getByRole("menu");
  // The first click can land before the page is interactive (the prehydration spec pins that
  // contract app-wide), so open the menu only when a click actually opens it.
  await expect(async () => {
    if (!(await menu.isVisible())) await trigger.click();
    await expect(menu).toBeVisible();
  }).toPass({ timeout: 15_000 });
  return menu;
}

test.describe("colour theme", () => {
  test("follows the browser until a choice is made, then the choice sticks", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.goto("/");

    const html = page.locator("html");
    await expect(html).not.toHaveClass(/dark/);

    const menu = await openThemeMenu(page);
    await menu.getByRole("menuitemcheckbox", { name: "Dark" }).click();
    await expect(html).toHaveClass(/dark/);

    // The pick survives a reload and overrides a light browser.
    await page.reload();
    await expect(html).toHaveClass(/dark/);

    // "System" gives the decision back to the browser, live.
    await openThemeMenu(page);
    await page.getByRole("menuitemcheckbox", { name: "System" }).click();
    await expect(html).not.toHaveClass(/dark/);

    await page.emulateMedia({ colorScheme: "dark" });
    await expect(html).toHaveClass(/dark/);
  });
});
