import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    jsx: "automatic",
  },
  test: {
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "node_modules/**",
      ".next/**",
      "e2e/**",
      "tests/e2e/**",
      "playwright-report/**",
      "test-results/**",
    ],
    environment: "node",
    testTimeout: 15_000,
    hookTimeout: 30_000,
  },
});
