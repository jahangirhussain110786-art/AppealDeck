/**
 * The daily Amazon policy watch (4 Nov 2026).
 *
 *   node scripts/policy-watch.mjs            fetch, compare, report, notify
 *   node scripts/policy-watch.mjs --seed     store today's snapshots as the starting point
 *   node scripts/policy-watch.mjs --dry-run  print the report, write and send nothing
 *   node scripts/policy-watch.mjs --only=sp-api-changelog
 *
 * What it can and cannot see is stated in `content/policy-watch/README.md`: these are Amazon's
 * public pages and feeds. The Seller Central policy documents themselves sit behind a login and are
 * deliberately not listed here, because an unauthenticated fetch of them returns a sign-in form and
 * a watcher that compares two sign-in forms is a watcher that reports silence forever.
 *
 * Nothing here edits copy. It records what moved, and the review step turns that into a proposal.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { daysBetween, isoDay } from "./policy-watch/core.mjs";
import { buildSnapshot, compareSnapshot } from "./policy-watch/snapshot.mjs";
import { fetchSource } from "./policy-watch/fetch.mjs";
import { notify } from "./policy-watch/notify.mjs";
import {
  renderReportMarkdown,
  renderReportText,
  reportSubject,
  reportTitle,
} from "./policy-watch/render.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES_PATH = resolve(ROOT, "content/policy-watch/sources.json");
const BASELINE_PATH = resolve(
  ROOT,
  process.env.POLICY_WATCH_BASELINE ?? "content/policy-watch/baseline.json",
);
const REPORTS_DIR = resolve(ROOT, "content/policy-watch/reports");
const BRIEF_PATH = resolve(ROOT, "src/core/policyBrief.ts");
const GUIDES_PATH = resolve(ROOT, "src/content/guides.ts");

/** The Playbook is held to the same age as the brief: past it, the answer is "re-check", not "read". */
const PLAYBOOK_MAX_AGE_DAYS = 90;

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

function policyBriefAge(day) {
  try {
    const source = readFileSync(BRIEF_PATH, "utf8");
    const checkedOn = source.match(/POLICY_BRIEF_CHECKED_ON\s*=\s*"([\d-]+)"/)?.[1];
    const maxAgeDays = Number(source.match(/POLICY_BRIEF_MAX_AGE_DAYS\s*=\s*(\d+)/)?.[1] ?? 90);
    if (!checkedOn) return { missing: true };
    const ageDays = daysBetween(checkedOn, day);
    return {
      checkedOn,
      ageDays,
      maxAgeDays,
      overdue: ageDays !== null && ageDays > maxAgeDays,
    };
  } catch {
    return { missing: true };
  }
}

/**
 * The oldest `lastVerified` in the Playbook. The number is the product's own claim, so the watch
 * reports it rather than assuming every page was checked when the code last changed.
 */
function playbookAge(day) {
  try {
    const source = readFileSync(GUIDES_PATH, "utf8");
    const dates = [...source.matchAll(/lastVerified:\s*"(\d{4}-\d{2}-\d{2})"/g)].map((m) => m[1]);
    if (!dates.length) return { missing: true };
    const oldest = [...dates].sort()[0];
    const ageDays = daysBetween(oldest, day);
    return {
      oldest,
      pages: dates.length,
      ageDays,
      maxAgeDays: PLAYBOOK_MAX_AGE_DAYS,
      overdue: ageDays !== null && ageDays > PLAYBOOK_MAX_AGE_DAYS,
    };
  } catch {
    return { missing: true };
  }
}

function setOutput(pairs) {
  const path = process.env.GITHUB_OUTPUT;
  if (!path) return;
  const body = Object.entries(pairs)
    .map(([key, value]) => `${key}=${String(value).replace(/\n/g, " ")}`)
    .join("\n");
  writeFileSync(path, `${body}\n`, { flag: "a" });
}

