import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations, WCAG_AA_TAGS } from "./axe";
import { composePoa, critiquePoa, renderPoaText } from "../src/core/composer";

const notice =
  "Please provide the supplier invoice for the affected product. The records should identify the supplier and the purchased product.";
async function configure(page: Page) {
  await page.goto("/case");
  await page.getByLabel("Amazon notice", { exact: true }).fill(notice);
  await page
    .getByLabel("What the response page asks for")
    .fill("Upload the invoice and explain how the product code matches the affected product.");
  await page.getByRole("button", { name: "Confirm this route" }).click();
  await expect(page.getByRole("button", { name: "Review evidence plan" })).toBeVisible();
}
async function reviewEvidence(page: Page) {
  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  await expect(
    page
      .getByRole("tabpanel", { name: "Evidence", exact: true })
      .getByText("Supplier invoice", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "I’m waiting for information" }).click();
  await expect(
    page
      .getByRole("tabpanel", { name: "Evidence", exact: true })
      .getByText("Waiting for information", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Draft a request" }).click();
  await expect(page.getByText("Request to the record issuer", { exact: true })).toBeVisible();
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: "supplier-invoice.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n% fictional test invoice\n%%EOF"),
    });
  await expect(page.getByRole("button", { name: "Read original" })).toBeVisible();
  await page
    .getByLabel("What does this record support or leave unclear?")
    .fill("Page 1 identifies the supplier, the purchase date and product code J-104.");
  await page
    .getByLabel("I checked the original, its page reference and the facts recorded here.")
    .check();
  await page.getByRole("button", { name: "Save evidence review" }).click();
  await expect(
    page
      .getByRole("tabpanel", { name: "Evidence", exact: true })
      .getByText("Reviewed by you", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel(
      "I checked the notice and response page, and this list covers all requested records.",
    )
    .click();
  await expect(
    page.getByLabel(
      "I checked the notice and response page, and this list covers all requested records.",
    ),
  ).toBeChecked();
}

test("workspace persists a sourced evidence plan, waiting state and factual review", async ({
  page,
}) => {
  await configure(page);
  await reviewEvidence(page);
  await page.reload();
  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  await expect(
    page
      .getByRole("tabpanel", { name: "Evidence", exact: true })
      .getByText("Reviewed by you", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("What does this record support or leave unclear?")).toHaveValue(
    /J-104/,
  );
  await expectNoAxeViolations(page, { tags: WCAG_AA_TAGS });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  await page.screenshot({
    path: "test-results/workspace-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.screenshot({
    path: "test-results/workspace-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  await page.screenshot({
    path: "test-results/workspace-evidence.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expectNoAxeViolations(page, { tags: WCAG_AA_TAGS });
  await page.screenshot({
    path: "test-results/workspace-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.goto("/dashboard");
  await expect(page.getByText("Your case, at a glance", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue your case" })).toBeVisible();
});

test("switching views retains unfinished text and a separate case preserves saved work", async ({
  page,
}) => {
  await configure(page);
  await page.getByRole("tab", { name: "Response", exact: true }).click();
  await page
    .getByLabel("Your factual explanation")
    .fill("My unfinished response facts stay here while I consult the saved request.");
  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  await page.getByRole("tab", { name: "Response", exact: true }).click();
  await expect(page.getByLabel("Your factual explanation")).toHaveValue(
    /unfinished response facts/,
  );
  await page.getByRole("button", { name: "Save response facts" }).click();
  await page.getByRole("button", { name: "New case", exact: true }).click();
  await page.getByRole("button", { name: "Create separate case" }).click();
  await expect(page.getByLabel("Amazon notice", { exact: true })).toBeEmpty();
  await page.goto("/dashboard");
  const cases = page.getByRole("region", { name: "Your cases" }).getByRole("button");
  await expect(cases).toHaveCount(2);
  await cases.filter({ hasNotText: "Current" }).click();
  await page.getByRole("link", { name: "Continue your case" }).click();
  await page.getByRole("tab", { name: "Response", exact: true }).click();
  await expect(page.getByLabel("Your factual explanation")).toHaveValue(
    /unfinished response facts/,
  );
});

test("unsaved edits are never reported as saved, and survive the sign-in redirect", async ({
  page,
}) => {
  await configure(page);
  await page.reload();
  await page.getByRole("button", { name: "Review the request" }).click();
  const draftText = "Also explain the corrective packaging change made on receipt.";
  await page.getByLabel("What the response page asks for").fill(draftText);
  await expect(page.getByText("Unsaved changes", { exact: false })).toBeVisible();
  await expect(page.getByText("Changes saved", { exact: true })).toHaveCount(0);
  await page
    .getByRole("complementary", { name: "Case context" })
    .getByRole("link", { name: "Sign in" })
    .click();
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.goBack();
  await page.getByRole("button", { name: "Review the request" }).click();
  await expect(page.getByLabel("What the response page asks for")).toHaveValue(
    new RegExp(draftText.slice(0, 20)),
  );
});

/**
 * C, 23 Sep 2026. The test above edits one field, and that is exactly why it passed while this was
 * broken: the first save always ran.
 *
 * `commit` returned false when another save was in flight, and `flushDraftKey` had already deleted
 * the edit from its pending map before awaiting that answer. Leaving the page flushes every pending
 * field in one synchronous loop, so the first started a save and every other one was dropped with
 * nothing left to retry it. The path it breaks is the sign-in redirect AM-21 deliberately routes
 * sellers through — in the middle of writing, which is when losing their words costs most.
 *
 * Both fields are filled and the page is left inside the 900 ms debounce, so neither has saved on
 * its own timer: the unmount flush is the only thing that can write them.
 */
test("every unsaved field survives leaving the page, not only the first one", async ({ page }) => {
  await configure(page);
  await page.reload();
  await page.getByRole("button", { name: "Review the request" }).click();

  const noticeText =
    "Please provide the supplier invoice for the affected product. Also include the purchase order.";
  const formText = "Upload the invoice and the purchase order, and explain the product mapping.";
  await page.getByLabel("Amazon notice", { exact: true }).fill(noticeText);
  await page.getByLabel("What the response page asks for").fill(formText);

  await page
    .getByRole("complementary", { name: "Case context" })
    .getByRole("link", { name: "Sign in" })
    .click();
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.goBack();
  await page.getByRole("button", { name: "Review the request" }).click();

  await expect(page.getByLabel("Amazon notice", { exact: true })).toHaveValue(noticeText);
  await expect(page.getByLabel("What the response page asks for")).toHaveValue(formText);
});

test("informational updates avoid a purchase flow and replies reopen the request", async ({
  page,
}) => {
  await page.goto("/case");
  await page
    .getByLabel("Amazon notice", { exact: true })
    .fill(
      "Your response remains under review. No additional information is required at this stage.",
    );
  await page.getByLabel("What the response page asks for").fill("No action requested.");
  await page.getByRole("button", { name: "Confirm this route" }).click();
  await expect(page.getByText("No new response is requested", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Response", exact: true }).click();
  await expect(page.getByRole("button", { name: "Prepare response", exact: true })).toHaveCount(0);
  await page.getByRole("tab", { name: "History", exact: true }).click();
  await page.getByLabel("Add Amazon’s next reply").fill(notice);
  await page.getByRole("button", { name: "Save reply for review" }).click();
  await page.getByRole("button", { name: "Start the next round with this reply" }).click();
  await expect(page.getByLabel("Amazon notice", { exact: true })).toHaveValue(notice);
  await expect(page.getByLabel("What the response page asks for")).toBeEmpty();
});

test("starting from Decode carries the notice into a separate case", async ({ page }) => {
  await configure(page);
  await page.goto("/decode");
  const nextNotice =
    "Performance Notification from Amazon Seller Central: your account has been deactivated for policy violation. Your selling privileges have been removed. Submit a Plan of Action addressing each ASIN affected and the account health issue described in this notice.";
  await page.getByPlaceholder(/paste/i).fill(nextNotice);
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  await page.getByRole("link", { name: "Open case workspace", exact: true }).click();
  await expect(page.getByLabel("Amazon notice", { exact: true })).toHaveValue(nextNotice);
  await page.goto("/dashboard");
  await expect(page.getByRole("region", { name: "Your cases" }).getByRole("button")).toHaveCount(2);
});

test("authenticated workspace preserves the exact response through submission and a new reply", async ({
  page,
}) => {
  test.skip(
    !process.env.DEV_LOGIN_EMAIL || !process.env.DEV_LOGIN_PASSWORD,
    "Dev authentication fixture required",
  );
  test.setTimeout(90000);
  await configure(page);
  await reviewEvidence(page);
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(process.env.DEV_LOGIN_EMAIL!);
  await page.getByLabel(/^password$/i).fill(process.env.DEV_LOGIN_PASSWORD!);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.goto("/case?view=response");
  await page
    .getByLabel("Your factual explanation")
    .fill(
      "The supplier invoice identifies the product by code J-104 and records the purchase. The product code corresponds to the affected listing.",
    );
  await page.getByRole("button", { name: "Save response facts" }).click();
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "History", exact: true }).click();
  await page
    .getByLabel("Add Amazon’s next reply")
    .fill("Private scratch reply not confirmed for processing.");
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Response", exact: true }).click();
  await page.route("**/api/compose", async (route) => {
    const { caseData, attemptNumber } = route.request().postDataJSON();
    expect(caseData.workspace.draft).toBeUndefined();
    expect(route.request().postData()).not.toContain("Private scratch reply");
    const draft = composePoa(caseData, attemptNumber);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        draft,
        critique: critiquePoa(draft, caseData),
        rendered: renderPoaText(draft),
      }),
    });
  });
  await page.getByRole("button", { name: "Prepare response", exact: true }).click();
  await expect(page.getByText("Review the exact response", { exact: true })).toBeVisible();
  await expect(
    page.locator("pre").filter({ hasText: "Response to the document request" }),
  ).not.toContainText("Root Cause");
  await page
    .getByLabel(
      "I reviewed the facts, attachment names and page references against the response page in Seller Central.",
    )
    .check();
  await page
    .getByLabel(
      "I have submitted this exact response and its selected files through the official channel.",
    )
    .check();
  await page.getByRole("button", { name: "Record submission", exact: true }).click();
  await expect(page.getByText(/Attempt 1 ·/)).toBeVisible();
  await page
    .getByLabel("Add Amazon’s next reply")
    .fill(
      "Please provide the sales report for the affected product, showing the relevant sales period.",
    );
  await page.getByRole("button", { name: "Save reply for review" }).click();
  await page.getByRole("button", { name: "Start the next round with this reply" }).click();
  // A new round opens on Overview once it is saved; wait for that before choosing History, or the
  // save can land after the click and move the page back.
  await expect(page.getByRole("tab", { name: "Overview", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByRole("tab", { name: "History", exact: true }).click();
  await page.getByText(/Attempt 1 ·/).click();
  await expect(
    page.locator("pre").filter({ hasText: "Response to the document request" }),
  ).toContainText("J-104");
  await page.reload();
  await page.getByRole("tab", { name: "History", exact: true }).click();
  await expect(page.getByText(/Attempt 1 ·/)).toBeVisible();
});

/**
 * 24 Sep 2026. A share the server refused used to resolve the prompt anyway: the seller pressed
 * "Share it", nothing was recorded, nothing was said, and the card never came back.
 */
test("a refused outcome share keeps the offer and says so; a recorded one confirms it", async ({
  page,
}) => {
  test.skip(
    !process.env.DEV_LOGIN_EMAIL || !process.env.DEV_LOGIN_PASSWORD,
    "Dev authentication fixture required",
  );
  test.setTimeout(90000);
  await configure(page);
  await reviewEvidence(page);
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(process.env.DEV_LOGIN_EMAIL!);
  await page.getByLabel(/^password$/i).fill(process.env.DEV_LOGIN_PASSWORD!);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.goto("/case?view=response");
  await page
    .getByLabel("Your factual explanation")
    .fill("The supplier invoice identifies the product by code J-104 and records the purchase.");
  await page.getByRole("button", { name: "Save response facts" }).click();
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();
  await page.route("**/api/compose", async (route) => {
    const { caseData, attemptNumber } = route.request().postDataJSON();
    const draft = composePoa(caseData, attemptNumber);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        draft,
        critique: critiquePoa(draft, caseData),
        rendered: renderPoaText(draft),
      }),
    });
  });
  await page.getByRole("button", { name: "Prepare response", exact: true }).click();
  await page
    .getByLabel(
      "I reviewed the facts, attachment names and page references against the response page in Seller Central.",
    )
    .check();
  await page
    .getByLabel(
      "I have submitted this exact response and its selected files through the official channel.",
    )
    .check();
  await page.getByRole("button", { name: "Record submission", exact: true }).click();
  await expect(page.getByText(/Attempt 1 ·/)).toBeVisible();

  await page.goto("/dashboard");
  await page.getByLabel("What happened with this case?").selectOption("reinstated");
  const share = page.getByRole("button", { name: "Share it", exact: true });
  await expect(share).toBeVisible();

  let calls = 0;
  await page.route("**/api/outcome", async (route) => {
    calls += 1;
    await route.fulfill({ status: calls === 1 ? 500 : 200, body: "{}" });
  });
  await share.click();
  await expect(page.getByText(/We could not record that, and nothing was sent/)).toBeVisible();
  await expect(share).toBeVisible();

  await share.click();
  await expect(page.getByText("Outcome shared anonymously. Thank you.")).toBeVisible();
  await expect(share).toBeHidden();
  expect(calls).toBe(2);
});

/**
 * #86 and #91. Both were added because the product was silently wrong about a real case — a
 * second violation dropped on the floor, and a seller's earlier rejected attempts invisible to
 * every rule that depends on them. Asserted end to end, because the recurring defect in this
 * codebase has been code that shipped with nothing able to reach it.
 */
test("a notice raising two issues names both, and blocks a response that has answered one", async ({
  page,
}) => {
  await page.goto("/case");
  await page
    .getByLabel("Amazon notice", { exact: true })
    .fill(
      [
        "Your Amazon seller account has been deactivated.",
        "We could not verify the authenticity of the invoices you supplied for the affected products.",
        "Separately, your detail page policy violation for ASIN B0EXAMPLE1 remains unresolved.",
        "Please provide the supplier invoice for the affected product.",
      ].join("\n"),
    );
  await page.getByLabel("What the response page asks for").fill("Upload the requested invoice.");
  await page.getByRole("button", { name: "Confirm this route" }).click();

  await page.getByRole("tab", { name: "Response", exact: true }).click();
  const panel = page.getByRole("tabpanel", { name: "Response", exact: true });
  await expect(panel.getByText("This notice raises more than one issue")).toBeVisible();
  // Each issue is named, and quoted from the seller's own notice rather than asserted.
  // "could not verify the authenticity of the invoices you supplied" is Amazon asking for records
  // it could not confirm — not an allegation that those records were forged. Since the 23 Sep split
  // those are separate kinds, and this one is the ordinary complaint the product exists to answer.
  await expect(panel.getByText("Inauthentic item complaint", { exact: true })).toBeVisible();
  await expect(panel.getByText("Listing violation", { exact: true })).toBeVisible();
  await expect(panel.getByText(/detail page policy violation for ASIN B0EXAMPLE1/)).toBeVisible();

  const confirm = panel.getByLabel("My response addresses every issue listed above.");
  await expect(confirm).not.toBeChecked();
  // `click()` then assert, not `check()`: the box is controlled by state that only updates once
  // the vault write returns, and `check()` re-clicks while that is still in flight.
  await confirm.click();
  await expect(confirm).toBeChecked();
});

test("a response sent before finding us counts as an attempt", async ({ page }) => {
  await page.goto("/case");
  await page
    .getByLabel("Amazon notice", { exact: true })
    .fill("Your Amazon seller account has been deactivated. Please submit a Plan of Action.");

  await page.getByRole("button", { name: "Yes, I already responded" }).click();
  await page
    .getByLabel("What did you send? (optional)")
    .fill("We removed the listing and retrained the team.");
  await page.getByRole("button", { name: "Record this response" }).click();

  // It becomes a submission on the case, which is what makes the attempt count and the
  // duplicate-response guard correct.
  await expect(page.getByText(/Counted as an earlier attempt/)).toBeVisible();
  // Appears both in the list on this step and in the case history, because it is a real
  // submission on the case rather than a note beside it.
  await expect(page.getByText(/We removed the listing and retrained the team/)).toHaveCount(2);
  await expect(page.getByText("Wording not kept")).toHaveCount(0);

  // It survives a reload, because an attempt the product forgets is an attempt it miscounts.
  // The route was never confirmed here, so the request step is still the open one after reload.
  await page.reload();
  await expect(page.getByText(/Counted as an earlier attempt/)).toBeVisible();
});

/**
 * B-03. Until 23 Sep 2026 applying an Amazon reply reset every requirement to "needed", so a
 * seller who had reviewed their invoice redid that review on every round — and the median real
 * case is multi-round. Asserted end to end because this codebase's recurring defect is code that
 * shipped with nothing able to reach it, and because the unit test cannot see the confirm step.
 */
test("an Amazon reply keeps the evidence a seller already reviewed, and says so before applying", async ({
  page,
}) => {
  test.setTimeout(90000);
  await configure(page);
  await reviewEvidence(page);

  await page.getByRole("tab", { name: "History", exact: true }).click();
  await page
    .getByLabel("Add Amazon’s next reply")
    .fill(
      "Thank you for your response. Please provide the sales report for the affected product, showing the relevant sales period.",
    );
  await page.getByRole("button", { name: "Save reply for review" }).click();

  // The delta, before anything is applied: the invoice is untouched by this reply, the sales
  // report is new, and the seller sees both with Amazon's own sentence attached.
  const delta = page.getByText("What this reply changes", { exact: true }).locator("..");
  await expect(page.getByText("Kept as reviewed", { exact: true })).toBeVisible();
  await expect(page.getByText("New in this reply", { exact: true })).toBeVisible();
  await expect(page.getByText("Asked for again", { exact: true })).toHaveCount(0);
  await expect(delta).toBeVisible();

  await page.getByRole("button", { name: "Start the next round with this reply" }).click();
  // Same race as above: the revision is written to the vault before the tab switch means anything.
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();

  // The regression this feature exists to prevent. Asserted on the two status badges rather than
  // on the labels: the facts ledger legitimately repeats "Supplier invoice" in the same panel, so
  // a label locator is ambiguous while the statuses say exactly what is being claimed — the
  // invoice is still reviewed, and only the newly added record needs work.
  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  const evidence = page.getByRole("tabpanel", { name: "Evidence", exact: true });
  await expect(evidence.getByText("Reviewed by you", { exact: true })).toHaveCount(1);
  await expect(evidence.getByText("Needs review", { exact: true })).toHaveCount(1);
  // The seller's own note survived with it. `.first()` is well defined, not incidental:
  // `computeReplyDelta` returns existing requirements before anything the reply adds.
  await expect(
    page.getByLabel("What does this record support or leave unclear?").first(),
  ).toHaveValue(/J-104/);
});

/**
 * A-05 / A-06 / A-02. All three existed in src/core, were tested, were ticked off as delivered,
 * and no seller could reach any of them: two rendered only in the dev-only gallery and the third
 * was called only by the interview step engine retired on 22 Sep 2026. This test exists because
 * that is the defect this codebase keeps repeating, and a unit test cannot see it.
 */
/**
 * The classification wire-up, 23 Sep 2026. Only `/decode` ever classified a notice, so one typed
 * straight into `/case` left the case `UNKNOWN` — and `UNKNOWN`'s evidence matrix is empty, so
 * B-05's union could never raise a record the notice left unsaid on the most ordinary way in.
 *
 * This notice names an invoice and nothing else. A policy case nearly always needs the metric
 * export too, and raising that unprompted is the expertise being sold: it can only appear here if
 * the notice was classified on confirmation.
 */
test("a notice typed into the workspace is classified, and a seller's correction is kept", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/case");
  await page
    .getByLabel("Amazon notice", { exact: true })
    .fill(
      "Your account has been deactivated for repeated policy violations. Please provide the supplier invoice for the affected product.",
    );
  await page.getByLabel("What the response page asks for").fill("Upload the requested invoice.");
  await page.getByRole("button", { name: "Confirm this route" }).click();

  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  const evidence = page.getByRole("tabpanel", { name: "Evidence", exact: true });
  await expect(evidence.getByText("Sales or performance record", { exact: true })).toBeVisible();
  // Raised by us, and said so — never presented as a request Amazon made.
  await expect(evidence.getByText("We added this", { exact: true })).toBeVisible();

  // The reading is recorded as ours, so it can be seen and corrected.
  await page.getByRole("tab", { name: "History", exact: true }).click();
  await expect(page.getByText(/We read it as: Policy violation\./)).toBeVisible();

  // A seller's own correction survives the next confirmation instead of being re-classified.
  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Review the request" }).click();
  await page.getByRole("button", { name: "Change the issue" }).click();
  await page.getByLabel("The issue on this notice").selectOption("FUNDS");
  await page.getByRole("button", { name: "Use this issue instead" }).click();
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Confirm this route" }).click();
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();
  await page.reload();
  // The case is now titled by its issue, so the correction shows in the heading as well.
  await expect(page.getByRole("heading", { level: 1, name: "Funds hold" })).toBeVisible();
  await page.getByRole("button", { name: "Review the request" }).click();
  await expect(page.getByText("Funds hold", { exact: true }).last()).toBeVisible();
});

/**
 * 23 Sep 2026. A notice typed into the workspace never had its deadline computed, because the only
 * way to compute one counted from the moment of decoding. So a notice plainly stating thirty days
 * sat beside "No confirmed deadline recorded". With the start taken from the notice or described
 * relative to receipt, it is now safe to show — and it is shown.
 */
test("a notice typed into the workspace shows its window, counted honestly", async ({ page }) => {
  await page.goto("/case");
  await page
    .getByLabel("Amazon notice", { exact: true })
    .fill(
      "Your account has been deactivated for repeated policy violations. You may appeal within 30 days. Please provide the supplier invoice.",
    );
  await page.getByLabel("What the response page asks for").fill("Upload the requested invoice.");
  await page.getByRole("button", { name: "Confirm this route" }).click();
  const context = page.getByRole("complementary", { name: "Case context" });
  await expect(context).toContainText(
    "Appeal window: 30 days, from the day you received this notice",
  );
  await expect(context).not.toContainText("No confirmed deadline recorded");
});

test("a seller can see why a record is wanted, ask for it, and say when they cannot get it", async ({
  page,
}) => {
  test.setTimeout(90000);
  await configure(page);
  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  const evidence = page.getByRole("tabpanel", { name: "Evidence", exact: true });

  /*
    A-05, the matrix content on screen. This asserted "Why Amazon asks for this" was visible, and it
    was — with the wrong reason. This case is UNKNOWN (a notice typed straight into /case, which is
    the ordinary path), so the sentence came from whichever violation declared that record first:
    an identity record displayed the *related-account* explanation. The assertion passed because it
    only checked that a heading existed.

    `supplier_invoice` carries two different reasons across the matrix, so on an unclassified case
    the honest answer is to describe the record and not attribute a motive. What must be shown and
    what will not be accepted are properties of the record, and those still render.
  */
  await expect(
    evidence.getByText("What a record like this has to show", { exact: true }),
  ).toBeVisible();
  await expect(evidence.getByText("Why Amazon asks for this", { exact: false })).toHaveCount(0);
  // A-06: the letter that asks the supplier for a compliant invoice.
  await expect(
    evidence.getByRole("group").filter({ hasText: "Supplier invoice request" }),
  ).toBeVisible();
  // The disqualifiers — the half sellers most often get wrong, and which nothing used to say.
  await expect(evidence.getByText("What will not be accepted", { exact: true })).toBeVisible();

  // A-02/A-03: the objection path. Before this there was no way to say "I can't get this".
  await evidence.getByRole("button", { name: "I cannot obtain this record" }).click();
  await expect(evidence.getByText("Change sourcing, and say so", { exact: true })).toBeVisible();
  await expect(evidence.getByText("What this costs you", { exact: false }).first()).toBeVisible();
  await evidence
    .getByLabel("Why can you not obtain it?")
    .fill("The supplier closed in 2025 and no longer issues invoices of any kind.");
  await evidence.getByRole("button", { name: "Choose this path" }).first().click();
  await evidence.getByRole("button", { name: "Record that you cannot obtain this" }).click();
  await expect(evidence.getByText("You cannot obtain this", { exact: true })).toBeVisible();

  // The schema that guards every save strips keys it does not know, and has silently dropped two
  // fields in this codebase before. A decline that does not survive a reload is a decline the
  // seller has to make again.
  await page.reload();
  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  await expect(evidence.getByText("You cannot obtain this", { exact: true })).toBeVisible();
  await expect(evidence.getByText(/supplier closed in 2025/)).toBeVisible();
});

/**
 * A-01, EF-2's attestation. The layer existed in readiness.ts and nothing in the product could
 * write to it, so composer.ts's UNATTESTED_CLAIMS rule had never fired on a real case — and when
 * it was rewired to the workspace it still did not fire, because critiquePoa's workspace branch
 * returns before reaching it. Both were invisible without running the thing end to end.
 */
test("a Plan of Action asks the seller to stand behind the work they describe", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/case");
  await page
    .getByLabel("Amazon notice", { exact: true })
    .fill(
      "Your account has been deactivated. Please submit a Plan of Action explaining the root cause of the issue and the corrective actions you have taken.",
    );
  await page.getByLabel("What the response page asks for").fill("Submit a Plan of Action.");
  await page.getByRole("button", { name: "Confirm this route" }).click();
  await page.getByRole("tab", { name: "Response", exact: true }).click();

  const confirm = page.getByLabel(/I confirm each corrective action described above/);
  // Nothing to stand behind yet, so there is nothing to tick.
  await expect(confirm).toBeDisabled();
  await page
    .getByLabel("Corrective actions and their actual status")
    .fill(
      "We added a daily dispatch review on 16 September 2026, recorded by the warehouse owner.",
    );
  await expect(confirm).toBeEnabled();
  await confirm.check();
  await page.getByRole("button", { name: "Save response facts" }).click();
  // Wait for the write to land before reloading. Without this the test races the vault and fails
  // only under parallel load, which is indistinguishable from a flake until you read the failure:
  // the checkbox comes back disabled because the corrective-action text never persisted.
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();

  // It has to survive the validator that guards every vault write.
  await page.reload();
  await page.getByRole("tab", { name: "Response", exact: true }).click();
  await expect(page.getByLabel(/I confirm each corrective action described above/)).toBeChecked();

  // And an edit must clear it: an attestation that survives a rewrite is an attestation to text
  // the seller never read, which is exactly what the copy under the box promises it is not.
  await page
    .getByLabel("Corrective actions and their actual status")
    .fill("We changed something else entirely, and this sentence was never confirmed by anyone.");
  await expect(
    page.getByLabel(/I confirm each corrective action described above/),
  ).not.toBeChecked();
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: "Response", exact: true }).click();
  await expect(page.getByLabel("Corrective actions and their actual status")).toHaveValue(
    "We changed something else entirely, and this sentence was never confirmed by anyone.",
  );
  await expect(
    page.getByLabel(/I confirm each corrective action described above/),
  ).not.toBeChecked();
});

