import { expect, test, type Page } from "@playwright/test";

/**
 * 7 Oct 2026 (launch audit). Preparing a response is the step a seller has just paid for. When the
 * platform answered with an HTML error page (a gateway timeout), the page read it as JSON and
 * showed the browser's parse error, "Unexpected token '<'". It now says the service is not
 * available, and the seller's answers are untouched.
 */
const NOTICE =
  "Subject: Item condition complaints\nDate: 2 October 2026\n\nHello Seller,\n\nWe removed the following listing because customers complained that the item was used or not in the condition described.\n\nASIN: B09XK3J7QP\n\nItem condition complaints (Used Sold as New) are a violation of our Seller Code of Conduct. Submit a plan of action that explains what caused the complaints and the steps you have taken to prevent them. You may appeal within 30 days.\n\nSeller Performance Team";
const WENT_WRONG =
  "We listed returned items as new. Customer returns were put back into our new-condition stock without anyone opening the packaging, so four customers received opened items between 12 and 28 September.";
const FIXED =
  "Finished: on 30 September we removed all 12 affected listings and relisted the returned units as Used - Like New. Finished: we checked every unit in stock on 3 October and moved 9 more returns to a returns shelf.";
const PREVENT =
  "Our warehouse lead opens and inspects every return before it can go back on sale, and records the result in a returns log. We audit 20 random new-condition units every Friday and the owner signs off the log monthly.";

async function signInAsDev(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(process.env.DEV_LOGIN_EMAIL!);
  await page.getByLabel(/^password$/i).fill(process.env.DEV_LOGIN_PASSWORD!);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/dashboard/);
}

async function prepareWith(
  page: Page,
  reply: { status: number; contentType: string; body: string },
  delayMs = 0,
) {
  test.skip(
    !process.env.DEV_LOGIN_EMAIL || !process.env.DEV_LOGIN_PASSWORD,
    "Dev authentication fixture required",
  );
  test.setTimeout(120_000);
  await signInAsDev(page);

  await page.goto("/decode");
  await page.getByLabel("Your notice").fill(NOTICE);
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  await page
    .getByRole("link", { name: /open case workspace/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/case/);
  await page.getByRole("button", { name: /yes, this is right/i }).click();
  await page.getByRole("tab", { name: /^Response/i }).click();
  await page.getByLabel(/what went wrong/i).fill(WENT_WRONG);
  await page.getByLabel(/what have you fixed/i).fill(FIXED);
  await page.getByLabel(/how will you stop/i).fill(PREVENT);
  await page.getByRole("checkbox", { name: /every action i describe as done/i }).check();
  await page.getByRole("button", { name: /save my answers/i }).click();
  await expect(page.getByText(/Confirmed by you on/)).toBeVisible();

  // The licence question says "active"; compose then fails the way a gateway timeout does.
  await page.route("**/api/license/status**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "active" }),
    }),
  );
  await page.route("**/api/compose", async (route) => {
    if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.fulfill(reply);
  });
  await page.getByRole("button", { name: /prepare working draft/i }).click();
}

test("a platform error page while preparing a response is not shown as a parse error", async ({
  page,
}) => {
  await prepareWith(page, {
    status: 504,
    contentType: "text/html",
    body: "<html><body>An error occurred with your deployment</body></html>",
  });
  await expect(page.getByText(/not available right now/i)).toBeVisible();
  await expect(page.getByText(/Unexpected token/i)).toHaveCount(0);
  // Nothing the seller wrote was lost.
  await expect(page.getByLabel(/what went wrong/i)).toHaveValue(WENT_WRONG);
});

// The server sends a code in `error` and the sentence in `message`; the seller reads the sentence.
test("a device-limit refusal is shown as a sentence, not as its error code", async ({ page }) => {
  await prepareWith(page, {
    status: 403,
    contentType: "application/json",
    body: JSON.stringify({
      error: "device_cap_reached",
      message:
        "Your Appeal Pass is active on 5 of 5 allowed devices. Open Billing and remove one, then try again.",
      activeCount: 5,
      cap: 5,
    }),
  });
  await expect(page.getByText(/5 of 5 allowed devices/)).toBeVisible();
  await expect(page.getByText("device_cap_reached")).toHaveCount(0);
});

