import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callLlm, isAiConfigured, providerChain, providerOrder } from "../ai";
import { AI_PROVIDERS, isProviderListed } from "@/content/aiProviders";

/**
 * 27 Oct 2026: the app asks for "an AI answer"; this file says which company's model gives it. The
 * ordering, the skipping of a provider that cannot take the request, the hand-over when one fails,
 * and the rule that a provider the privacy policy does not name never runs in production.
 */
const budget = vi.hoisted(() => ({ reserve: vi.fn() }));
vi.mock("@/lib/breaker", async (original) => ({
  ...(await original<typeof import("@/lib/breaker")>()),
  reserveSpend: budget.reserve,
}));

// The adapters wait 1.5 s before a retry; the tests do not need to.
vi.mock("../providerSupport", async (original) => ({
  ...(await original<typeof import("../providerSupport")>()),
  sleep: async () => {},
}));

const text = (value: string) => ({
  messages: [{ role: "user" as const, text: value }],
  task: "classify-notice" as const,
});
const withDocument = {
  task: "read-document" as const,
  messages: [
    {
      role: "user" as const,
      text: "Read this",
      documents: [{ mimeType: "application/pdf", data: "AAAA" }],
    },
  ],
};

const geminiOk = (answer: string) =>
  Response.json({ candidates: [{ content: { parts: [{ text: answer }] } }] });
const claudeOk = (answer: string) =>
  Response.json({
    content: [{ type: "text", text: answer }],
    stop_reason: "end_turn",
    usage: { input_tokens: 3, output_tokens: 2 },
  });
const groqOk = (answer: string) =>
  Response.json({ choices: [{ finish_reason: "stop", message: { content: answer } }] });

function route(handlers: {
  gemini?: () => Response;
  claude?: () => Response;
  groq?: () => Response;
}) {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.includes("generativelanguage")) {
        calls.push("gemini");
        return (handlers.gemini ?? (() => new Response("", { status: 500 })))();
      }
      if (url.includes("anthropic.com")) {
        calls.push("claude");
        return (handlers.claude ?? (() => new Response("", { status: 500 })))();
      }
      calls.push("groq");
      return (handlers.groq ?? (() => new Response("", { status: 500 })))();
    }),
  );
  return calls;
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("GEMINI_API_KEY", "g-test");
  vi.stubEnv("GROQ_API_KEY", "q-test");
  vi.stubEnv("ANTHROPIC_API_KEY", "a-test");
  vi.stubEnv("AI_PROVIDERS", "");
  budget.reserve.mockReset().mockResolvedValue({ ok: true });
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("which providers are asked, and in what order", () => {
  it("defaults to Gemini then Groq, exactly as before the provider layer", () => {
    expect(providerOrder()).toEqual(["gemini", "groq"]);
  });

  it("follows AI_PROVIDERS, ignoring unknown names and repeats", () => {
    vi.stubEnv("AI_PROVIDERS", " Anthropic, gemini,nonsense,anthropic ");
    expect(providerOrder()).toEqual(["anthropic", "gemini"]);
  });

  it("falls back to the default when AI_PROVIDERS names nothing real", () => {
    vi.stubEnv("AI_PROVIDERS", "nonsense");
    expect(providerOrder()).toEqual(["gemini", "groq"]);
  });

  it("leaves out a provider that is not configured", () => {
    vi.stubEnv("AI_PROVIDERS", "anthropic,gemini,groq");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(providerChain(text("x")).map((p) => p.id)).toEqual(["gemini", "groq"]);
  });

  it("never gives a document to a text-only provider", () => {
    vi.stubEnv("AI_PROVIDERS", "gemini,groq");
    expect(providerChain(withDocument).map((p) => p.id)).toEqual(["gemini"]);
  });

  it("is configured when any one provider is", () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GROQ_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(isAiConfigured()).toBe(false);
    vi.stubEnv("AI_PROVIDERS", "anthropic");
    vi.stubEnv("ANTHROPIC_API_KEY", "a-test");
    expect(isAiConfigured()).toBe(true);
  });
});

