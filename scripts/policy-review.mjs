/**
 * Reads the newest policy-watch report and writes a proposal (4 Nov 2026).
 *
 *   node scripts/policy-review.mjs                    newest report
 *   node scripts/policy-review.mjs --report=content/policy-watch/reports/2026-11-04.json
 *   node scripts/policy-review.mjs --dry-run          print, write nothing
 *
 * It never edits `src/`. The output is a dated file under `content/policy-watch/proposals/` that a
 * person reads; the workflow opens it as a pull request so the decision has a place to happen and a
 * record afterwards. The reason is in `content/policy-watch/README.md` § "Why there is still one
 * click": a wrong sentence in the Playbook costs a seller an appeal, and no gate can tell a faithful
 * paraphrase from a confident wrong one. The gates catch what can be checked; the click covers the
 * rest.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { askModel, providerConfig } from "./policy-review/provider.mjs";
import { validateProposal } from "./policy-review/gates.mjs";
import { buildPrompt, reportUrls } from "./policy-review/prompt.mjs";
import { proposalTitle, renderProposal } from "./policy-review/render.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPORTS_DIR = resolve(ROOT, "content/policy-watch/reports");
const PROPOSALS_DIR = resolve(ROOT, "content/policy-watch/proposals");
const BRIEF_PATH = resolve(ROOT, "src/core/policyBrief.ts");

function newestReport() {
  if (!existsSync(REPORTS_DIR)) return null;
  const files = readdirSync(REPORTS_DIR)
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
    .sort();
  return files.length ? resolve(REPORTS_DIR, files[files.length - 1]) : null;
}

function setOutput(pairs) {
  const path = process.env.GITHUB_OUTPUT;
  if (!path) return;
  writeFileSync(
    path,
    `${Object.entries(pairs)
      .map(([key, value]) => `${key}=${String(value).replace(/\n/g, " ")}`)
      .join("\n")}\n`,
    { flag: "a" },
  );
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function main() {
  const { values } = parseArgs({
    options: {
      report: { type: "string" },
      "dry-run": { type: "boolean", default: false },
    },
  });

  const reportPath = values.report ? resolve(ROOT, values.report) : newestReport();
  if (!reportPath || !existsSync(reportPath)) {
    console.log("policy-review: no report to review.");
    setOutput({ status: "no-report" });
    return;
  }

  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  const markdownPath = reportPath.replace(/\.json$/, ".md");
  const reportMarkdown = existsSync(markdownPath) ? readFileSync(markdownPath, "utf8") : "";
  const briefSource = existsSync(BRIEF_PATH) ? readFileSync(BRIEF_PATH, "utf8") : "";
  const urls = reportUrls(report);

  const config = providerConfig();
  if (!config) {
    console.log(
      "policy-review: POLICY_AI_API_KEY is not set, so no review ran. The report stands on its own.",
    );
    setOutput({ status: "ai-missing", proposal: "" });
    return;
  }
  if (config.error) {
    console.error(`policy-review: ${config.error}`);
    process.exitCode = 1;
    return;
  }

  const { system, user } = buildPrompt({ reportMarkdown, briefSource });
  let answer;
  let attempt = 0;
  let failure;
  // Two attempts on a transport or parse failure. Not more: a review that needs five tries has a
  // prompt problem, and retrying it only spends quota.
  while (attempt < 2) {
    attempt += 1;
    const asked = await askModel({ system, user });
    if (asked.ok) {
      answer = asked.json;
      break;
    }
    failure = asked.reason;
    if (attempt < 2) await sleep(3_000);
  }

  if (!answer) {
    console.error(`policy-review: the model did not answer with JSON — ${failure}`);
    setOutput({ status: "ai-failed" });
    process.exitCode = 1;
    return;
  }

  const verdict = validateProposal(answer, {
    reportText: `${reportMarkdown}\n${JSON.stringify(report)}`,
    reportUrls: urls,
  });
  const body = renderProposal({
    report,
    answer,
    verdict,
    model: `${config.provider}/${config.model}`,
  });

  console.log(`policy-review: ${verdict.status}`);
  for (const error of verdict.errors) console.error(`  gate: ${error}`);
  for (const warning of verdict.warnings) console.log(`  warn: ${warning}`);

  if (values["dry-run"]) {
    console.log(`\n${body}`);
    setOutput({ status: verdict.status });
    return;
  }

  if (verdict.status === "not-relevant") {
    // No file, no pull request: the issue already carries the report, and a folder of "nothing
    // happened" files would bury the days that mattered.
    setOutput({ status: verdict.status });
    return;
  }

  mkdirSync(PROPOSALS_DIR, { recursive: true });
  const base = resolve(PROPOSALS_DIR, report.day);
  writeFileSync(
    `${base}.json`,
    `${JSON.stringify({ report: relative(ROOT, reportPath), verdict, answer }, null, 2)}\n`,
  );
  if (verdict.status === "invalid") {
    writeFileSync(`${base}.rejected.md`, `${body}\n`);
    setOutput({ status: verdict.status, proposal: relative(ROOT, `${base}.rejected.md`) });
    // A rejected answer is a prompt or model problem the founder should see, so the run is red.
    process.exitCode = 1;
    return;
  }

  writeFileSync(`${base}.md`, `${body}\n`);
  const proposal = relative(ROOT, `${base}.md`).replace(/\\/g, "/");
  console.log(`policy-review: wrote ${proposal}`);
  setOutput({
    status: verdict.status,
    proposal,
    title: proposalTitle(report),
    confidence: Number(answer.confidence).toFixed(2),
  });
}

main().catch((error) => {
  console.error(`policy-review: ${error instanceof Error ? error.stack : error}`);
  process.exit(1);
});
