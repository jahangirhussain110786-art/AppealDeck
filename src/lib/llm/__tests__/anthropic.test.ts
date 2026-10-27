import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __test, callAnthropic, isAnthropicConfigured } from "../anthropic";

/**
 * 27 Oct 2026. The Claude adapter is built from Anthropic's published Messages API format and run
 * here against a stand-in server; it has not been run live from this repository. These tests pin
 * the request it sends and how it reads each kind of answer.
 */
const budget = vi.hoisted(() => ({ reserve: vi.fn() }));
vi.mock("@/lib/breaker", async (original) => ({
  ...(await original<typeof import("@/lib/breaker")>()),
  reserveSpend: budget.reserve,
}));
vi.mock("../providerSupport", async (original) => ({
  ...(await original<typeof import("../providerSupport")>()),
  sleep: async () => {},
}));

const ok = (text: string, extra: Record<string, unknown> = {}) =>
  Response.json({
    content: [{ type: "text", text }],
    stop_reason: "end_turn",
    usage: { input_tokens: 11, output_tokens: 5 },
    ...extra,
  });

let requests: { url: string; headers: Record<string, string>; body: any }[];
function serve(...answers: Array<() => Response>) {
  requests = [];
  let n = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      requests.push({
        url,
        headers: init.headers as Record<string, string>,
        body: JSON.parse(String(init.body)),
      });
      const answer = answers[Math.min(n, answers.length - 1)]!;
      n += 1;
      return answer();
    }),
  );
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test");
  budget.reserve.mockReset().mockResolvedValue({ ok: true });
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const input = {
  task: "draft-poa" as const,
  messages: [
    { role: "system" as const, text: "You write plainly." },
    { role: "user" as const, text: "Write it." },
  ],
};

describe("configuration", () => {
  it("needs a key, and in production the data-terms switch", () => {
    expect(isAnthropicConfigured()).toBe(true);
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(isAnthropicConfigured()).toBe(false);
    vi.stubEnv("ANTHROPIC_API_KEY", "k");
    vi.stubEnv("NODE_ENV", "production");
    expect(isAnthropicConfigured()).toBe(false);
    vi.stubEnv("ANTHROPIC_PRODUCTION_CONFIRMED", "true");
    expect(isAnthropicConfigured()).toBe(true);
  });

  it("refuses without calling anyone when it is not configured", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    serve(() => ok("never"));
    expect(await callAnthropic(input)).toMatchObject({ ok: false, reason: "not_configured" });
    expect(requests).toHaveLength(0);
  });
});

describe("the request", () => {
  it("sends the key, the API version, the system text and the messages in Anthropic's shape", async () => {
    serve(() => ok("done"));
    await callAnthropic({
      ...input,
      messages: [...input.messages, { role: "model", text: "Earlier answer" }],
    });
    const [req] = requests;
    expect(req!.url).toBe("https://api.anthropic.com/v1/messages");
    expect(req!.headers["x-api-key"]).toBe("sk-ant-test");
    expect(req!.headers["anthropic-version"]).toBe("2023-06-01");
    expect(req!.body.system).toBe("You write plainly.");
    expect(req!.body.max_tokens).toBe(512);
    expect(req!.body.messages).toEqual([
      { role: "user", content: [{ type: "text", text: "Write it." }] },
      { role: "assistant", content: [{ type: "text", text: "Earlier answer" }] },
    ]);
  });

  it("puts a document before the question, and reads a PDF as a document and a photo as an image", () => {
    const built = __test.buildBody(
      {
        messages: [
          {
            role: "user",
            text: "What does it show?",
            documents: [
              { mimeType: "application/pdf", data: "UERG" },
              { mimeType: "image/png", data: "SU1H" },
            ],
          },
        ],
      },
      "m",
    );
    expect(built.ok && (built.body.messages as any[])[0].content).toEqual([
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: "UERG" } },
      { type: "image", source: { type: "base64", media_type: "image/png", data: "SU1H" } },
      { type: "text", text: "What does it show?" },
    ]);
  });

  it("refuses a file type Claude cannot read instead of sending it", () => {
    const built = __test.buildBody(
      {
        messages: [
          { role: "user", text: "x", documents: [{ mimeType: "application/zip", data: "Wg==" }] },
        ],
      },
      "m",
    );
    expect(built.ok).toBe(false);
  });

  it("writes the JSON schema into the instructions, because the callers validate what comes back", async () => {
    serve(() => ok('{"a":1}'));
    await callAnthropic({ ...input, responseJsonSchema: { type: "object" } });
    expect(requests[0]!.body.system).toContain("You write plainly.");
    expect(requests[0]!.body.system).toContain('"type":"object"');
    expect(requests[0]!.body.system).toMatch(/single JSON object/);
  });

  it("uses the model named for the task, then the general one, then its default", async () => {
    serve(() => ok("x"));
    await callAnthropic(input);
    expect(requests[0]!.body.model).toBe("claude-sonnet-5-5");
    vi.stubEnv("ANTHROPIC_MODEL", "general-model");
    await callAnthropic(input);
    expect(requests[1]!.body.model).toBe("general-model");
    vi.stubEnv("ANTHROPIC_MODEL_DRAFT_POA", "poa-model");
    await callAnthropic(input);
    expect(requests[2]!.body.model).toBe("poa-model");
  });
});

