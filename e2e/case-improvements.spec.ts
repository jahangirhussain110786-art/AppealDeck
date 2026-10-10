import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

/**
 * 10 Oct 2026: the root-cause coach and the units-sold figure. (The change report needs a recorded
 * submission and so a paid case; it is in workspace.spec.ts beside the other signed-in test.)
 */

async function openPlanOfAction(page: Page) {
  await page.goto("/case");
  await page
    .getByLabel("Amazon notice", { exact: true })
    .fill(
      "Your account has been deactivated. Please submit a Plan of Action explaining the root cause of the issue and the corrective actions you have taken.",
    );
  await page.getByLabel("What the response page asks for").fill("Submit a Plan of Action.");
  await page.getByRole("button", { name: "Yes, this is right" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Response", exact: true }).click();
}

test("the root-cause coach puts the seller's own answers in the box, and adds nothing", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await openPlanOfAction(page);
  await page.getByText("Not sure what to write? Answer five short questions.").click();
  // Real keystrokes, checked at once: what is typed must show as it is typed, not after the save.
  const first = page.getByLabel(/^1\. /);
  await first.pressSequentially("Returned items went back on sale as new");
  await expect(first).toHaveValue("Returned items went back on sale as new", { timeout: 300 });
  await page.getByLabel(/^2\. /).fill("B0EXAMPLE1, 12 to 28 Aug 2026.");
  await page.getByRole("button", { name: "Put my answers in the box" }).click();

  const box = page.getByLabel("What went wrong?", { exact: true });
  await expect(box).toHaveValue(
    "Returned items went back on sale as new. B0EXAMPLE1, 12 to 28 Aug 2026.",
  );
  // Used once: the questions start empty again.
  await expect(page.getByLabel(/^1\. /)).toHaveValue("");

  // With text already in the box, the answers are added below it instead of replacing it.
  await page.getByLabel(/^3\. /).fill("Checking returns");
  await expect(
    page.getByRole("button", { name: "Add my answers below what I wrote" }),
  ).toBeVisible();
});

test("the coach's answers survive a reload", async ({ page }) => {
  test.setTimeout(90_000);
  await openPlanOfAction(page);
  await page.getByText("Not sure what to write? Answer five short questions.").click();
  await page.getByLabel(/^1\. /).fill("Nobody was assigned to open returns");
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.waitForTimeout(1500);
  await expect(page.getByText("Saving…", { exact: true })).toBeHidden();
  await page.reload();
  await page.getByRole("tab", { name: "Response", exact: true }).click();
  await page.getByText("Not sure what to write? Answer five short questions.").click();
  await expect(page.getByLabel(/^1\. /)).toHaveValue("Nobody was assigned to open returns");
});

test("a list of causes is flagged, and one clear cause is not", async ({ page }) => {
  test.setTimeout(90_000);
  await openPlanOfAction(page);
  const box = page.getByLabel("What went wrong?", { exact: true });
  await box.fill(
    "There were several factors on 3 Aug 2026: the supplier was late, our packer was new, and our checklist was out of date.",
  );
  await expect(page.getByText("This reads like more than one cause.")).toBeVisible();
  await expect(page.getByText("We noticed: several factors.")).toBeVisible();

  await box.fill(
    "On 3 Aug 2026 our packer shipped 12 returned units of B0EXAMPLE1 as new because no one was assigned to open returns.",
  );
  await expect(page.getByText("This reads like more than one cause.")).toBeHidden();

  await box.fill(
    "We made a mistake with how returned items were handled and did not notice in time.",
  );
  await expect(page.getByText(/No date, number or order is in this answer yet/)).toBeVisible();
});

test("units sold is saved with the business details and appears in the case notes", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/case");
  await page
    .getByLabel("Amazon notice", { exact: true })
    .fill(
      "Please provide the supplier invoice for the affected product. The records should identify the supplier and the purchased product.",
    );
  await page
    .getByLabel("What the response page asks for")
    .fill("Upload the invoice and explain how the product code matches the affected product.");
  await page.getByRole("button", { name: "Yes, this is right" }).click();
  await page.getByRole("tab", { name: "Documents", exact: true }).click();
  const documents = page.getByRole("tabpanel", { name: "Documents", exact: true });
  await documents.getByRole("button", { name: /Your business details/ }).click();
  const units = documents.getByLabel(
    "Units you sold of the products in the notice, in the 365 days before it",
  );
  // Digits only: anything else typed is dropped.
  await units.fill("4a5,0");
  await expect(units).toHaveValue("450");
  await documents.getByRole("button", { name: "Save business details" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();

  await page.reload();
  await page.getByRole("tab", { name: "Documents", exact: true }).click();
  await expect(
    documents.getByLabel("Units you sold of the products in the notice, in the 365 days before it"),
  ).toHaveValue("450");

  await page.getByRole("tab", { name: "History", exact: true }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download case notes" }).click(),
  ]);
  const exported = await readFile((await download.path())!, "utf8");
  expect(exported).toContain(
    "Units sold of the products in the notice, over the 365 days before it: 450",
  );
});
