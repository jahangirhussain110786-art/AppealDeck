import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __test, callOpenAi, isOpenAiConfigured } from "../openai";

/**
 * 27 Oct 2026. The OpenAI adapter is built from the published chat-completions format and run here
 * against a stand-in server; it has not been run live from this repository.
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

const ok = (content: string) =>
  Response.json({
    choices: [{ finish_reason: "stop", message: { content } }],
    usage: { prompt_tokens: 9, completion_tokens: 4 },
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
  vi.stubEnv("OPENAI_API_KEY", "sk-test");
  vi.stubEnv("OPENAI_MODEL", "test-model");
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
  it("needs a key and a model: there is no default model to go stale", () => {
    expect(isOpenAiConfigured()).toBe(true);
    vi.stubEnv("OPENAI_MODEL", "");
    expect(isOpenAiConfigured()).toBe(false);
  });

  it("needs the data-terms switch in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isOpenAiConfigured()).toBe(false);
    vi.stubEnv("OPENAI_PRODUCTION_CONFIRMED", "true");
    expect(isOpenAiConfigured()).toBe(true);
  });

  it("refuses without calling anyone when it is not configured", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    serve(() => ok("never"));
    expect(await callOpenAi(input)).toMatchObject({ ok: false, reason: "not_configured" });
    expect(requests).toHaveLength(0);
  });
});

describe("the request", () => {
  it("sends a bearer key, the model and the messages in chat-completions shape", async () => {
    serve(() => ok("done"));
    await callOpenAi(input);
    const [req] = requests;
    expect(req!.url).toBe("https://api.openai.com/v1/chat/completions");
    expect(req!.headers.Authorization).toBe("Bearer sk-test");
    expect(req!.body.model).toBe("test-model");
    expect(req!.body.messages).toEqual([
      { role: "system", content: "You write plainly." },
      { role: "user", content: "Write it." },
    ]);
  });

  it("asks for a JSON object and writes the schema into the instructions", async () => {
    serve(() => ok('{"a":1}'));
    await callOpenAi({ ...input, responseJsonSchema: { type: "object" } });
    expect(requests[0]!.body.response_format).toEqual({ type: "json_object" });
    expect(requests[0]!.body.messages[0].role).toBe("system");
    expect(requests[0]!.body.messages[0].content).toContain('"type":"object"');
  });

  it("sends a PDF as a file and a photo as an image", () => {
    const built = __test.buildMessages({
      messages: [
        {
          role: "user",
          text: "What does it show?",
          documents: [
            { mimeType: "application/pdf", data: "UERG" },
            { mimeType: "image/jpeg", data: "SU1H" },
          ],
        },
      ],
    });
    expect(built.ok && built.messages[0]!.content).toEqual([
      { type: "text", text: "What does it show?" },
      {
        type: "file",
        file: { filename: "document.pdf", file_data: "data:application/pdf;base64,UERG" },
      },
      { type: "image_url", image_url: { url: "data:image/jpeg;base64,SU1H" } },
    ]);
  });

  it("refuses a file type it cannot read", () => {
    const built = __test.buildMessages({
      messages: [
        { role: "user", text: "x", documents: [{ mimeType: "application/zip", data: "Wg==" }] },
      ],
    });
    expect(built.ok).toBe(false);
  });

  it("uses the task's model when one is named, and a fallback model when it is", async () => {
    vi.stubEnv("OPENAI_MODEL_DRAFT_POA", "poa-model");
    vi.stubEnv("OPENAI_FALLBACK_MODEL", "second-model");
    serve(() => new Response("busy", { status: 429 }));
    await callOpenAi(input);
    expect(new Set(requests.map((r) => r.body.model))).toEqual(
      new Set(["poa-model", "second-model"]),
    );
  });
});

describe("the answer and its failures", () => {
  it("returns the text and the model that answered", async () => {
    serve(() => ok("  Hello  "));
    expect(await callOpenAi(input)).toEqual({
      ok: true,
      text: "Hello",
      model: "openai:test-model",
      usage: { inputTokens: 9, outputTokens: 4 },
    });
  });

  it("does not return an answer that was cut off", async () => {
    serve(() =>
      Response.json({ choices: [{ finish_reason: "length", message: { content: "half" } }] }),
    );
    expect(await callOpenAi(input)).toMatchObject({ ok: false, reason: "invalid_response" });
  });

  it("words a refused key as 'OpenAI returned 401', which the chain reads as a configuration problem", async () => {
    serve(() => new Response("Incorrect API key", { status: 401 }));
    const result = await callOpenAi(input);
    expect(result).toMatchObject({ ok: false, reason: "bad_input" });
    expect(!result.ok && result.message).toMatch(/^OpenAI returned 401:/);
    expect(requests).toHaveLength(1);
  });

  it("retries a 'not now' answer once", async () => {
    serve(
      () => new Response("slow down", { status: 429 }),
      () => ok("second time"),
    );
    expect(await callOpenAi(input)).toMatchObject({ ok: true, text: "second time" });
    expect(requests).toHaveLength(2);
  });

  it("stops asking when the day's allowance is used up", async () => {
    budget.reserve.mockResolvedValue({ ok: false });
    serve(() => ok("never"));
    expect(await callOpenAi(input)).toMatchObject({ ok: false, reason: "spend_cap" });
    expect(requests).toHaveLength(0);
  });
});
