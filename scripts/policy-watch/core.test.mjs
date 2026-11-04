import { describe, expect, it } from "vitest";
import {
  decodeEntities,
  diffLines,
  extractLinks,
  looksReadable,
  newFeedItems,
  normaliseText,
  parseFeed,
} from "./core.mjs";
import { buildSnapshot, compareSnapshot } from "./snapshot.mjs";
import { renderReportMarkdown } from "./render.mjs";

const RSS = `<?xml version="1.0"?><rss version="2.0"><channel>
<item><title><![CDATA[October 2026 SP-API Release]]></title>
<link>https://developer-docs.amazon.com/sp-api/changelog/a</link>
<guid>a</guid><pubDate>Wed, 28 Oct 2026 19:32:40 GMT</pubDate></item>
<item><title>Listing attribute changes</title>
<link>https://developer-docs.amazon.com/sp-api/changelog/b</link>
<guid>b</guid><pubDate>Wed, 14 Oct 2026 21:09:44 GMT</pubDate></item>
</channel></rss>`;

const ATOM = `<feed xmlns="http://www.w3.org/2005/Atom">
<entry><title>Atom entry</title><id>urn:1</id>
<link href="https://example.com/one"/><updated>2026-10-01T00:00:00Z</updated></entry>
</feed>`;

const PRICING_PAGE = `<html><body>
<nav><a href="/">Home</a><a href="/pricing">Pricing</a></nav>
<main>
<p>Referral fees are charged on the total sales price of an item.</p>
<p>Fulfilment by Amazon fees are charged per unit, based on size and weight.</p>
<p>Monthly storage fees apply to inventory held in Amazon fulfilment centres.</p>
<p>Long-term storage fees apply to inventory held for more than 365 days.</p>
<p>Removal and disposal fees are charged per unit removed from a centre.</p>
<p>Professional selling plans carry a monthly subscription fee per account.</p>
<p>Individual selling plans are charged a per-item fee on each sale.</p>
<p>Advertising costs are charged separately and are not part of referral fees.</p>
<p>Shipping credits are shown separately in the order settlement report.</p>
<p>Fee changes are announced before they take effect, and the date is stated.</p>
<p>Tax is calculated by Amazon and collected according to the destination.</p>
<p>Returns processing fees apply to orders in some categories and markets.</p>
</main>
</body></html>`;

describe("feed parsing", () => {
  it("reads RSS titles, links, ids and dates", () => {
    const items = parseFeed(RSS);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      id: "a",
      title: "October 2026 SP-API Release",
      link: "https://developer-docs.amazon.com/sp-api/changelog/a",
    });
    expect(items[0].date).toContain("28 Oct 2026");
  });

  it("reads Atom entries", () => {
    const items = parseFeed(ATOM);
    expect(items).toEqual([
      {
        id: "urn:1",
        title: "Atom entry",
        link: "https://example.com/one",
        date: "2026-10-01T00:00:00Z",
      },
    ]);
  });

  it("treats an edited title as an edit, not a new item", () => {
    const before = parseFeed(RSS);
    const after = parseFeed(RSS.replace("Listing attribute changes", "Listing attribute rules"));
    const { added, edited } = newFeedItems(before, after);
    expect(added).toHaveLength(0);
    expect(edited.map((item) => item.id)).toEqual(["b"]);
  });

  it("reports genuinely new ids", () => {
    const before = parseFeed(RSS);
    const after = parseFeed(
      RSS.replace(
        "</channel>",
        `<item><title>November 2026 SP-API Release</title>
<link>https://developer-docs.amazon.com/sp-api/changelog/c</link>
<guid>c</guid><pubDate>Mon, 02 Nov 2026 10:00:00 GMT</pubDate></item></channel>`,
      ),
    );
    const { added } = newFeedItems(before, after);
    expect(added.map((item) => item.id)).toEqual(["c"]);
  });
});

describe("page normalisation", () => {
  it("drops navigation-length lines and keeps policy sentences", () => {
    const lines = normaliseText(PRICING_PAGE);
    expect(lines).toHaveLength(12);
    expect(lines[0]).toContain("Referral fees");
    expect(lines.join(" ")).not.toContain("Pricing Pricing");
  });

  it("decodes named and numeric entities", () => {
    expect(decodeEntities("Amazon&apos;s &amp; fees &#8212; here")).toBe(
      "Amazon's & fees \u2014 here",
    );
  });

  it("counts a repeated line as many times as it repeats", () => {
    const { added, removed } = diffLines(
      ["a long enough line here"],
      ["a long enough line here", "a long enough line here"],
    );
    expect(added).toEqual(["a long enough line here"]);
    expect(removed).toEqual([]);
  });
});

