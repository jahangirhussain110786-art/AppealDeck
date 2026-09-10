import { expect, test } from "@playwright/test";

test.describe("App gate — unauthenticated pages and APIs", () => {
  test("unauthenticated /dashboard stays on the route", async ({ page }) => {
    const res = await page.goto("/dashboard");
    expect(res?.status()).toBe(200);
    expect(page.url()).toContain("/dashboard");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("unauthenticated /case stays on the route", async ({ page }) => {
    const res = await page.goto("/case");
    expect(res?.status()).toBe(200);
    expect(page.url()).toContain("/case");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("unauthenticated /compose redirects to /login with next", async ({ page }) => {
    await page.goto("/compose");
    await page.waitForURL(/\/login/);
    const url = new URL(page.url(), "http://localhost");
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("next")).toBe("/compose");
  });

  test("unauthenticated /vault stays on the route", async ({ page }) => {
    const res = await page.goto("/vault");
    expect(res?.status()).toBe(200);
    expect(page.url()).toContain("/vault");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("unauthenticated /billing redirects to /login with next", async ({ page }) => {
    await page.goto("/billing");
    await page.waitForURL(/\/login/);
    const url = new URL(page.url(), "http://localhost");
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("next")).toBe("/billing");
  });

  test("login keeps next", async ({ page }) => {
    await page.goto("/login?next=/case");
    await expect(page.locator("text=Your answers are saved on this device")).toBeVisible();
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
