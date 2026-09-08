import { expect, test } from "@playwright/test";

test.describe("App gate — unauthenticated pages and APIs", () => {
  test("unauthenticated /dashboard redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated /case redirects to /login", async ({ page }) => {
    await page.goto("/case");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated /compose redirects to /login", async ({ page }) => {
    await page.goto("/compose");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated /vault redirects to /login", async ({ page }) => {
    await page.goto("/vault");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated /billing redirects to /login", async ({ page }) => {
    await page.goto("/billing");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("POST /api/interview requires auth (401 JSON)", async ({ request }) => {
    const r = await request.post("/api/interview", {
      data: { action: "start", kind: "POLICY" },
      maxRedirects: 0,
    });
    expect(r.status()).toBe(401);
    expect((await r.json()).error).toBe("Unauthorized");
  });

  test("POST /api/extract-field requires auth (401 JSON)", async ({ request }) => {
    const r = await request.post("/api/extract-field", {
      data: { text: "any text" },
      maxRedirects: 0,
    });
    expect(r.status()).toBe(401);
    expect((await r.json()).error).toBe("Unauthorized");
  });

  test("POST /api/compose requires auth (401 JSON)", async ({ request }) => {
    const r = await request.post("/api/compose", {
      data: { caseData: { kind: "POLICY" }, attemptNumber: 1 },
      maxRedirects: 0,
    });
    expect(r.status()).toBe(401);
    expect((await r.json()).error).toBe("Unauthorized");
  });

  test("POST /api/analyze-reply requires auth (401 JSON)", async ({ request }) => {
    const r = await request.post("/api/analyze-reply", {
      data: { reply: 123 },
      maxRedirects: 0,
    });
    expect(r.status()).toBe(401);
    expect((await r.json()).error).toBe("Unauthorized");
  });

  test("GET /api/devices requires auth (401 JSON)", async ({ request }) => {
    const r = await request.get("/api/devices", { maxRedirects: 0 });
    expect(r.status()).toBe(401);
    expect((await r.json()).error).toBe("Unauthorized");
  });

  test("DELETE /api/devices requires auth (401 JSON)", async ({ request }) => {
    const r = await request.delete("/api/devices", {
      data: { deviceId: "x" },
      maxRedirects: 0,
    });
    expect(r.status()).toBe(401);
    expect((await r.json()).error).toBe("Unauthorized");
  });
});
