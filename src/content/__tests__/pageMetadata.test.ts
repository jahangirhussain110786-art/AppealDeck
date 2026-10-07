import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { pageMetadata, SHARE_IMAGE } from "../pageMetadata";

describe("pageMetadata", () => {
  const meta = pageMetadata({ title: "T", description: "D", canonical: "/pricing" });

  it("carries the share image on both the Open Graph and Twitter cards", () => {
    expect(meta.openGraph?.images).toEqual([SHARE_IMAGE]);
    expect(meta.twitter?.images).toEqual([{ url: SHARE_IMAGE.url, alt: SHARE_IMAGE.alt }]);
  });

  it("points at a file that exists and is the same image the home page serves", () => {
    const shared = readFileSync(join(process.cwd(), "public", SHARE_IMAGE.url));
    const fileBased = readFileSync(join(process.cwd(), "src/app/opengraph-image.png"));
    expect(shared.equals(fileBased)).toBe(true);
  });

  it("keeps the page's own canonical, title and url", () => {
    expect(meta.alternates?.canonical).toBe("/pricing");
    expect(meta.title).toBe("T");
    expect(String(meta.openGraph?.url)).toMatch(/\/pricing$/);
  });
});
