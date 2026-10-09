import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * 9 Oct 2026: an optional second reading for a notice the rules could not place. What matters is
 * when it runs (never for a notice the rules placed, a warning, a scam-signalled message, a
 * falsified-documents allegation, or past a cap), that it fails closed, and that what comes back is
 * a proposal the response carries beside the unchanged decoder result.
 */
const classifyMock = vi.fn();
const gate = vi.hoisted(() => ({ configured: true, allowed: true }));

vi.mock("@/lib/llm/gemini", () => ({ isGeminiConfigured: () => gate.configured }));
vi.mock("@/lib/llm/classifyNotice", () => ({
  classifyNotice: (...args: unknown[]) => classifyMock(...args),
}));
vi.mock("@/lib/ratelimit", () => ({
  rateLimitDecode: () => Promise.resolve({ success: true, limit: 40, remaining: 40, reset: 0 }),
  rateLimitDecodeAi: () => Promise.resolve(gate.allowed),
  tooManyRequestsResponse: () => new Response("rate limited", { status: 429 }),
}));

import { POST } from "../decode/route";

// A real-looking Amazon notice in a family no pattern matches.
const UNPLACED =
  "Subject: Action required on your seller account\n\nHello,\n\nWe noticed activity on your seller account that does not follow our program rules. Please review the details in Seller Central and respond within 7 days with an explanation of the activity.\n\nSeller Performance, Amazon";

async function decode(text: string) {
  const res = await POST(
    new Request("http://localhost:3000/api/decode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }) as unknown as NextRequest,
  );
  return (await res.json()) as Record<string, any>;
}

beforeEach(() => {
  classifyMock.mockReset();
  gate.configured = true;
  gate.allowed = true;
});

describe("/api/decode second reading", () => {
  it("proposes a kind for a notice the rules could not place, and leaves the decoder's own result alone", async () => {
    classifyMock.mockResolvedValue({
      ok: true,
      kind: "POLICY",
      quote: "does not follow our program rules",
    });
    const body = await decode(UNPLACED);
    expect(body.kind).toBe("UNKNOWN");
    expect(body.suggestedKind).toEqual({
      kind: "POLICY",
      quote: "does not follow our program rules",
    });
    expect(body.severityGated).toBe(false);
  });

  it("is not asked when the rules placed the notice", async () => {
    const body = await decode(
      "Subject: Policy violation\n\nWe removed your listings for repeated policy violations. Submit a plan of action within 30 days.",
    );
    expect(body.kind).toBe("POLICY");
    expect(classifyMock).not.toHaveBeenCalled();
    expect(body.suggestedKind).toBeUndefined();
  });

  it("is not asked when the model is off or a cap is reached, and the answer is unchanged", async () => {
    gate.configured = false;
    expect((await decode(UNPLACED)).suggestedKind).toBeUndefined();
    gate.configured = true;
    gate.allowed = false;
    const body = await decode(UNPLACED);
    expect(body.suggestedKind).toBeUndefined();
    expect(body.kind).toBe("UNKNOWN");
    expect(classifyMock).not.toHaveBeenCalled();
  });

  it("is not asked about a message with scam signals or a falsified-documents allegation", async () => {
    await decode(
      `${UNPLACED}\n\nTo release your account you must pay a reinstatement fee in gift cards today.`,
    );
    await decode(
      `${UNPLACED}\n\nWe determined that the documents you submitted were altered or falsified.`,
    );
    expect(classifyMock).not.toHaveBeenCalled();
  });

  it("adds nothing when the second reading finds none or fails", async () => {
    classifyMock.mockResolvedValue({ ok: false, reason: "none" });
    expect((await decode(UNPLACED)).suggestedKind).toBeUndefined();
    classifyMock.mockResolvedValue({ ok: false, reason: "busy" });
    expect((await decode(UNPLACED)).suggestedKind).toBeUndefined();
  });
});
