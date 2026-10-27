#!/usr/bin/env node
/**
 * Says out loud which Playwright specs ran and which skipped, and fails when a spec ran nothing.
 *
 * Why: the signed-in specs skip themselves when the fixture account's credentials are missing, so a
 * half-configured CI job reports green while proving nothing (27 Oct 2026 audit). Read from the JSON
 * report Playwright writes (`PLAYWRIGHT_JSON_OUTPUT_NAME`). Usage:
 *   node scripts/check-e2e-skips.mjs playwright-report.json
 * A test that is skipped for a reason of its own (a browser it does not apply to) is fine; a spec
 * with no passing test at all is not.
 */
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/check-e2e-skips.mjs <playwright json report>");
  process.exit(2);
}

const report = JSON.parse(readFileSync(file, "utf8"));
const bySpec = new Map();

function walk(suite, spec) {
  const here = suite.file ?? spec;
  for (const s of suite.specs ?? []) {
    const counts = bySpec.get(here) ?? { passed: 0, skipped: 0, failed: 0 };
    for (const t of s.tests ?? []) {
      if (t.status === "skipped") counts.skipped++;
      else if (t.status === "expected" || t.status === "flaky") counts.passed++;
      else counts.failed++;
    }
    bySpec.set(here, counts);
  }
  for (const child of suite.suites ?? []) walk(child, here);
}
for (const suite of report.suites ?? []) walk(suite, suite.file);

let empty = 0;
for (const [spec, c] of [...bySpec].sort()) {
  const note = c.passed === 0 && c.failed === 0 ? "   <-- NOTHING RAN" : "";
  console.log(
    `${spec.padEnd(40)} passed ${String(c.passed).padStart(3)}  skipped ${String(c.skipped).padStart(3)}  failed ${String(c.failed).padStart(3)}${note}`,
  );
  if (c.passed === 0 && c.failed === 0) empty++;
}
if (empty > 0) {
  console.error(
    `\n${empty} spec(s) ran no test at all. The signed-in account is probably not configured; see docs/DEPLOYMENT.md section 11a.`,
  );
  process.exit(1);
}
