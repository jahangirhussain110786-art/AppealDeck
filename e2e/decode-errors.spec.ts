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

/**
 * 7 Oct 2026 (launch audit): a pasted Amazon reply is not a notice to classify. It said "The
 * problem: Notice not clearly classified" and "Reply due: No date stated", which mean nothing for a
 * reply; only the scam check applies. The reply banner and its way into the case stay.
 */
test("a pasted Amazon reply shows no problem or due-date tiles", async ({ page }) => {
  await page.goto("/decode");
  await page
    .getByLabel("Your notice")
    .fill(
      "Hello,\n\nThank you for sending your appeal. We reviewed the information you provided, but it doesn't address the root cause. We are unable to reinstate your selling account at this time. Please submit a new Plan of Action with a detailed root cause, the actions you have taken, and clear preventive measures.\n\nBest regards,\nSeller Performance Team",
    );
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /looks like Amazon.s reply/i }).first(),
  ).toBeVisible();
  await expect(page.getByText("The problem", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Reply due", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Scam check", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open my case" })).toBeVisible();
});