// A prepared response can be kept as a Word file or printed to PDF. Compose is answered with a fixed
// draft so the test does not depend on the dev account's Pass or device slots.
test("a prepared response downloads as a Word file and opens a clean print page", async ({
  page,
}) => {
  const draft = {
    docType: "poa",
    mode: { mode: "full-draft", reason: "Ready for your final factual review." },
    sections: [{ heading: "Root Cause", body: WENT_WRONG }],
    metadata: {
      generatedAt: "2026-10-07T00:00:00.000Z",
      kind: "POLICY",
      evidenceComplete: true,
      attemptNumber: 1,
      aiDrafted: false,
    },
  };
  await prepareWith(page, {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      rendered: `## Root Cause\n\n${WENT_WRONG}\n`,
      draft,
      critique: { findings: [], passed: true },
    }),
  });
  await page.getByRole("checkbox", { name: /I reviewed the facts/ }).check();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download as Word" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("appealdeck-response.docx");
  const bytes = (await import("node:fs")).readFileSync((await download.path())!);
  expect(bytes.subarray(0, 2).toString()).toBe("PK");

  // The product calls the popup's own print(), which opens a native dialog; headless Firefox never
  // returns from it and the click hangs. The popup is wrapped so its print() does nothing: what is
  // under test is the page that opens, not the operating system's print dialog.
  await page.evaluate(() => {
    const open = window.open.bind(window);
    window.open = (...args) => {
      const win = open(...args);
      if (win) win.print = () => {};
      return win;
    };
  });
  const [popup] = await Promise.all([
    page.waitForEvent("popup"),
    page.getByRole("button", { name: "Print or save as PDF" }).click(),
  ]);
  await expect(popup.locator("h1")).toHaveText("Plan of Action");
  await expect(popup.getByText(WENT_WRONG.slice(0, 40))).toBeVisible();
});

// The AI wrote the narrative: the seller is told so, can switch to their own wording and back, and
// what they copy is always what is on screen.
test("an AI-written response says so and can be switched to the seller's own wording", async ({
  page,
}) => {
  const view = (marker: string) => ({
    docType: "poa",
    mode: { mode: "full-draft", reason: "Ready for your final factual review." },
    sections: [{ heading: "Root Cause", body: marker }],
    metadata: {
      generatedAt: "2026-10-07T00:00:00.000Z",
      kind: "POLICY",
      evidenceComplete: true,
      attemptNumber: 1,
      aiDrafted: marker.startsWith("AI"),
    },
  });
  const part = (marker: string) => ({
    draft: view(marker),
    rendered: `## Root Cause\n\n${marker}\n`,
    critique: { findings: [], passed: true },
  });
  await prepareWith(page, {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      ...part("AI wording of the root cause."),
      ai: { status: "used", retried: false },
      ownWording: part("Seller's own wording of the root cause."),
    }),
  });
  await expect(page.getByText(/were written by AI from your answers/)).toBeVisible();
  await expect(page.getByText("AI wording of the root cause.")).toBeVisible();

  await page.getByRole("checkbox", { name: /I reviewed the facts/ }).check();
  await page.getByRole("button", { name: "Use my own wording" }).click();
  await expect(page.getByText("Seller's own wording of the root cause.")).toBeVisible();
  await expect(page.getByText("AI wording of the root cause.")).toHaveCount(0);
  // Switching un-ticks the review: it is a different text now.
  await expect(page.getByRole("checkbox", { name: /I reviewed the facts/ })).not.toBeChecked();

  await page.getByRole("button", { name: "Use the AI draft" }).click();
  await expect(page.getByText("AI wording of the root cause.")).toBeVisible();
});

test("when the AI draft is discarded the seller is told why", async ({ page }) => {
  await prepareWith(page, {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      draft: {
        docType: "poa",
        mode: { mode: "full-draft", reason: "Ready" },
        sections: [{ heading: "Root Cause", body: WENT_WRONG }],
        metadata: {
          generatedAt: "2026-10-07T00:00:00.000Z",
          kind: "POLICY",
          evidenceComplete: true,
          attemptNumber: 1,
          aiDrafted: false,
        },
      },
      rendered: `## Root Cause\n\n${WENT_WRONG}\n`,
      critique: { findings: [], passed: true },
      ai: { status: "fallback", reason: "fact_check_failed" },
    }),
  });
  await expect(page.getByText(/added details you did not give, so it was discarded/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Use my own wording" })).toHaveCount(0);
});

// Writing and checking a draft can take most of a minute. The seller is told, not left with a grey button.
test("while the draft is being written the button says so and the seller is told how long it can take", async ({
  page,
}) => {
  const prepared = prepareWith(
    page,
    {
      status: 504,
      contentType: "text/html",
      body: "<html></html>",
    },
    2500,
  );
  await prepared;
  await expect(page.getByRole("button", { name: "Writing your draft…" })).toBeDisabled();
  await expect(page.getByRole("status").filter({ hasText: "up to a minute" })).toBeVisible();
  // And it returns to normal when the answer arrives.
  await expect(page.getByRole("button", { name: /Prepare working draft/ })).toBeEnabled({
    timeout: 10_000,
  });
});
