import { expect, test } from "@playwright/test";
import { signInAsDev, skipWithoutDevAccount } from "./auth";

/**
 * The first screen of a case on a phone (24 Oct 2026). The sidebar follows every tab, so the
 * deadline, the guest warning and "New case" were below a tab's whole content. These checks pin the
 * order: the context sits above the tabs, and an empty case asks for the notice first.
 */
test("a phone leads with the guest warning and the paste step, above the tabs", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/case");

  await expect(page.getByRole("note")).toContainText("Your work stays in this tab");
  await expect(page.getByText("Paste your notice", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Check how we read your notice", { exact: true })).toHaveCount(0);

  const warningBox = await page.getByRole("note").boundingBox();
  const tabsBox = await page.getByRole("tablist").first().boundingBox();
  expect(warningBox!.y).toBeLessThan(tabsBox!.y);
});

test("a signed-in seller on a phone can start another case above the tabs, and sees no guest warning", async ({
  page,
}) => {
  skipWithoutDevAccount();
  await signInAsDev(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/case");

  const newCase = page.getByRole("button", { name: "New case" }).first();
  await expect(newCase).toBeVisible();
  const tabs = page.getByRole("tablist").first();
  await expect(tabs).toBeVisible();
  expect((await newCase.boundingBox())!.y).toBeLessThan((await tabs.boundingBox())!.y);
  await expect(page.getByText("Your work stays in this tab")).toHaveCount(0);
});
