import { expect, test, type Page } from "@playwright/test";
import { ANNOUNCEMENT_BAR } from "../src/content/announcements";

// AM-30 (25 Sep 2026): the announcement bar above the header on the public pages.
const first = ANNOUNCEMENT_BAR.items[0]!;
const second = ANNOUNCEMENT_BAR.items[1]!;
const bar = (page: Page) => page.getByRole("region", { name: ANNOUNCEMENT_BAR.labels.region });

test.describe("Announcement bar", () => {
  test("rotates on its own, stops when paused, and moves the seller's way by hand", async ({
    page,
  }) => {
    test.skip(ANNOUNCEMENT_BAR.mode !== "rotate", "the bar is not configured to rotate");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(bar(page)).toContainText(first.text);
    await expect(bar(page)).toContainText(second.text, {
      timeout: ANNOUNCEMENT_BAR.intervalMs + 3000,
    });

    await bar(page).getByRole("button", { name: ANNOUNCEMENT_BAR.labels.pause }).click();
    await page.mouse.move(0, 400); // off the bar, so hovering is not what holds it
    const shown = await bar(page).innerText();
    await page.waitForTimeout(ANNOUNCEMENT_BAR.intervalMs + 1000);
    expect(await bar(page).innerText()).toBe(shown);
    await expect(
      bar(page).getByRole("button", { name: ANNOUNCEMENT_BAR.labels.play }),
    ).toBeVisible();
  });

  test("with reduced motion nothing moves on its own, and the arrows step through", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(bar(page)).toContainText(first.text);
    await expect(
      bar(page).getByRole("button", { name: ANNOUNCEMENT_BAR.labels.pause }),
    ).toHaveCount(0);
    await page.waitForTimeout(ANNOUNCEMENT_BAR.intervalMs + 1000);
    await expect(bar(page)).toContainText(first.text);
    await bar(page).getByRole("button", { name: ANNOUNCEMENT_BAR.labels.next }).click();
    await expect(bar(page)).toContainText(second.text);
  });

  test("a dismissed bar stays dismissed on the next page", async ({ page }) => {
    await page.goto("/");
    await bar(page).getByRole("button", { name: ANNOUNCEMENT_BAR.labels.dismiss }).click();
    await expect(bar(page)).toHaveCount(0);
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(bar(page)).toHaveCount(0);
  });

  test("is not shown to a seller working on their case", async ({ page }) => {
    await page.goto("/case");
    await expect(page.locator("#main")).toBeVisible();
    await expect(bar(page)).toHaveCount(0);
  });
});
