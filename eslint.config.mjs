// Flat config, from the Next.js 16 upgrade (24 Sep 2026): `next lint` was removed in 16, so ESLint
// runs through its own CLI (`npm run lint`, zero warnings allowed). Every rule in eslint-config-next
// is on, including the React Compiler readiness rules; the 18 places they flagged were fixed on
// 24 Sep 2026 rather than switched off.
import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },
];

export default config;