async function main() {
  const { values } = parseArgs({
    options: {
      seed: { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
      "no-notify": { type: "boolean", default: false },
      only: { type: "string" },
    },
  });

  const config = readJson(SOURCES_PATH, null);
  if (!config?.sources?.length) {
    console.error("policy-watch: no sources in content/policy-watch/sources.json");
    process.exit(1);
  }

  const sources = values.only
    ? config.sources.filter((source) => source.id === values.only)
    : config.sources;
  if (!sources.length) {
    console.error(`policy-watch: no source matches --only=${values.only}`);
    process.exit(1);
  }

  const baseline = readJson(BASELINE_PATH, { version: 1, sources: {} });
  const nextBaseline = { version: 1, sources: { ...baseline.sources } };
  const generatedAt = new Date().toISOString();
  const day = isoDay();
  const results = [];

  for (const [index, source] of sources.entries()) {
    if (index > 0) await sleep(1_200); // five requests a day; still, one at a time, politely.
    const fetched = await fetchSource(source, { timeoutMs: config.timeoutMs ?? 30_000 });
    const stored = baseline.sources[source.id];

    if (!fetched.ok) {
      results.push({
        id: source.id,
        label: source.label,
        url: source.url,
        tier: source.tier,
        status: "unreadable",
        reason: fetched.reason,
        newItems: [],
        editedItems: [],
        addedLines: [],
        removedLines: [],
        newLinks: [],
        droppedLinks: [],
      });
      console.log(`  ! ${source.label}: ${fetched.reason}`);
      continue;
    }

    const built = buildSnapshot(source, fetched.body, { fetchedAt: generatedAt });
    if (!built.ok) {
      results.push({
        id: source.id,
        label: source.label,
        url: source.url,
        tier: source.tier,
        status: "unreadable",
        reason: built.reason,
        newItems: [],
        editedItems: [],
        addedLines: [],
        removedLines: [],
        newLinks: [],
        droppedLinks: [],
      });
      // The stored snapshot is untouched on purpose: a page that briefly served a shell must not
      // erase the real text and make tomorrow's real edit invisible.
      console.log(`  ! ${source.label}: ${built.reason}`);
      continue;
    }

    const compared = compareSnapshot(
      stored && stored.kind === built.snapshot.kind ? stored : null,
      built.snapshot,
    );
    results.push({
      id: source.id,
      label: source.label,
      url: source.url,
      tier: source.tier,
      status: compared.status,
      reason: undefined,
      ...compared,
    });
    nextBaseline.sources[source.id] = built.snapshot;
    console.log(`  · ${source.label}: ${compared.status}`);
  }

  const brief = policyBriefAge(day);
  const playbook = playbookAge(day);
  const report = { generatedAt, day, sources: results, policyBrief: brief, playbook };
  const changed = results.some((result) => result.status === "changed");
  const changedCount = results.filter((result) => result.status === "changed").length;
  const unreadable = results.some((result) => result.status === "unreadable");
  const needsAttention =
    changed || unreadable || Boolean(brief.overdue) || Boolean(playbook.overdue);

  if (values.seed) {
    writeFileSync(BASELINE_PATH, `${JSON.stringify(nextBaseline, null, 2)}\n`);
    console.log(
      `policy-watch: seeded ${Object.keys(nextBaseline.sources).length} source(s) into ` +
        `${relative(ROOT, BASELINE_PATH)}`,
    );
    setOutput({ changed: "false", changes: "0" });
    return;
  }

  const markdown = renderReportMarkdown(report);
  const text = renderReportText(report);

  if (values["dry-run"]) {
    console.log(`\n${markdown}`);
    setOutput({ changed: String(needsAttention), changes: String(changedCount) });
    return;
  }

  if (!needsAttention) {
    console.log(`policy-watch: ${sources.length} source(s) unchanged; nothing sent.`);
    setOutput({ changed: "false", changes: "0" });
    return;
  }

  mkdirSync(REPORTS_DIR, { recursive: true });
  const reportBase = resolve(REPORTS_DIR, day);
  writeFileSync(`${reportBase}.md`, `${markdown}\n`);
  writeFileSync(`${reportBase}.json`, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(BASELINE_PATH, `${JSON.stringify(nextBaseline, null, 2)}\n`);

  const reportRelative = relative(ROOT, `${reportBase}.md`).replace(/\\/g, "/");
  console.log(`policy-watch: wrote ${reportRelative}`);
  setOutput({
    changed: "true",
    changes: String(changedCount),
    report: reportRelative,
    report_json: relative(ROOT, `${reportBase}.json`).replace(/\\/g, "/"),
    title: reportTitle(report),
    subject: reportSubject(report),
  });

  if (values["no-notify"]) return;

  const delivery = await notify({
    title: reportTitle(report),
    body: markdown,
    text,
    subject: reportSubject(report),
  });

  if (!delivery.delivered.length) {
    for (const attempt of delivery.attempts) {
      console.error(`policy-watch: ${attempt.channel} failed — ${attempt.reason}`);
    }
    console.error(
      "policy-watch: the change was found and stored, but nothing was delivered. " +
        "Set GITHUB_TOKEN (workflow) or RESEND_API_KEY + POLICY_ALERT_EMAIL.",
    );
    process.exit(1);
  }

  console.log(`policy-watch: delivered via ${delivery.delivered.map((d) => d.channel).join(", ")}`);
}

main().catch((error) => {
  console.error(`policy-watch: ${error instanceof Error ? error.stack : error}`);
  process.exit(1);
});
