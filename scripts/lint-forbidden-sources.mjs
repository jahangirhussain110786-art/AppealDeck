/**
 * Fails when a forbidden third-party source appears to have been copied into this repository.
 *
 * `CLAUDE.md` §3 lists the forbidden sources as one of this project's three absolutes ("absolute,
 * no exceptions") and names the check itself: "Any file whose content mentions 'superpower' (grep
 * before committing any copied file)." The 22 Sep 2026 gap audit found that the `guarantee` gate
 * had existed in `lint-copy.mjs` since August and this one existed nowhere — not in CI, not in any
 * script. The rule was enforced entirely by remembering to run a grep by hand, which is the same
 * mechanism that failed at every other defect that week.
 *
 * Scope is deliberately code and assets, not prose. Documents that *discuss* the rule — this file,
 * `CLAUDE.md`, the audit, the decision log — must be able to name the thing they forbid. A copied
 * donor file, which is what the rule is actually about, is never Markdown.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

/** Where copied code could land. Prose directories are deliberately absent — see the header. */
const SCAN_DIRS = ["src", "scripts", "e2e", "public", "supabase"];

/** Extensions worth reading. A donor file is source, style, markup or config — never prose. */
const SCAN_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
  ".scss",
  ".html",
  ".json",
  ".sql",
  ".svg",
]);

const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "dist", "build", "coverage"]);

/**
 * This file. A gate has to name the thing it forbids, and on its first run this one failed on its
 * own doc comment — recorded here rather than silently worked around, because the alternative
 * (splitting the marker into fragments so the source never spells it) would have made the rule
 * unreadable to the next person, which is how the forbidden-sources rule went unenforced for a
 * month in the first place. No other file in the repository matched.
 */
const SELF = path.join(ROOT, "scripts", "lint-forbidden-sources.mjs");

/**
 * The marker from CLAUDE.md §3. Kept as its own list so a future forbidden source can be added
 * without restructuring anything — each entry needs the name and why it is forbidden.
 */
const FORBIDDEN_MARKERS = [
  {
    pattern: /superpower/i,
    name: "superpower",
    why: "Superpower ChatGPT is third-party proprietary code (CLAUDE.md §3 FORBIDDEN SOURCES).",
  },
];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SCAN_EXT.has(path.extname(entry))) out.push(full);
  }
  return out;
}

const files = SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
const hits = [];

for (const file of files) {
  if (path.resolve(file) === SELF) continue;
  const text = readFileSync(file, "utf8");
  for (const marker of FORBIDDEN_MARKERS) {
    if (!marker.pattern.test(text)) continue;
    const line = text.split("\n").findIndex((l) => marker.pattern.test(l)) + 1;
    hits.push({ file: path.relative(ROOT, file), line, marker });
  }
}

console.log(`lint-forbidden-sources: scanned ${files.length} files in ${SCAN_DIRS.join(", ")}`);

if (hits.length) {
  console.error("\nlint-forbidden-sources: FAIL\n");
  for (const h of hits) {
    console.error(`  ${h.file}:${h.line} contains "${h.marker.name}"`);
    console.error(`    ${h.marker.why}`);
  }
  console.error(
    "\nThis is not a style rule. Remove the file and write the behaviour from scratch, or,\n" +
      "if the match is a genuine false positive, say so in CLAUDE.md §3 before changing this gate.\n",
  );
  process.exit(1);
}

console.log("lint-forbidden-sources: PASS");
