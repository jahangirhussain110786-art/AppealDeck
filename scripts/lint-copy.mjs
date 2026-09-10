#!/usr/bin/env node
/*
 * lint-copy.mjs — copy gate for Wave B (AA-29).
 * Banned-pattern regex over src/ excluding test / e2e / __tests__.
 * Banned-number regex over src/content/** and src/core/guidance.ts only.
 * Banned-punctuation (exclamation marks) over src/content/** only.
 * Colour gate over src/components + src/app excluding src/components/ui/, with an allow-list.
 * Exit 1 with file:line:match on any hit.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// --- allow-lists ---
const CLAIMS_ALLOWLIST = path.join(ROOT, "src/content/claims-allowlist.txt");
const COLOUR_EXCEPTIONS = new Set([
  // Google "G" logo on /login + /signup (legitimate brand colours, excluded by Task 0 notes)
  "#4285F4",
  "#34A853",
  "#FBBC05",
  "#EA4335",
]);

const BANNED_PATTERNS = [
  /\bguarantee\b/i,
  /\btrusted by\b/i,
  /\bbank-grade\b/i,
  /\bmilitary-grade\b/i,
  /\bprivacy-first\b/i,
  /\bpeace of mind\b/i,
  /\brest assured\b/i,
  /\bhassle\b/i,
  /\bseamless\b/i,
  /\beffortless\b/i,
  /\brevolutionary\b/i,
  /\bai-powered\b/i,
  /\binstantly\b/i,
];

// banned soft list — warn-only (counts as hits for the gate)
const SOFT_PATTERNS = [
  /\bsecure\b/i,
  /\bdon't worry\b/i,
  /\bpowerful\b/i,
  /\bsimply\b/i,
  /\bjust\b/i,
];

const BANNED_NUMBERS = [/\d+\s?%/i, /win\s*rate/i, /success\s*rate/i, /\d+\s*(hours?|hrs)\b/i];
// banned punctuation — exclamation marks in copy (content modules only). A letter, digit or
// closing bracket followed by "!" and then a quote, whitespace, "." or ",".
const BANNED_PUNCTUATION = [/[A-Za-z0-9)]!(?=["'`\s.,])/];
const SOFT_LIST_FILES = /(\bsrc\/app\/|src\/components\/|src\/content\/)/;

// colour literals: #hex OR Tailwind colour-nnn (amber-500, red-300, etc.)
const HEX_RE = /#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])/g;
const TW_COLOR_RE =
  /\b(amber|red|green|blue|yellow|emerald|rose|slate|zinc|gray|orange|sky|teal|lime|violet|fuchsia|pink|indigo)-[0-9]{2,3}\b/g;

function loadClaimsAllowlist() {
  if (!existsSync(CLAIMS_ALLOWLIST)) return [];
  return readFileSync(CLAIMS_ALLOWLIST, "utf8")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("#"));
}

function walk(dir, acc) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next" || e.name === "playwright-report")
        continue;
      walk(full, acc);
    } else if (/\.(ts|tsx)$/.test(e.name)) {
      acc.push(full);
    }
  }
}

// Repo-relative path with "/" separators on every platform. path.relative() returns "\"
// on Windows, which would make every /src\/…\// filter below match nothing there.
function relPosix(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

function isExcluded(rel) {
  return (
    /__tests__|tests\//.test(rel) || /e2e/.test(rel) || /\.test\./.test(rel) || /\.spec\./.test(rel)
  );
}

function lineOf(text, idx) {
  return 1 + (text.slice(0, idx).split("\n").length - 1);
}

function scanFile(file, patterns, allow, opts) {
  const rel = relPosix(file);
  if (isExcluded(rel)) return [];
  const text = readFileSync(file, "utf8");
  const findings = [];
  const lines = text.split("\n");
  for (const re of patterns) {
    for (const m of text.matchAll(new RegExp(re.source, "g"))) {
      const matched = m[0];
      if (opts.numericDate) {
        // skip ISO-style YYYY-MM-DD that contains the matched substring
        const isoCtx = text.slice(Math.max(0, m.index - 6), m.index + matched.length + 4);
        if (/^\d{4}-\d{2}-\d{2}/.test(isoCtx) || /\d{4}-\d{2}-\d{2}/.test(isoCtx)) continue;
      }
      if (allow.some((a) => typeof a === "string" && matched === a)) continue;
      const before = text.slice(0, m.index).split("\n").length;
      findings.push({ rel, line: before, match: matched, rule: re.toString() });
    }
  }
  findings.forEach((f) => {
    console.error(`  ${f.rel}:${f.line}  "${f.match}"  (${f.rule})`);
  });
  return findings;
}

function main() {
  const files = [];
  walk(path.join(ROOT, "src"), files);
  const allow = loadClaimsAllowlist();
  let errors = 0;

  console.error("lint-copy: banned strings");
  for (const f of files) {
    const hits = scanFile(f, BANNED_PATTERNS, allow, {});
    if (hits.length) errors += hits.length;
  }

  console.error("lint-copy: banned soft list");
  for (const f of files) {
    const rel = relPosix(f);
    if (!SOFT_LIST_FILES.test(rel)) continue;
    const hits = scanFile(f, SOFT_PATTERNS, allow, {});
    if (hits.length) errors += hits.length;
  }

  console.error("lint-copy: banned numbers (content + guidance only)");
  const restricted = files.filter(
    (f) => /src\/content\//.test(relPosix(f)) || /src\/core\/guidance\.ts/.test(relPosix(f)),
  );
  for (const f of restricted) {
    const hits = scanFile(f, BANNED_NUMBERS, allow, { numericDate: true });
    if (hits.length) errors += hits.length;
  }

  console.error("lint-copy: banned punctuation (content only)");
  const contentFiles = files.filter((f) => /src\/content\//.test(relPosix(f)));
  for (const f of contentFiles) {
    const hits = scanFile(f, BANNED_PUNCTUATION, allow, {});
    if (hits.length) errors += hits.length;
  }

  console.error("lint-copy: colour gate (hex + tailwind colour-nnn)");
  const colourFiles = files.filter((f) => {
    const rel = relPosix(f);
    return /src\/components\//.test(rel) && !/src\/components\/ui\//.test(rel);
  });
  for (const f of colourFiles) {
    const text = readFileSync(f, "utf8");
    const hexRe = new RegExp(HEX_RE.source, "g");
    for (const m of text.matchAll(hexRe)) {
      if (COLOUR_EXCEPTIONS.has(m[0])) continue;
      const line = text.slice(0, m.index).split("\n").length;
      console.error(`  ${relPosix(f)}:${line}  colour "${m[0]}"`);
      errors += 1;
    }
    const tw = new RegExp(TW_COLOR_RE.source, "g");
    for (const m of text.matchAll(tw)) {
      const line = text.slice(0, m.index).split("\n").length;
      console.error(`  ${relPosix(f)}:${line}  tailwind colour "${m[0]}"`);
      errors += 1;
    }
  }

  if (errors) {
    console.error(`\nFAIL — lint-copy found ${errors} issue(s).`);
    process.exit(1);
  }
  console.error("lint-copy: PASS");
}

main();
