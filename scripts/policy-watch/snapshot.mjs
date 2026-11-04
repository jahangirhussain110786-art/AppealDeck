/**
 * What one source looked like today, and what changed since the stored snapshot (4 Nov 2026).
 *
 * Kept separate from `core.mjs` because these two functions are the only place that decides whether
 * a run reports "changed". They take the fetched body as a string — no network — so the whole
 * decision can be exercised in a test with a saved page.
 */

import {
  diffLines,
  extractLinks,
  hashLines,
  looksReadable,
  newFeedItems,
  newLinks,
  normaliseText,
  parseFeed,
} from "./core.mjs";

/** A snapshot is refused rather than stored when it cannot be the page the source names. */
export function buildSnapshot(source, body, { fetchedAt }) {
  if (!looksReadable(source, body)) {
    const hint = /ap\/signin/i.test(String(body))
      ? "the site returned its sign-in page"
      : `the expected text "${source.expect ?? "(none)"}" was absent`;
    return { ok: false, reason: hint };
  }

  if (source.kind === "feed") {
    const items = parseFeed(body).slice(0, 50);
    const minimum = source.minItems ?? 1;
    if (items.length < minimum) {
      return {
        ok: false,
        reason: `the feed parsed to ${items.length} items (expected ${minimum}+)`,
      };
    }
    return { ok: true, snapshot: { kind: "feed", fetchedAt, items } };
  }

  if (source.kind === "links") {
    const links = extractLinks(body, source.url, source.include);
    if (links.length < 3) {
      return { ok: false, reason: `the index yielded ${links.length} matching links` };
    }
    return { ok: true, snapshot: { kind: "links", fetchedAt, links } };
  }

  const lines = normaliseText(body);
  if (lines.length < 10) {
    // A page whose readable text collapsed is a layout change or a JavaScript shell, not an empty
    // policy. Storing it would erase the real snapshot and hide the next real edit.
    return { ok: false, reason: `the page yielded ${lines.length} readable lines` };
  }
  return {
    ok: true,
    snapshot: { kind: "text", fetchedAt, hash: hashLines(lines), lines: lines.slice(0, 400) },
  };
}

/**
 * Compared per kind. `firstSeen` is a seed run, not a change: everything would otherwise be "new"
 * on day one and the founder would receive an alert listing the whole current page.
 */
export function compareSnapshot(previous, current) {
  if (!previous) {
    return {
      status: "first-seen",
      newItems: [],
      editedItems: [],
      addedLines: [],
      removedLines: [],
      newLinks: [],
      droppedLinks: [],
    };
  }

  if (current.kind === "feed") {
    const { added, edited } = newFeedItems(previous.items ?? [], current.items ?? []);
    return {
      status: added.length || edited.length ? "changed" : "unchanged",
      newItems: added,
      editedItems: edited,
      addedLines: [],
      removedLines: [],
      newLinks: [],
      droppedLinks: [],
    };
  }

  if (current.kind === "links") {
    const added = newLinks(previous.links ?? [], current.links ?? []);
    const dropped = newLinks(current.links ?? [], previous.links ?? []);
    return {
      status: added.length ? "changed" : "unchanged",
      newItems: [],
      editedItems: [],
      addedLines: [],
      removedLines: [],
      newLinks: added,
      // A post leaving the first page of an index is not a deletion. Reported only, never alerted.
      droppedLinks: dropped,
    };
  }

  // The line diff decides, not the stored hash. A hash is only a shortcut, and a snapshot whose
  // hash and lines ever disagree (a hand-edited baseline, a half-written file) would otherwise
  // report "unchanged" forever. A page that merely reordered its own sections is still unchanged.
  const { added, removed } = diffLines(previous.lines ?? [], current.lines ?? []);
  return {
    status: added.length || removed.length ? "changed" : "unchanged",
    newItems: [],
    editedItems: [],
    addedLines: added,
    removedLines: removed,
    newLinks: [],
    droppedLinks: [],
  };
}

/**
 * A bare revision number for a page, so an unchanged report can still say "checked, still the same"
 * without carrying the lines. Used by the digest line, not by the comparison.
 */
export function snapshotStamp(snapshot) {
  if (snapshot.kind === "feed") return `${snapshot.items.length} items`;
  if (snapshot.kind === "links") return `${snapshot.links.length} links`;
  return snapshot.hash.slice(7, 19);
}
