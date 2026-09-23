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
 *   components  — is the symbol referenced anywhere outside its own file, its test and the
 *                 dev-only gallery?
 *   modules     — does any non-test module under src/core or src/lib import this file?
 *   API routes  — does something in src call this path, or (for a cron) does vercel.json
 *                 schedule it, or is it a documented external entry point?
 *
 * A job route that nothing schedules is the exact shape of the AA-40 bug, so it fails here.
 *
 * The middle check and the gallery exclusion were added on 23 Sep 2026 (A-13), after the gap audit
 * found thirteen features that were built, tested, ticked off as delivered — and passed this gate
 * while no seller could reach any of them. Running the new checks immediately turned up two more:
 * `EvidenceSlotPanel`, whose only live mention was inside another file's comment explaining why it
 * had been superseded, and `SignOutButton`, orphaned when sign-out moved into the profile menu.
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

/**
 * A-13, added 23 Sep 2026. The gate had two blind spots, and between them they hid thirteen
 * features that were built, tested, ticked off as delivered and reachable by no seller.
 *
 * The first is here: `src/app/dev/ui/DevUiGallery.tsx` imports everything it previews, and it is a
 * dev-only route that 404s under `next start`. A reference from it therefore looked like a real
 * reference to this script and to any casual grep, while being invisible to every seller. Four
 * components and, through `EvidenceSlotPanel`, the whole EF-4 letter set sat behind it.
 *
 * Gallery references no longer count. A primitive that genuinely belongs there needs an entry
 * below with a reason, so keeping one is a decision somebody made rather than a thing that drifted.
 */
const DEV_GALLERY = `${path.sep}app${path.sep}dev${path.sep}`;
const GALLERY_ONLY = new Map([
  [
    "Stepper",
    "A generic progress rail with no current consumer — the workspace is not a linear step flow. Kept as a gallery primitive by decision (classification A-10, 23 Sep 2026), not by drift.",
  ],
  [
    "MagnifierDocumentIllustration",
    "Layered SVG from AM-22 V2, awaiting the V7 cross-page sweep that was never run.",
  ],
  [
    "ShieldCheckIllustration",
    "Layered SVG from AM-22 V2, awaiting the V7 cross-page sweep that was never run.",
  ],
  [
    "kbd",
    "Generic keyboard-key primitive with no current consumer. Nothing in the product shows a shortcut yet.",
  ],
  ["separator", "Generic rule primitive. Layouts currently use border utilities directly."],
]);

/**
 * The second blind spot: this script checked components and API routes only, so a dead module under
 * `src/core` or `src/lib` was invisible to it. Five were — the interview step engine, the
 * draft-strength signal built from the founder's own complaint, the ID normaliser, the old
 * clipboard builder and a motion re-export.
 *
 * Test-support files are excluded because tests are excluded from counting as importers, so a
 * fixture would otherwise always look dead.
 */
const MODULE_EXEMPT = /(\.fixture\.ts|\.d\.ts)$/;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/**
 * A-13: a mention in a comment is not a reference, and treating it as one is the same laundering
 * as counting the dev gallery. `EvidenceSlotPanel` — the only place the EF-4 outreach letters were
 * rendered — looked alive to this script solely because another component's doc comment named it
 * while explaining why it had been superseded.
 *
 * Whole comment lines and block comments only. A `//` inside a string is left alone, because
 * stripping to end-of-line there could remove real code on the same line and turn a live reference
 * into a false failure.
 */
function withoutComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      return !t.startsWith("//") && !t.startsWith("*");
    })
    .join("\n");
}

const allFiles = walk(path.join(ROOT, "src")).filter((f) => /\.(ts|tsx)$/.test(f));
const sources = new Map(allFiles.map((f) => [f, withoutComments(readFileSync(f, "utf8"))]));

const isTest = (f) => f.includes("__tests__") || /\.(test|spec)\.tsx?$/.test(f);

const failures = [];

// --- Components -------------------------------------------------------------------------------
// Route entry points are reached by the router, not by an import, so they are not components.
const ROUTE_FILES = new Set([
  "page.tsx",
  "layout.tsx",
  "error.tsx",
  "loading.tsx",
  "not-found.tsx",
]);

for (const file of allFiles) {
  if (!file.includes(`${path.sep}components${path.sep}`)) continue;
  if (isTest(file) || !file.endsWith(".tsx")) continue;
  if (ROUTE_FILES.has(path.basename(file))) continue;

  const name = path.basename(file, ".tsx");
  const referenced = [...sources.entries()].some(
    ([other, text]) =>
      other !== file &&
      !isTest(other) &&
      // A-13: the dev gallery previews everything and ships to nobody.
      !other.includes(DEV_GALLERY) &&
      new RegExp(`\\b${name.replace(/[^\w]/g, "\\$&")}\\b`).test(text),
  );
  if (!referenced && !GALLERY_ONLY.has(name)) {
    failures.push(
      `${path.relative(ROOT, file)} — nothing outside its own tests and the dev gallery references it. Mount it, add it to GALLERY_ONLY with a reason, or delete it.`,
    );
  }
}

// --- Core and lib modules ---------------------------------------------------------------------
// Imported by path rather than by symbol name, so this matches the specifier instead of the export.
for (const file of allFiles) {
  const inCore = file.includes(`${path.sep}core${path.sep}`);
  const inLib = file.includes(`${path.sep}lib${path.sep}`);
  if (!inCore && !inLib) continue;
  if (isTest(file) || MODULE_EXEMPT.test(file) || !file.endsWith(".ts")) continue;

  const name = path.basename(file, ".ts");
  // A barrel is reached through the directory it re-exports, not by its own name.
  if (name === "index") continue;

  const escaped = name.replace(/[^\w]/g, "\\$&");
  const specifier = new RegExp(`from\\s+["'][^"']*\\/${escaped}["']`);
  const referenced = [...sources.entries()].some(
    ([other, text]) =>
      other !== file && !isTest(other) && !other.includes(DEV_GALLERY) && specifier.test(text),
  );
  if (!referenced) {
    failures.push(
      `${path.relative(ROOT, file)} — no non-test module imports it. Wire it to something a seller can reach, or delete it.`,
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
