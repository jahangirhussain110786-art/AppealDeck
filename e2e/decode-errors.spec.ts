import { expect, test } from "@playwright/test";
import { SAMPLE_NOTICE_TEXT } from "../src/content/sampleNotice";

/**
 * 6 Oct 2026 (novice walk, phone width): a refused paste says one thing, once, and offers a way
 * back to the box with the text still in it; and Back from the case keeps the notice.
 */
test("a paste that is not a notice is refused once, and Edit what I pasted focuses the box", async ({
  page,
}) => {
  await page.goto("/decode");
  const box = page.getByLabel("Your notice");
  const pasted = "Please review this and get back to me when you can, thank you very much.";
  await box.fill(pasted);
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  // Not the route announcer, which is also an alert and is empty.
  const alert = page.getByRole("alert").filter({ hasText: "whole message" });
  await expect(alert).toContainText("whole message");
  // Not repeated: the old page appended "Paste the full Amazon notice and try again." to it.
  await expect(alert).not.toContainText("try again");
  await expect(alert).toContainText("If this is a letter you wrote to Amazon, it is not a notice.");
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);
  await page.getByRole("button", { name: "Edit what I pasted" }).click();
  await expect(box).toBeFocused();
  await expect(box).toHaveValue(pasted);
});

test("Back from Open case workspace restores the pasted notice and its result", async ({
  page,
}) => {
  await page.goto("/decode");
  await page.getByRole("button", { name: "Try a sample notice" }).click();
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  const open = page.getByRole("link", { name: "Open case workspace", exact: true });
  await expect(open).toBeVisible();
  await open.click();
  await page.waitForURL(/\/case/);
  await page.goBack();
  await expect(open).toBeVisible();
  // The notice is on screen again, marked up.
  await expect(page.getByRole("region", { name: "Your notice, marked up" })).toContainText(
    SAMPLE_NOTICE_TEXT.slice(0, 20),
  );
});
