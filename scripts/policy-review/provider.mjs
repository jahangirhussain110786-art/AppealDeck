/**
 * One question, one JSON answer, from whichever company the founder points this job at (4 Nov 2026).
 *
 * Deliberately separate from `src/lib/llm/ai.ts`. That router serves seller text and is tied to
 * `src/content/aiProviders.ts`, which is what the privacy policy names. This job never touches a
 * seller's notice, document or case: it reads pages Amazon publishes to everyone and writes a draft
 * for the founder. Keeping it on its own key means its spend, its quota and its failures cannot
 * affect a seller preparing an appeal, and it can run on a free tier without changing a promise.
 *
 * Configuration (all optional except the key):
 *   POLICY_AI_API_KEY   a key for this job; its own, not the app's GEMINI_API_KEY
 *   POLICY_AI_PROVIDER  groq (default) | gemini | openai | openrouter | cerebras | mistral |
 *                       anthropic | custom
 *   POLICY_AI_MODEL     the model name; a default is pinned for Groq because that was the founder's
 *                       choice on 4 Nov 2026, and required for every other provider
 *   POLICY_AI_BASE_URL  required only for custom
 */

/** The job's default, set by the founder on 4 Nov 2026: the Groq model the app already uses. */
export const DEFAULT_PROVIDER = "groq";
export const DEFAULT_MODEL = "openai/gpt-oss-120b";

const OPENAI_COMPATIBLE = {
  groq: "https://api.groq.com/openai/v1",
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  cerebras: "https://api.cerebras.ai/v1",
  mistral: "https://api.mistral.ai/v1",
};

export function providerConfig(env = process.env) {
  const key = (env.POLICY_AI_API_KEY ?? "").trim();
  if (!key) return null;
  const provider = (env.POLICY_AI_PROVIDER || "").trim().toLowerCase() || DEFAULT_PROVIDER;
  let model = (env.POLICY_AI_MODEL || "").trim();
  if (!model) {
    if (provider !== DEFAULT_PROVIDER) {
      return { error: "POLICY_AI_MODEL is not set; name the model this key may call." };
    }
    model = DEFAULT_MODEL;
  }
  if (provider === "custom" && !env.POLICY_AI_BASE_URL) {
    return { error: "POLICY_AI_PROVIDER=custom needs POLICY_AI_BASE_URL." };
  }
  if (
    provider !== "gemini" &&
    provider !== "anthropic" &&
    provider !== "custom" &&
    !OPENAI_COMPATIBLE[provider]
  ) {
    return { error: `Unknown POLICY_AI_PROVIDER "${provider}".` };
  }
  return { key, provider, model, baseUrl: env.POLICY_AI_BASE_URL?.replace(/\/$/, "") };
}

export function extractJson(text) {
  const body = String(text).trim();
  const fenced = body.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : body;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function geminiCall(config, { system, user, timeoutMs }) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.key)}`,
    {
      method: "POST",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 1400,
          responseMimeType: "application/json",
          // A reasoning budget would spend the output allowance before the answer starts.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    },
  );
  if (!response.ok)
    throw new Error(`Gemini ${response.status}: ${(await response.text()).slice(0, 400)}`);
  const json = await response.json();
  const text = (json.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? "").join("");
  return text;
}

async function openAiCall(config, { system, user, timeoutMs }) {
  const baseUrl = config.baseUrl ?? OPENAI_COMPATIBLE[config.provider];
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    signal: AbortSignal.timeout(timeoutMs),
    headers: { "content-type": "application/json", authorization: `Bearer ${config.key}` },
    body: JSON.stringify({
      model: config.model,
      temperature: 0,
      max_tokens: 1400,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!response.ok)
    throw new Error(
      `${config.provider} ${response.status}: ${(await response.text()).slice(0, 400)}`,
    );
  const json = await response.json();
  return json.choices?.[0]?.message?.content ?? "";
}

async function anthropicCall(config, { system, user, timeoutMs }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      "content-type": "application/json",
      "x-api-key": config.key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1400,
      temperature: 0,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!response.ok)
    throw new Error(`Anthropic ${response.status}: ${(await response.text()).slice(0, 400)}`);
  const json = await response.json();
  return (json.content ?? [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}

/** One attempt, no retry: a failed review is visible in the workflow log, not retried into a bill. */
export async function askModel({ system, user, timeoutMs = 90_000, env = process.env }) {
  const config = providerConfig(env);
  if (!config) return { ok: false, reason: "POLICY_AI_API_KEY is not set" };
  if (config.error) return { ok: false, reason: config.error };

  try {
    const text =
      config.provider === "gemini"
        ? await geminiCall(config, { system, user, timeoutMs })
        : config.provider === "anthropic"
          ? await anthropicCall(config, { system, user, timeoutMs })
          : await openAiCall(config, { system, user, timeoutMs });
    const json = extractJson(text);
    if (!json) {
      return { ok: false, reason: `the answer was not JSON: ${String(text).slice(0, 300)}` };
    }
    return { ok: true, json, provider: config.provider, model: config.model };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}