/**
 * B-05 and B-06 together, because they only matter together. B-05 raises the record Amazon did not
 * spell out — which is the expertise being sold — and it derives that from the violation kind, so
 * B-06's ability to correct the kind is what stops one wrong reading producing a wrong record list,
 * wrong guidance and a wrong severity gate with no way back. K12 pre-agreed the override and no
 * mechanism was ever built.
 */
test("a seller can correct the issue we read, and we raise the records that issue needs", async ({
  page,
}) => {
  test.setTimeout(90000);
  await configure(page);

  // The notice names an invoice and nothing else, and an unclassified case infers nothing.
  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  const evidence = page.getByRole("tabpanel", { name: "Evidence", exact: true });
  await expect(evidence.getByText("Sales or performance record", { exact: true })).toHaveCount(0);

  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Review the request" }).click();
  await page.getByRole("button", { name: "Change the issue" }).click();
  await page.getByLabel("The issue on this notice").selectOption("POLICY");
  await page.getByRole("button", { name: "Use this issue instead" }).click();
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();

  // The record this issue needs, which the notice never mentions, is now on the list — and it is
  // labelled as ours rather than dressed up as something Amazon said.
  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  await expect(evidence.getByText("Sales or performance record", { exact: true })).toBeVisible();
  await expect(evidence.getByText("We added this", { exact: true })).toBeVisible();
  await expect(evidence.getByText(/Your notice does not name this record/)).toBeVisible();
  // And the record the notice did name is still there, untouched.
  await expect(evidence.getByText("Supplier invoice", { exact: true }).first()).toBeVisible();
});

