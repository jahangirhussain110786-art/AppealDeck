import { expect, test } from "@playwright/test";

/**
 * G-01 (12 Oct 2026): the free reply reader. A seller who has already appealed pastes Amazon's
 * reply into the decoder and is told, in plain words and with Amazon's own sentence beside it,
 * whether it refused, asked for documents or reinstated. Always labelled as our reading.
 */

const REFUSAL =
  "Thank you for your appeal. We have reviewed the plan of action you submitted. Unfortunately, we are unable to reinstate your selling account at this time. The plan of action does not address our concerns.";
const REINSTATED =
  "We have reviewed your appeal and reinstated your account. Your selling privileges have been restored.";

async function decode(page: import("@playwright/test").Page, text: string) {
  await page.goto("/decode");
  await page
    .getByRole("textbox", { name: /notice/i })
    .first()
    .fill(text);
  await page.getByRole("button", { name: "Decode", exact: true }).click();
}

test("a refusal is read in plain words, with the sentence that says so", async ({ page }) => {
  await decode(page, REFUSAL);
  const main = page.locator("main");
  await expect(main.getByText("What this reply says", { exact: true })).toBeVisible();
  await expect(
    main.getByText("It says Amazon has not reinstated you on what you sent, and asks for more."),
  ).toBeVisible();
  await expect(main.getByText(/unable to reinstate your selling account/).first()).toBeVisible();
  await expect(main.getByText(/Our reading of the words, not Amazon's/)).toBeVisible();
  // The way into a case from the reply is still there.
  await expect(main.getByRole("link", { name: "Open my case" })).toBeVisible();
});

test("a reinstatement is read as one, and says nothing about what happens next", async ({
  page,
}) => {
  await decode(page, REINSTATED);
  const main = page.locator("main");
  await expect(main.getByText("It says your account or listings are reinstated.")).toBeVisible();
  await expect(main.getByText(/Our reading of the words/)).toBeVisible();
});

test("the door is on the page before anything is pasted", async ({ page }) => {
  await page.goto("/decode");
  await expect(
    page.getByText(/Already appealed\? Paste Amazon's reply here instead/),
  ).toBeVisible();
  await page.goto("/");
  await expect(page.getByText("Already appealed? Paste Amazon's reply instead.")).toBeVisible();
});