describe("the answer", () => {
  it("returns the text, the model that answered and the token counts", async () => {
    serve(() => ok("  Hello  "));
    expect(await callAnthropic(input)).toEqual({
      ok: true,
      text: "Hello",
      model: "anthropic:claude-sonnet-5-5",
      usage: { inputTokens: 11, outputTokens: 5 },
    });
  });

  it("does not return an answer that was cut off", async () => {
    serve(() => ok('{"half":', { stop_reason: "max_tokens" }));
    expect(await callAnthropic(input)).toMatchObject({ ok: false, reason: "invalid_response" });
  });

  it("does not return an empty answer", async () => {
    serve(() => Response.json({ content: [], stop_reason: "end_turn" }));
    expect(await callAnthropic(input)).toMatchObject({ ok: false, reason: "invalid_response" });
  });
});

describe("when it goes wrong", () => {
  it("tells a refused request from an outage: a 400 is the request's fault and is not retried", async () => {
    serve(() => new Response('{"error":"bad"}', { status: 400 }));
    const result = await callAnthropic(input);
    expect(result).toMatchObject({ ok: false, reason: "bad_input" });
    expect(requests).toHaveLength(1);
  });

  it("words a refused key as 'Claude returned 401', which the chain reads as a configuration problem", async () => {
    serve(() => new Response("invalid x-api-key", { status: 401 }));
    const result = await callAnthropic(input);
    expect(!result.ok && result.message).toMatch(/^Claude returned 401:/);
  });

  it("retries a 'not now' answer once and then returns the second answer", async () => {
    serve(
      () => new Response("overloaded", { status: 529 }),
      () => ok("second time"),
    );
    expect(await callAnthropic(input)).toMatchObject({ ok: true, text: "second time" });
    expect(requests).toHaveLength(2);
    expect(requests[1]!.body.model).toBe(requests[0]!.body.model);
  });

  it("asks the second model when the first stays busy, and reports busy when both do", async () => {
    serve(() => new Response("busy", { status: 429 }));
    const result = await callAnthropic(input);
    expect(result).toMatchObject({ ok: false, reason: "busy" });
    expect(new Set(requests.map((r) => r.body.model)).size).toBe(2);
  });

  it("stops asking when the day's allowance is used up", async () => {
    budget.reserve.mockResolvedValue({ ok: false });
    serve(() => ok("never"));
    expect(await callAnthropic(input)).toMatchObject({ ok: false, reason: "spend_cap" });
    expect(requests).toHaveLength(0);
  });

  it("starts nothing with no time left", async () => {
    serve(() => ok("never"));
    const result = await callAnthropic({ ...input, deadline: Date.now() + 100 });
    expect(result).toMatchObject({ ok: false, reason: "timeout" });
    expect(requests).toHaveLength(0);
  });
});