/**
 * 23 Sep 2026. Confirming the request rebuilt the issues every time but the records only when there
 * were none, so a seller who corrected a mis-pasted notice kept the old list.
 */
test("a corrected notice brings in the record it now asks for, and keeps work already done", async ({
  page,
}) => {
  test.setTimeout(90000);
  await configure(page);
  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  const evidence = page.getByRole("tabpanel", { name: "Evidence", exact: true });
  await page.getByRole("button", { name: "I’m waiting for information" }).click();
  await expect(evidence.getByText("Waiting for information", { exact: true })).toBeVisible();
  await expect(evidence.getByText("Authorization letter", { exact: true })).toHaveCount(0);

  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Review the request" }).click();
  await page
    .getByLabel("Amazon notice", { exact: true })
    .fill(`${notice} Please also provide a letter of authorization from the brand owner.`);
  await page.getByRole("button", { name: "Confirm this route" }).click();
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();

  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  await expect(evidence.getByText("Authorization letter", { exact: true })).toBeVisible();
  // The invoice the seller had already started on is kept, with its status.
  await expect(evidence.getByText("Supplier invoice", { exact: true }).first()).toBeVisible();
  await expect(evidence.getByText("Waiting for information", { exact: true })).toBeVisible();
});

/**
 * 23 Sep 2026. The dashboard's clock, the "waiting on someone else" note and the email-reminder
 * switch rendered only for classic cases, so no current case could reach them — and the clock never
 * received a notice's deadline at all. Run from Los Angeles, where a midnight-UTC date used to show
 * as the day before.
 */
