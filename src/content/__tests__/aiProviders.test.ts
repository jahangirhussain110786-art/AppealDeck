import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  AI_PROVIDERS,
  isProviderListed,
  listedCompanyNames,
  listedProviderNames,
  listedProviders,
} from "../aiProviders";
import { LEGAL } from "../legal";
import { __test as ai } from "@/lib/llm/ai";

/**
 * 27 Oct 2026. The site says "AI", not a company; the privacy policy names the companies, from one
 * list; and the code refuses to call a company that list does not carry. These tests keep those
 * three things from drifting apart.
 */
const privacy = LEGAL.privacy.sections.flatMap((section) => section.body).join("\n");

const ROOT = process.cwd();
function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "__tests__" || entry === "api") continue;
      sourceFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\./.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe("the provider list", () => {
  it("covers exactly the providers the code can call", () => {
    expect(AI_PROVIDERS.map((p) => p.id).sort()).toEqual(Object.keys(ai.PROVIDERS).sort());
  });

  it("names every listed provider in the privacy policy, and no unlisted one", () => {
    for (const provider of AI_PROVIDERS) {
      if (provider.listed) {
        expect(privacy, `${provider.name} is listed but missing from the policy`).toContain(
          provider.name,
        );
      } else {
        expect(privacy, `${provider.name} is not listed yet the policy names it`).not.toContain(
          provider.name,
        );
      }
    }
  });

  it("states what each listed provider says about keeping requests, from the date it was read", () => {
    for (const provider of listedProviders()) {
      if (!provider.dataTerms) continue;
      expect(provider.verifiedOn, `${provider.name} has terms but no date`).toMatch(
        /^\d{4}-\d{2}-\d{2}$/,
      );
      expect(privacy).toContain(
        `What ${provider.company} does with what we send: ${provider.dataTerms}.`,
      );
    }
  });

  it("keeps a date on every provider that has terms, and keeps Claude and OpenAI unlisted until read", () => {
    for (const provider of AI_PROVIDERS) {
      if (provider.listed || provider.dataTerms === null) continue;
      expect(provider.verifiedOn, `${provider.name} has terms but no date`).not.toBeNull();
    }
    // Claude and OpenAI are built but not listed: they cannot run in production yet.
    expect(isProviderListed("anthropic")).toBe(false);
    expect(isProviderListed("openai")).toBe(false);
  });

  it("builds the names the policy uses from the list", () => {
    expect(listedProviderNames()).toBe("Google Gemini and Groq");
    expect(listedCompanyNames()).toBe("Google and Groq");
    expect(privacy).toMatch(/Google Gemini and Groq \(the AI steps described under How we use it;/);
  });
});

describe("the rest of the site says AI, not a company", () => {
  const allowed = new Set(["legal.ts", "aiProviders.ts"]);
  const files = [
    ...sourceFiles(path.join(ROOT, "src", "content")),
    ...sourceFiles(path.join(ROOT, "src", "components")),
    ...sourceFiles(path.join(ROOT, "src", "app")),
  ].filter((file) => !allowed.has(path.basename(file)));

  it("scans a real set of files", () => {
    expect(files.length).toBeGreaterThan(40);
  });

  it("names no AI provider in anything a seller reads, outside the privacy policy", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const body = readFileSync(file, "utf8");
      // Comments explain history to developers; only code and copy reach a seller.
      const withoutComments = body.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      for (const name of ["Gemini", "Groq", "Anthropic", "OpenAI"]) {
        if (withoutComments.includes(name)) offenders.push(`${path.relative(ROOT, file)}: ${name}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
