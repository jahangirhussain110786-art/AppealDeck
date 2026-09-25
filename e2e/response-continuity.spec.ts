import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

const question = "What caused the late shipments?";
const otherQuestion = "What have you changed to prevent this?";
const answer = "The carrier missed the scheduled collection on the affected orders.";

async function openQuestionnaire(page: Page) {
  await page.goto("/case");
  await page
    .getByLabel("Amazon notice", { exact: true })
    .fill("Please complete the questionnaire below so we can review your account.");
  await page
    .getByLabel("What the response page asks for")
    .fill(`Answer the following questions.\n1. ${question}\n2. ${otherQuestion}`);
  await page.getByRole("button", { name: "Confirm this route" }).click();
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Response", exact: true }).click();
}

test("clearing a saved response remains blank after autosave and reload", async ({ page }) => {
  await openQuestionnaire(page);
  const field = page.getByLabel("Anything else Amazon should know (optional)");
  await field.fill(answer);
  await page.getByRole("button", { name: "Save response facts" }).click();
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();
  await field.fill("");
  await expect(page.getByText(/Unsaved changes/)).toBeVisible();
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: "Response", exact: true }).click();
  await expect(field).toHaveValue("");
  await expect(page.getByRole("button", { name: "Save response facts" })).toBeEnabled();
});

test("reordering a questionnaire keeps drafts attached to their own questions", async ({
  page,
}) => {
  await openQuestionnaire(page);
  await page.getByLabel(question, { exact: true }).fill(answer);
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Review the request", exact: true }).click();
  await page
    .getByLabel("What the response page asks for")
    .fill(`Answer the following questions.\n1. ${otherQuestion}\n2. ${question}`);
  await page.getByRole("button", { name: "Confirm this route" }).click();
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: "Response", exact: true }).click();
  await expect(page.getByLabel(question, { exact: true })).toHaveValue(answer);
  await expect(page.getByLabel(otherQuestion, { exact: true })).toHaveValue("");
});

test("downloaded case notes contain saved questionnaire answers", async ({ page }) => {
  await openQuestionnaire(page);
  await page.getByLabel(question, { exact: true }).fill(answer);
  await page.getByRole("button", { name: "Save response facts" }).click();
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "History", exact: true }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download case notes" }).click(),
  ]);
  const exported = await readFile((await download.path())!, "utf8");
  expect(exported).toContain(`Question: ${question}\nAnswer: ${answer}`);
  expect(exported).toContain(`Question: ${otherQuestion}\nAnswer: (not answered yet)`);
});

test("confirming covered issues does not discard unfinished response text", async ({ page }) => {
  await page.goto("/case");
  await page
    .getByLabel("Amazon notice", { exact: true })
    .fill(
      "We could not verify the authenticity of the invoices you supplied for the affected products. Separately, your detail page policy violation for ASIN B0EXAMPLE1 remains unresolved. Please provide the supplier invoice.",
    );
  await page.getByLabel("What the response page asks for").fill("Upload the invoice.");
  await page.getByRole("button", { name: "Confirm this route" }).click();
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Response", exact: true }).click();
  await page.getByLabel("Your factual explanation").fill(answer);
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();
  await page.getByLabel("My response addresses every issue listed above.").click();
  await expect(page.getByLabel("My response addresses every issue listed above.")).toBeChecked();
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: "Response", exact: true }).click();
  await expect(page.getByLabel("Your factual explanation")).toHaveValue(answer);
});
