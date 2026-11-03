import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { GUIDES } from "../guides";
import { NOTES, NOTES_COMMON, noteBySlug } from "../notes";
import { SCOPE } from "../scope";
import { readingMinutes } from "@/lib/readingTime";

describe("notes", () => {
  it("lists every note in the sitemap, under the playbook", () => {
    const paths = sitemap().map((e) => new URL(e.url).pathname);
    for (const n of NOTES) expect(paths, n.slug).toContain(`/playbook/notes/${n.slug}`);
    // The old standalone paths are gone; next.config.mjs redirects them to the hub.
    expect(paths).not.toContain("/notes");
    for (const n of NOTES) expect(paths).not.toContain(`/notes/${n.slug}`);
  });

  // Found on 3 Nov 2026: the route lives under /playbook/notes but its canonical still pointed at
  // /notes/<slug>, which only redirects. A canonical that names a redirect is a search-engine bug,
  // and nothing in the suite could see it. This reads the route file, since a metadata call needs
  // Next's request context.
  it("points each note's canonical at the URL that actually serves the page", () => {
    const route = readFileSync(
      join(process.cwd(), "src", "app", "playbook", "notes", "[slug]", "page.tsx"),
      "utf8",
    );
    expect(route).toMatch(/canonical:\s*`\/playbook\/notes\/\$\{note\.slug\}`/);
    expect(route).not.toMatch(/canonical:\s*`\/notes\//);
  });

  it("dates every note with a real calendar day and never dates it backwards", () => {
    for (const n of NOTES) {
      expect(n.published, n.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(n.updated, n.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(n.published)), n.slug).toBe(false);
      expect(Number.isNaN(Date.parse(n.updated)), n.slug).toBe(false);
      expect(n.updated >= n.published, n.slug).toBe(true);
    }
  });

  it("keeps slugs and titles unique", () => {
    expect(new Set(NOTES.map((n) => n.slug)).size).toBe(NOTES.length);
    expect(new Set(NOTES.map((n) => n.title)).size).toBe(NOTES.length);
  });

  it("resolves every related note and guide", () => {
    for (const n of NOTES) {
      for (const slug of n.relatedNotes ?? [])
        expect(noteBySlug(slug), `${n.slug} -> ${slug}`).toBeDefined();
      for (const slug of n.relatedGuides ?? [])
        expect(
          GUIDES.find((g) => g.slug === slug),
          `${n.slug} -> ${slug}`,
        ).toBeDefined();
    }
  });

  it("gives each note a shape worth reading: an intro, sections and one line to remember", () => {
    for (const n of NOTES) {
      expect(n.intro.length, n.slug).toBeGreaterThan(40);
      expect(n.sections.length, n.slug).toBeGreaterThanOrEqual(3);
      expect(n.takeaway.length, n.slug).toBeGreaterThan(20);
      for (const s of n.sections)
        expect(Boolean(s.body) || Boolean(s.points?.length), `${n.slug}: ${s.heading}`).toBe(true);
    }
  });

  // The hub prints "N min read" beside each row, so the estimate has to stay short: a note that
  // reaches guide length has outgrown its format.
  it("stays a short read on the hub's own estimate", () => {
    for (const n of NOTES) expect(readingMinutes(n), n.slug).toBeLessThanOrEqual(4);
  });

  it("carries the note scope notice", () => {
    expect(NOTES_COMMON.disclaimer).toBe(SCOPE.note);
    expect(NOTES_COMMON.disclaimer).toMatch(/not legal advice/);
    expect(NOTES_COMMON.disclaimer).toMatch(/not affiliated with Amazon/);
  });

  // Same rule as the guides: no outcome promises, no rate, no percentage, no claim about AI.
  it("promises no outcome and quotes no rate", () => {
    const text = JSON.stringify(NOTES);
    expect(text).not.toMatch(/guarantee|success rate|win rate|reinstatement rate|%/i);
    expect(text).not.toMatch(/will be (approved|reinstated)|undetectable/i);
    expect(text).not.toMatch(/amazon (detects|rejects|flags)/i);
  });

  it("keeps every note title and description short enough to show whole in search results", () => {
    for (const n of NOTES) expect(n.metaTitle.length + 13, n.metaTitle).toBeLessThanOrEqual(60);
    for (const n of NOTES) expect(n.description.length, n.description).toBeLessThanOrEqual(160);
  });
});