describe("in production a provider the policy does not name never runs", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GEMINI_PAID_TIER_CONFIRMED", "true");
    vi.stubEnv("GROQ_PRODUCTION_CONFIRMED", "true");
    vi.stubEnv("ANTHROPIC_PRODUCTION_CONFIRMED", "true");
    vi.stubEnv("AI_PROVIDERS", "anthropic,gemini,groq");
  });

  it("skips Claude while it is not listed, even with its key and its switch on", () => {
    expect(isProviderListed("anthropic")).toBe(false);
    expect(providerChain(text("x")).map((p) => p.id)).toEqual(["gemini", "groq"]);
  });

  it("lists exactly the providers that can run", () => {
    expect(
      AI_PROVIDERS.filter((p) => p.listed)
        .map((p) => p.id)
        .sort(),
    ).toEqual(["gemini", "groq"]);
  });

  it("still keeps a provider off until its own switch is on", () => {
    vi.stubEnv("GROQ_PRODUCTION_CONFIRMED", "");
    expect(providerChain(text("x")).map((p) => p.id)).toEqual(["gemini"]);
  });
});

describe("asking the chain", () => {
  it("asks the first provider and stops when it answers", async () => {
    vi.stubEnv("AI_PROVIDERS", "anthropic,gemini");
    const calls = route({
      claude: () => claudeOk('{"kind":"NONE"}'),
      gemini: () => geminiOk("no"),
    });
    const result = await callLlm(text("notice"));
    expect(result).toMatchObject({ ok: true, text: '{"kind":"NONE"}' });
    expect(result.ok && result.model).toMatch(/^anthropic:/);
    expect(calls).toEqual(["claude"]);
  });

  it("hands over to the next provider when the first is down", async () => {
    vi.stubEnv("AI_PROVIDERS", "anthropic,gemini");
    vi.stubEnv("ANTHROPIC_FALLBACK_MODEL", "none");
    const calls = route({
      claude: () => new Response("overloaded", { status: 529 }),
      gemini: () => geminiOk("from gemini"),
    });
    const result = await callLlm(text("notice"));
    expect(result).toMatchObject({ ok: true, text: "from gemini" });
    expect(calls[0]).toBe("claude");
    expect(calls).toContain("gemini");
  });

  it("hands over when the first provider's key is refused, which is not the seller's fault", async () => {
    vi.stubEnv("AI_PROVIDERS", "anthropic,groq");
    const calls = route({
      claude: () => new Response('{"error":"invalid x-api-key"}', { status: 401 }),
      groq: () => groqOk("from groq"),
    });
    const result = await callLlm(text("notice"));
    expect(result).toMatchObject({ ok: true, text: "from groq" });
    expect(calls).toEqual(["claude", "groq"]);
  });

  it("does not shop a refused request around: a malformed request would be refused everywhere", async () => {
    vi.stubEnv("AI_PROVIDERS", "anthropic,groq");
    const calls = route({
      claude: () => new Response('{"error":"messages: bad"}', { status: 400 }),
      groq: () => groqOk("never"),
    });
    const result = await callLlm(text("notice"));
    expect(result).toMatchObject({ ok: false, reason: "bad_input" });
    expect(calls).toEqual(["claude"]);
  });

  it("answers 'not configured' in the first provider's own words when nothing is set", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GROQ_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const result = await callLlm(text("notice"));
    expect(result).toMatchObject({ ok: false, reason: "not_configured" });
    expect(!result.ok && result.message).toMatch(/GEMINI_API_KEY/);
  });

  it("asks no further provider once the caller's budget is spent", async () => {
    vi.stubEnv("AI_PROVIDERS", "anthropic,groq");
    vi.stubEnv("ANTHROPIC_FALLBACK_MODEL", "none");
    const base = Date.now();
    let clock = base;
    vi.spyOn(Date, "now").mockImplementation(() => clock);
    const calls = route({
      // The first provider fails slowly: by the time it answers, the caller has given up.
      claude: () => {
        clock += 5_000;
        return new Response("busy", { status: 529 });
      },
      groq: () => groqOk("late"),
    });
    const result = await callLlm({ ...text("notice"), deadline: base + 1_500 });
    expect(result.ok).toBe(false);
    expect(calls).toEqual(["claude"]);
  });
});
