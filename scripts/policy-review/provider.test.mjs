import { describe, expect, it } from "vitest";
import { extractJson, providerConfig } from "./provider.mjs";

describe("provider configuration", () => {
  it("is absent without a key, so the watch runs with no AI at all", () => {
    expect(providerConfig({})).toBeNull();
  });

  it("requires a model name for any provider other than the pinned default", () => {
    expect(providerConfig({ POLICY_AI_API_KEY: "k", POLICY_AI_PROVIDER: "openai" }).error).toContain(
      "POLICY_AI_MODEL",
    );
  });

  it("defaults to the founder's Groq model and accepts an explicit provider", () => {
    expect(providerConfig({ POLICY_AI_API_KEY: "k" })).toMatchObject({
      provider: "groq",
      model: "openai/gpt-oss-120b",
    });
    expect(
      providerConfig({ POLICY_AI_API_KEY: "k", POLICY_AI_MODEL: "m", POLICY_AI_PROVIDER: "Gemini" }),
    ).toMatchObject({ provider: "gemini", model: "m" });
  });

  it("needs a base URL only for a custom provider", () => {
    expect(
      providerConfig({ POLICY_AI_API_KEY: "k", POLICY_AI_MODEL: "m", POLICY_AI_PROVIDER: "custom" })
        .error,
    ).toContain("POLICY_AI_BASE_URL");
    expect(
      providerConfig({
        POLICY_AI_API_KEY: "k",
        POLICY_AI_MODEL: "m",
        POLICY_AI_PROVIDER: "custom",
        POLICY_AI_BASE_URL: "https://example.com/v1/",
      }).baseUrl,
    ).toBe("https://example.com/v1");
  });

  it("refuses a provider it cannot call", () => {
    expect(
      providerConfig({
        POLICY_AI_API_KEY: "k",
        POLICY_AI_MODEL: "m",
        POLICY_AI_PROVIDER: "mystery",
      }).error,
    ).toContain("Unknown POLICY_AI_PROVIDER");
  });
});

describe("answer parsing", () => {
  it("reads a bare JSON object", () => {
    expect(extractJson('{"relevant":true}')).toEqual({ relevant: true });
  });

  it("reads a fenced JSON block", () => {
    expect(extractJson('Here it is:\n```json\n{"relevant":false}\n```\n')).toEqual({
      relevant: false,
    });
  });

  it("returns null rather than guessing at prose", () => {
    expect(extractJson("I think this is relevant.")).toBeNull();
    expect(extractJson('{"relevant": tru')).toBeNull();
  });
});
