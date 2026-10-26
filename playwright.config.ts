import { defineConfig, devices } from "@playwright/test";

// The signed-in fixture reads DEV_LOGIN_EMAIL/PASSWORD. Next loads .env.local for the server only,
// so without this the signed-in checks skip on the very machine that has the account (24 Oct 2026).
try {
  process.loadEnvFile(".env.local");
} catch {
  // No local file: the signed-in checks skip.
}

const PORT = process.env.PLAYWRIGHT_PORT ?? "3000";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: "e2e/screenshots.spec.ts",
    },
    // Sellers use Safari and Firefox too. Not part of the default CI run (which names the chromium
    // project); run with `npm run test:e2e:cross` (7 Oct 2026).
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      // This machine runs WebKit and Firefox several times slower than Chromium under load; every
      // test that failed on time alone passed repeatedly when run by itself (8 Oct 2026).
      timeout: 90_000,
      testIgnore: "e2e/screenshots.spec.ts",
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      timeout: 90_000,
      testIgnore: "e2e/screenshots.spec.ts",
    },
    {
      name: "screenshots",
      testMatch: "e2e/screenshots.spec.ts",
    },
  ],
  webServer: {
    command: process.env.CI
      ? `node node_modules/next/dist/bin/next start --port ${PORT}`
      : // Starting `next dev` directly skips the `predev` hook, and public/reader (the on-device
        // document reader's files) is not committed, so a clean checkout would 404 on it.
        `node scripts/copy-reader-assets.mjs && node node_modules/next/dist/bin/next dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  expect: {
    timeout: 10_000,
  },
});