describe("readability guard", () => {
  it("refuses the sign-in shell Amazon returns for a signed-out help article", () => {
    const shell = `<html><body>${"x".repeat(400)}<form action="/ap/signin"><input type="password"></form></body></html>`;
    expect(looksReadable({ expect: "policies" }, shell)).toBe(false);
  });

  it("refuses a page that lost its expected text", () => {
    expect(looksReadable({ expect: "referral fee" }, "<html>Page not found</html>")).toBe(false);
  });
});

describe("snapshots", () => {
  const feedSource = {
    id: "feed",
    url: "https://example.com/feed",
    kind: "feed",
    expect: "SP-API",
    minItems: 1,
  };

  it("stores a readable feed", () => {
    const built = buildSnapshot(
      feedSource,
      RSS.replace("October 2026 SP-API Release", "SP-API release"),
      {
        fetchedAt: "2026-11-04T00:00:00Z",
      },
    );
    expect(built.ok).toBe(true);
    expect(built.snapshot.kind).toBe("feed");
  });

  it("refuses a feed that parsed to nothing", () => {
    // Long enough to pass the length floor, so the feed parser is what rejects it.
    const body = `<rss><channel><description>${"SP-API ".repeat(60)}</description></channel></rss>`;
    const built = buildSnapshot(feedSource, body, { fetchedAt: "2026-11-04T00:00:00Z" });
    expect(built.ok).toBe(false);
    expect(built.reason).toContain("0 items");
  });

  it("calls the first sight of a source first-seen, not changed", () => {
    const built = buildSnapshot(feedSource, RSS, { fetchedAt: "2026-11-04T00:00:00Z" });
    expect(compareSnapshot(null, built.snapshot).status).toBe("first-seen");
  });

  it("detects a text edit even when the stored hash agrees with itself", () => {
    const source = {
      id: "fee",
      url: "https://example.com/pricing",
      kind: "text",
      expect: "Referral",
    };
    const current = buildSnapshot(source, PRICING_PAGE, { fetchedAt: "2026-11-04T00:00:00Z" });
    const stored = {
      ...current.snapshot,
      // A baseline whose lines were changed without recomputing the hash must still be compared.
      lines: [
        ...current.snapshot.lines,
        "A referral fee change that Amazon published after the snapshot.",
      ],
    };
    const compared = compareSnapshot(stored, current.snapshot);
    expect(compared.status).toBe("changed");
    expect(compared.removedLines[0]).toContain("published after the snapshot");
  });

  it("treats a reordered page as unchanged", () => {
    const source = {
      id: "fee",
      url: "https://example.com/pricing",
      kind: "text",
      expect: "Referral",
    };
    const current = buildSnapshot(source, PRICING_PAGE, { fetchedAt: "2026-11-04T00:00:00Z" });
    const reordered = { ...current.snapshot, lines: [...current.snapshot.lines].reverse() };
    expect(compareSnapshot(reordered, current.snapshot).status).toBe("unchanged");
  });
});

describe("index links", () => {
  const page = `<a href="/blog/first-post">First</a>
    <a href="/blog/first-post?utm_source=x">First again</a>
    <a href="/about">About</a>
    <a href="https://other.example/blog/no">Elsewhere</a>
    <a href="/blog/second-post#top">Second</a>`;

  it("keeps same-origin article links once, without tracking parameters", () => {
    const links = extractLinks(page, "https://sell.amazon.com/blog", "/blog/[^/?#]+$");
    expect(links).toEqual([
      "https://sell.amazon.com/blog/first-post",
      "https://sell.amazon.com/blog/second-post",
    ]);
  });
});

describe("report", () => {
  it("never lets an unreadable source read as silence", () => {
    const markdown = renderReportMarkdown({
      day: "2026-11-04",
      generatedAt: "2026-11-04T06:00:00Z",
      sources: [
        {
          id: "sp-api-changelog",
          label: "Selling Partner API changelog",
          url: "https://developer-docs.amazon.com/sp-api/changelog.rss",
          status: "unreadable",
          reason: "HTTP 503",
          newItems: [],
          addedLines: [],
        },
      ],
      policyBrief: { checkedOn: "2026-10-07", ageDays: 28, maxAgeDays: 90, overdue: false },
    });
    expect(markdown).toContain("UNREADABLE");
    expect(markdown).toContain("HTTP 503");
    expect(markdown).toContain("28 day(s) old");
  });
});
