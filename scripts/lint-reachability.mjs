/**
 * Fails when something is built but nothing can reach it.
 *
 * Seven defects in the week of 22 Sep 2026 were of one kind, and none of them was a missing
 * feature: the facts ledger read a field the seller had not filled yet, the document-check panel
 * was wired only into a path that was being retired, the AA-40 reminder cron was never registered
 * so the feature could not fire at all, and retiring the classic interview left its components and
 * one Pass-gated LLM route behind with no caller — silently killing the AI field-suggestion
 * feature. Each was found by accident, days or weeks later.
 *
 * Vigilance did not catch those, so this does. It answers one question per thing: can anything
 * actually reach you?
 *
 *   components  — is the symbol referenced anywhere outside its own file and its test?
 *   API routes  — does something in src call this path, or (for a cron) does vercel.json
 *                 schedule it, or is it a documented external entry point?
 *
 * A job route that nothing schedules is the exact shape of the AA-40 bug, so it fails here.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

/**
 * Routes nothing in this repo calls, because the caller is someone else's server. Each needs a
 * reason: the point is that adding one is a decision, not a reflex.
 */
const EXTERNAL_ENTRY_POINTS = new Map([
  ["/api/webhooks/paddle", "Paddle posts here; there is no in-app caller by design."],
]);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const allFiles = walk(path.join(ROOT, "src")).filter((f) => /\.(ts|tsx)$/.test(f));
const sources = new Map(allFiles.map((f) => [f, readFileSync(f, "utf8")]));

const isTest = (f) => f.includes("__tests__") || /\.(test|spec)\.tsx?$/.test(f);

const failures = [];

// --- Components -------------------------------------------------------------------------------
// Route entry points are reached by the router, not by an import, so they are not components.
const ROUTE_FILES = new Set(["page.tsx", "layout.tsx", "error.tsx", "loading.tsx", "not-found.tsx"]);

for (const file of allFiles) {
  if (!file.includes(`${path.sep}components${path.sep}`)) continue;
  if (isTest(file) || !file.endsWith(".tsx")) continue;
  if (ROUTE_FILES.has(path.basename(file))) continue;

  const name = path.basename(file, ".tsx");
  const referenced = [...sources.entries()].some(
    ([other, text]) =>
      other !== file &&
      !isTest(other) &&
      new RegExp(`\\b${name.replace(/[^\w]/g, "\\$&")}\\b`).test(text),
  );
  if (!referenced) {
    failures.push(
      `${path.relative(ROOT, file)} — nothing outside its own tests references it. Mount it or delete it.`,
    );
  }
}

// --- API routes -------------------------------------------------------------------------------
let cronPaths = new Set();
try {
  const vercel = JSON.parse(readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
  cronPaths = new Set((vercel.crons ?? []).map((c) => c.path));
} catch {
  // No vercel.json: every job route will report as unscheduled, which is the honest answer.
}

for (const file of allFiles) {
  if (path.basename(file) !== "route.ts") continue;
  const apiPath = path
    .relative(path.join(ROOT, "src", "app"), path.dirname(file))
    .split(path.sep)
    .join("/");
  const route = `/${apiPath}`;
  if (!route.startsWith("/api/")) continue;

  if (EXTERNAL_ENTRY_POINTS.has(route)) continue;
  if (cronPaths.has(route)) continue;

  const calledFromApp = [...sources.entries()].some(
    ([other, text]) =>
      !other.includes(`${path.sep}app${path.sep}api${path.sep}`) &&
      !isTest(other) &&
      text.includes(route),
  );
  if (calledFromApp) continue;

  const isJob = route.startsWith("/api/jobs/");
  failures.push(
    isJob
      ? `${route} — a job route with no schedule. Add it to vercel.json "crons", or delete it.`
      : `${route} — no caller in src/. Wire it to a surface, add it to EXTERNAL_ENTRY_POINTS with a reason, or delete it.`,
  );
}

if (failures.length > 0) {
  console.error("lint-reachability: unreachable code\n");
  for (const f of failures) console.error(`  - ${f}`);
  console.error(`\n${failures.length} unreachable item(s).`);
  process.exit(1);
}

console.log("lint-reachability: PASS");
