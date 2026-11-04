/**
 * Pure functions behind the daily policy watch (4 Nov 2026). No network, no filesystem, no clock:
 * everything here is a string or a list in, a string or a list out, so the parts that decide whether
 * Amazon changed something can be tested without touching the internet.
 *
 * Why the design is split by kind rather than "hash the page":
 * - A feed (`feed`) is compared by item id. RSS is the publisher's own statement that something is
 *   new, and it carries a date; hashing the whole XML would also fire on an ad slot or a reordered
 *   item.
 * - A document (`text`) is compared line by line, because a fee page has no feed and its meaning
 *   lives in the wording that changed.
 * - An index (`links`) is compared as a set of article URLs, because a blog's HTML churns constantly
 *   while its list of published articles does not.
 *
 * A source that returns a login wall or a "not found" page must never read as "unchanged": that is
 * the failure mode where a watcher runs for months and reports silence while the page it watches is
 * unreachable. Every source carries an `expect` string, checked before anything is compared.
 */

import { createHash } from "node:crypto";

export const WATCH_VERSION = 1;

const ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "\u2013",
  mdash: "\u2014",
  rsquo: "\u2019",
  lsquo: "\u2018",
  ldquo: "\u201c",
  rdquo: "\u201d",
};

export function decodeEntities(value) {
  return String(value).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code) => {
    if (code[0] === "#") {
      const hex = code[1] === "x" || code[1] === "X";
      const point = Number.parseInt(hex ? code.slice(2) : code.slice(1), hex ? 16 : 10);
      return Number.isFinite(point) ? String.fromCodePoint(point) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

/** Text of one tag inside one feed item, with CDATA and nested markup removed. */
function tagText(block, name) {
  const pattern = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i");
  const found = block.match(pattern);
  if (!found) return "";
  return decodeEntities(
    found[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, ""),
  ).trim();
}

function itemLink(block) {
  const href = block.match(/<link\b[^>]*href=["']([^"']+)["']/i);
  if (href) return decodeEntities(href[1]).trim();
  const inner = block.match(/<link(?:\s[^>]*)?>([\s\S]*?)<\/link>/i);
  if (inner) return decodeEntities(inner[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")).trim();
  return "";
}

/**
 * RSS and Atom into a flat item list. Both shapes appear in the wild and Amazon uses RSS; Atom is
 * handled because the same function serves a future source without a second parser.
 */
export function parseFeed(xml) {
  const blocks = [...String(xml).matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].map((m) => m[0]);
  return blocks
    .map((block) => {
      const title = tagText(block, "title").replace(/\s+/g, " ");
      const link = itemLink(block);
      const date =
        tagText(block, "pubDate") || tagText(block, "published") || tagText(block, "updated");
      const id = tagText(block, "guid") || tagText(block, "id") || link || title;
      return { id, title, link, date };
    })
    .filter((item) => item.title && item.id);
}

/** Short stable fingerprint of an item, so an edited title counts as an edit rather than a new item. */
export function itemFingerprint(item) {
  return createHash("sha256").update(`${item.id}\u0000${item.title}`).digest("hex").slice(0, 16);
}

function stripNoise(html) {
  return String(html)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1>/gi, " ");
}

/**
 * A page into comparable lines. Line breaks are inserted at block boundaries before tags are
 * stripped, so two sentences in two paragraphs do not merge into one line and hide an edit inside
 * a single unchanged-looking line. Lines shorter than `minLength` are navigation, cookie bars and
 * button labels; keeping them would make every run noisy.
 */
export function normaliseText(html, { minLength = 20 } = {}) {
  const text = stripNoise(html)
    .replace(
      /<\/?(p|div|li|ul|ol|h[1-6]|tr|td|th|section|article|header|footer|br|figure)\b[^>]*>/gi,
      "\n",
    )
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ");
  return decodeEntities(text)
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= minLength);
}

export function hashLines(lines) {
  return `sha256:${createHash("sha256").update(lines.join("\n")).digest("hex")}`;
}

/** Drains `stock` one occurrence at a time, so a repeated line is reported as many times as it repeats. */
function takeOne(stock, value) {
  const count = stock.get(value) ?? 0;
  if (count === 0) return false;
  if (count === 1) stock.delete(value);
  else stock.set(value, count - 1);
  return true;
}

function countValues(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

/** Added and removed lines between two snapshots, each capped so a rebuilt page cannot flood a report. */
export function diffLines(previous = [], current = [], { limit = 40 } = {}) {
  const previousStock = countValues(previous);
  const currentStock = countValues(current);
  const added = current.filter((line) => !takeOne(previousStock, line)).slice(0, limit);
  const removed = previous.filter((line) => !takeOne(currentStock, line)).slice(0, limit);
  return { added, removed };
}

function withoutTracking(url) {
  try {
    const parsed = new URL(url);
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|ref_|pf_rd_|tag$|linkCode$)/i.test(key)) parsed.searchParams.delete(key);
    }
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Published article URLs from an index page, same-origin only and filtered by `include`, in document
 * order. Document order is kept on purpose: it is the page's own idea of newest-first.
 */
export function extractLinks(html, baseUrl, include, { limit = 80 } = {}) {
  const origin = new URL(baseUrl).origin;
  const filter = include ? new RegExp(include) : null;
  const seen = new Set();
  const links = [];
  for (const match of String(html).matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)) {
    const raw = decodeEntities(match[1]).trim();
    // An in-page anchor points at the page itself; "javascript:" is not a published article.
    if (!raw || raw.startsWith("#") || /^javascript:/i.test(raw)) continue;
    let absolute;
    try {
      absolute = new URL(raw, baseUrl).toString();
    } catch {
      continue;
    }
    if (!absolute.startsWith(origin)) continue;
    const clean = withoutTracking(absolute);
    if (filter && !filter.test(clean)) continue;
    if (seen.has(clean)) continue;
    seen.add(clean);
    links.push(clean);
    if (links.length >= limit) break;
  }
  return links;
}

/** True when the body is what the source is supposed to be, not a login wall or an error page. */
export function looksReadable(source, body) {
  if (!body || body.length < 200) return false;
  if (!source.expect) return true;
  return String(body).toLowerCase().includes(String(source.expect).toLowerCase());
}

export function newFeedItems(previousItems = [], currentItems = []) {
  const known = new Map(previousItems.map((item) => [item.id, itemFingerprint(item)]));
  const added = currentItems.filter((item) => !known.has(item.id));
  const edited = currentItems.filter(
    (item) => known.has(item.id) && known.get(item.id) !== itemFingerprint(item),
  );
  return { added, edited };
}

export function newLinks(previousLinks = [], currentLinks = []) {
  const known = new Set(previousLinks);
  return currentLinks.filter((link) => !known.has(link));
}

/** Days between two YYYY-MM-DD strings, counted in whole days, in UTC. */
export function daysBetween(from, to) {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return Math.floor((end - start) / 86_400_000);
}

export function isoDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