test.describe("the dashboard for a workspace case", () => {
  test.use({ timezoneId: "America/Los_Angeles" });

  test("shows the notice's own deadline first, and lets the seller record who they wait on", async ({
    page,
  }) => {
    await page.goto("/case");
    await page
      .getByLabel("Amazon notice", { exact: true })
      .fill(
        "Your account has been deactivated for repeated policy violations. Please submit your appeal by 1 October 2026. Please provide the supplier invoice.",
      );
    await page.getByLabel("What the response page asks for").fill("Upload the requested invoice.");
    await page.getByRole("button", { name: "Confirm this route" }).click();
    await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();

    await page.goto("/dashboard");
    await expect(page.getByText(/^Appeal by 1 Oct 2026 — /)).toBeVisible();
    await expect(page.getByText(/30 Sep 2026/)).toHaveCount(0);
    await expect(
      page.getByText("Based on dates you set and dates stated in your notice.", { exact: false }),
    ).toBeVisible();
    await expect(page.getByText("Waiting on someone else", { exact: true })).toBeVisible();
  });
});

/**
 * 24 Sep 2026 (ChatGPT audit item G). The facts ledger could not compare a document with the
 * seller's own account, because the seller had nowhere to state it. The business details are
 * saved to the vault, survive a reload, and join the ledger as the seller's own statement.
 */
test("the seller's business details are saved, survive a reload and join the facts ledger", async ({
  page,
}) => {
  await configure(page);
  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  const evidence = page.getByRole("tabpanel", { name: "Evidence", exact: true });

  await evidence
    .getByLabel("Business name, exactly as registered on your seller account")
    .fill("Hawlton Trading");
  await evidence
    .getByLabel("Your suppliers (one per line, as each names itself)")
    .fill("Acme Trading Ltd\nOther Wholesale");
  await evidence.getByRole("button", { name: "Save business details" }).click();
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();

  await page.reload();
  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  await expect(
    evidence.getByLabel("Business name, exactly as registered on your seller account"),
  ).toHaveValue("Hawlton Trading");
  // Saved and unchanged, so there is nothing to save.
  await expect(evidence.getByRole("button", { name: "Save business details" })).toBeDisabled();
  await expect(evidence.getByText("Your registered business name", { exact: true })).toBeVisible();
  await expect(evidence.getByText("Your suppliers", { exact: true })).toBeVisible();
});
