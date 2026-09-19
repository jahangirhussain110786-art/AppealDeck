import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

// Standalone concept verification; no application server or external service needed.
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const url = new URL("./case-workspace.html", import.meta.url).href;
let checks = 0;
async function noOverflow() {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  checks++;
}
async function accessibility() {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(
    result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    [],
  );
  checks++;
}
try {
  await page.goto(url);
  await noOverflow();
  await accessibility();
  await page.screenshot({
    path: fileURLToPath(new URL("./workspace-desktop.png", import.meta.url)),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Request it from supplier" }).click();
  await page.getByRole("button", { name: "Mark as waiting in demo" }).click();
  assert.equal(
    await page.getByRole("heading", { name: "Your supplier request is prepared." }).count(),
    1,
  );
  checks++;
  await page.getByRole("button", { name: "Simulate supplier reply" }).click();
  await accessibility();
  await page.getByLabel("I reviewed the sample source").check();
  await page.getByRole("button", { name: "Confirm sample review" }).click();
  await page.getByRole("button", { name: "Review response", exact: false }).first().click();
  await page.getByRole("button", { name: "Record sample submission" }).click();
  await page.getByRole("button", { name: "Record demo attempt" }).click();
  await page.getByRole("button", { name: "Simulate a new request" }).click();
  await page.getByRole("button", { name: "Review proposed change" }).click();
  assert.match(await page.getByRole("dialog").innerText(), /earlier submitted text will remain/);
  checks++;
  await accessibility();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "History", exact: false }).click();
  assert.equal(await page.getByText("View recorded submission snapshot").count(), 1);
  checks++;
  for (const scenario of ["docs", "poa", "dispute", "update"]) {
    await page.getByLabel("Explore a sample").selectOption(scenario);
    await noOverflow();
    await accessibility();
    await page
      .getByRole("button", { name: "Response", exact: false })
      .filter({ hasText: /^Response/ })
      .click();
    if (scenario === "dispute") {
      assert.equal(await page.getByRole("button", { name: "Record sample submission" }).count(), 0);
      checks++;
    }
  }
  await page.getByRole("button", { name: "Overview", exact: false }).click();
  await page.getByRole("button", { name: "Set a reminder" }).click();
  await page.getByLabel("Check-in date", { exact: true }).fill("2026-09-25");
  await page.getByRole("button", { name: "Save sample date" }).click();
  assert.match(await page.locator("#content").innerText(), /2026-09-25/);
  checks++;
  await page.getByLabel("Explore a sample").selectOption("docs");
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow();
  await accessibility();
  await page.screenshot({
    path: fileURLToPath(new URL("./workspace-mobile.png", import.meta.url)),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Review source", exact: false }).click();
  await noOverflow();
  await accessibility();
  assert.deepEqual(errors, []);
  checks++;
  console.log(
    JSON.stringify({
      status: "passed",
      checks,
      pageErrors: errors,
      screenshots: ["workspace-desktop.png", "workspace-mobile.png"],
    }),
  );
} finally {
  await browser.close();
}
