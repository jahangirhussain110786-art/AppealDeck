import { test, type FullConfig } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

// Output directory and public route list can be overridden per run, e.g.
//   SCREENSHOT_OUT=docs/handoffs/screenshots/2026-09-10 SCREENSHOT_ROUTES=/,/terms
const OUT = process.env.SCREENSHOT_OUT ?? "docs/handoffs/screenshots/2026-09-07";
const PUBLIC_ROUTES = process.env.SCREENSHOT_ROUTES
  ? process.env.SCREENSHOT_ROUTES.split(",").filter(Boolean)
  : ["/", "/decode", "/pricing", "/faq", "/login", "/signup"];
const AUTH_ROUTES = ["/dashboard", "/case", "/compose", "/vault", "/billing"];
const WIDTHS = [375, 768, 1280];

test.describe.configure({ mode: "parallel" });

test.beforeAll(async ({ browser }, testInfo) => {
  const dir = path.resolve(OUT);
  fs.mkdirSync(dir, { recursive: true });
});

const DEV_EMAIL = process.env.DEV_LOGIN_EMAIL;
const DEV_PASSWORD = process.env.DEV_LOGIN_PASSWORD;

let storageStatePath: string | null = null;
let authAvailable = false;

test.beforeAll(async ({ browser }) => {
  if (!DEV_EMAIL || !DEV_PASSWORD) {
    authAvailable = false;
    return;
  }
  try {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(DEV_EMAIL);
    await page.getByLabel(/^password$/i).fill(DEV_PASSWORD);
    await Promise.all([
      page.waitForURL(/\/dashboard/),
      page.getByRole("button", { name: /sign in/i }).click(),
    ]);
    storageStatePath = path.resolve(OUT, ".auth.json");
    await ctx.storageState({ path: storageStatePath });
    await ctx.close();
    authAvailable = true;
  } catch {
    authAvailable = false;
  }
});

for (const route of PUBLIC_ROUTES) {
  for (const width of WIDTHS) {
    for (const scheme of ["light", "dark"]) {
      test(`screenshot ${route} @${width} ${scheme}`, async ({ page }) => {
        await page.setViewportSize({
          width,
          height: width === 375 ? 667 : width === 768 ? 1024 : 720,
        });
        await page.emulateMedia({ colorScheme: scheme as "light" | "dark" });
        await page.goto(route);
        await page.waitForLoadState("networkidle");
        const safe = route.replace(/\//g, "_").replace(/^_/, "");
        const file = path.join(OUT, `${safe || "home"}-${width}-${scheme}.png`);
        await page.screenshot({ path: file, fullPage: true });
      });
    }
  }
}

for (const route of AUTH_ROUTES) {
  for (const width of WIDTHS) {
    for (const scheme of ["light", "dark"]) {
      test(`screenshot ${route} @${width} ${scheme} (auth)`, async ({ browser }) => {
        test.skip(!authAvailable, "DEV_LOGIN_EMAIL / DEV_LOGIN_PASSWORD not set");
        const ctx = await browser.newContext({ storageState: storageStatePath! });
        const page = await ctx.newPage();
        await page.setViewportSize({
          width,
          height: width === 375 ? 667 : width === 768 ? 1024 : 720,
        });
        await page.emulateMedia({ colorScheme: scheme as "light" | "dark" });
        await page.goto(route);
        await page.waitForLoadState("networkidle");
        const name = route.replace(/\//g, "_").replace(/^_/, "");
        const file = path.join(OUT, `${name}-${width}-${scheme}.png`);
        await page.screenshot({ path: file, fullPage: true });
        await ctx.close();
      });
    }
  }
}
