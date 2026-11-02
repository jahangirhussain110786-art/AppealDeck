import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { GUIDES } from "../guides";
import { NOTES, NOTES_COMMON, noteBySlug } from "../notes";
import { SCOPE } from "../scope";

describe("notes", () => {
  it("lists the index and every note in the sitemap", () => {
    const paths = sitemap().map((e) => new URL(e.url).pathname);
    expect(paths).toContain("/notes");
    for (const n of NOTES) expect(paths, n.slug).toContain(`/notes/${n.slug}`);
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

  it("keeps every public title and description short enough to show whole in search results", () => {
    const titles = [...NOTES.map((n) => n.metaTitle), NOTES_COMMON.indexMetaTitle];
    for (const t of titles) expect(t.length + 13, t).toBeLessThanOrEqual(60);
    const descriptions = [...NOTES.map((n) => n.description), NOTES_COMMON.indexDescription];
    for (const d of descriptions) expect(d.length, d).toBeLessThanOrEqual(160);
  });
});
