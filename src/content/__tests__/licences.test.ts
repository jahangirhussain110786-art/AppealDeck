import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LICENCES } from "@/content/licences";

const ROOT = process.cwd();
const read = (file: string) => readFileSync(path.join(ROOT, file), "utf8");

const LISTED = LICENCES.groups.flatMap((group) => group.packages.map((pkg) => pkg.name));
const DEPS = Object.keys(
  (JSON.parse(read("package.json")) as { dependencies?: Record<string, string> }).dependencies ??
    {},
);

describe("licences", () => {
  // The obligation the page exists for: every package that ships has its notice carried along. A new
  // dependency that nobody attributes fails here rather than going unnoticed.
  it("names every runtime dependency", () => {
    for (const dep of DEPS) {
      expect(LISTED, `${dep} ships but is not attributed`).toContain(dep);
    }
  });

  it("attributes nothing we do not ship", () => {
    for (const name of LISTED) {
      // The Feather-derived icons travel inside lucide-react (ISC + MIT, named in its own licence).
      if (name === "Feather icons") continue;
      expect(DEPS, `${name} is attributed but is not a dependency`).toContain(name);
    }
  });

  it("serves the full text of each licence it names, at the path it links to", () => {
    const titles = { mit: "MIT License", isc: "ISC License", apache: "Apache License" };
    for (const group of LICENCES.groups) {
      const file = path.join(ROOT, "public", group.href);
      expect(existsSync(file), `${group.href} is missing`).toBe(true);
      expect(readFileSync(file, "utf8"), group.href).toContain(titles[group.id]);
    }
  });

  it("describes nothing beyond the notice", () => {
    expect(read("src/content/licences.ts")).not.toMatch(/\brole\s*:/);
  });

  it("is reachable from the footer", () => {
    expect(read("src/components/SiteFooter.tsx")).toContain('href: "/licences"');
  });
});
