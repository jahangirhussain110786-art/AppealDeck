import { afterEach, describe, expect, it, vi } from "vitest";
import { callGemini } from "../gemini";
import { classifyNotice } from "../classifyNotice";
import { draftResponse, type DraftRequest } from "../draftResponse";
import { runWithDevUsage } from "@/lib/devUsage";

const live = process.env.GROQ_LIVE_TEST === "1";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe.skipIf(!live)("Groq fallback with synthetic data (live)", () => {
  it("classifies notices and prepares a fact-checked draft after a Gemini quota failure", async () => {
    process.loadEnvFile(".env.local");
    vi.stubEnv("GEMINI_API_KEY", "synthetic-quota-test");
    vi.stubEnv("DEV_UNLIMITED_USAGE", "true");
    vi.stubEnv("DEV_LOGIN_EMAIL", "dev@example.test");
    const realFetch = globalThis.fetch;
    let groqCalls = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      if (String(url).startsWith("https://generativelanguage.googleapis.com/")) {
        return new Response("exceeded your current quota", { status: 429 });
      }
      expect(String(url)).toBe("https://api.groq.com/openai/v1/chat/completions");
      groqCalls++;
      return realFetch(url, init);
    });
    const request: DraftRequest = {
      kind: "POLICY",
      notice:
        "We removed ASIN B09XK3J7QP because customers received used items sold as new. Submit a plan of action.",
      attempt: 1,
      answers: {
        rootCause:
          "Customer returns went back into our new-condition stock without anyone opening the packaging. Four customers received opened items between 12 and 28 September.",
        correctiveActions:
          "On 30 September we removed all 12 affected listings and relisted the returned units as Used - Like New.",
        preventiveMeasures:
          "Our warehouse lead opens and inspects every return before it can go back on sale and records the result in a returns log.",
      },
      records: [{ label: "Sales or performance record", filename: "returns-log-september.pdf" }],
      declined: [],
      replyReasons: [],
    };
    await runWithDevUsage({ id: "synthetic-dev", email: "dev@example.test" }, async () => {
      const card = await classifyNotice(
        "Your payment card could not be charged. Please update your charge method in Seller Central to pay your outstanding balance.",
      );
      expect(card).toEqual({ ok: false, reason: "none" });
      const related = await classifyNotice(
        "We found that you were operating multiple accounts without a business need. Your selling account has been deactivated.",
      );
      expect(related).toMatchObject({ ok: true, kind: "RELATED_ACCOUNT" });
      const result = await draftResponse(request);
      expect(result.ok, JSON.stringify(result)).toBe(true);
      const direct = await callGemini({
        messages: [{ role: "user", text: "Reply with the single word ready." }],
        maxOutputTokens: 20,
      });
      expect(direct).toMatchObject({ ok: true, model: "groq:openai/gpt-oss-120b" });
    });
    expect(groqCalls).toBeGreaterThanOrEqual(4);
  }, 60_000);
});
