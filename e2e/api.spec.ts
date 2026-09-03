import { expect, test } from "@playwright/test";

test.describe("/api routes (auth + validation)", () => {
  test("POST /api/decode rejects empty text with 400", async ({ request }) => {
    const r = await request.post("/api/decode", { data: { text: "" } });
    expect(r.status()).toBe(400);
    const body = await r.json();
    expect(body.error).toBeTruthy();
  });

  test("POST /api/decode rejects non-Amazon text with 422", async ({ request }) => {
    const r = await request.post("/api/decode", {
      data: { text: "This is a recipe for chocolate cake. It contains flour and sugar." },
    });
    expect(r.status()).toBe(422);
  });

  test("POST /api/decode accepts a notice-shaped payload with 200", async ({ request }) => {
    const r = await request.post("/api/decode", {
      data: {
        text: "Hello Amazon Seller, your ASIN B07XYZABC has been deactivated. This is a notice from Account Health. Please respond with a Plan of Action within 7 days as required by Amazon policy.",
      },
    });
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.kind).toBeTruthy();
    expect(Array.isArray(body.deadlines)).toBe(true);
  });

  test("POST /api/analyze-reply requires auth (redirect or 401)", async ({ request }) => {
    const r = await request.post("/api/analyze-reply", {
      data: { reply: 123 },
      maxRedirects: 0,
    });
    expect([302, 303, 307, 401]).toContain(r.status());
  });

  test("POST /api/compose requires auth (redirect or 401)", async ({ request }) => {
    const r = await request.post("/api/compose", {
      data: { caseData: { kind: "POLICY" }, attemptNumber: 1 },
      maxRedirects: 0,
    });
    expect([302, 303, 307, 401]).toContain(r.status());
  });

  test("POST /api/interview requires auth (redirect or 401)", async ({ request }) => {
    const r = await request.post("/api/interview", {
      data: { action: "start", kind: "POLICY" },
      maxRedirects: 0,
    });
    expect([302, 303, 307, 401]).toContain(r.status());
  });
});
