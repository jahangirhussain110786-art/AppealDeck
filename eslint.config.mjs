// Flat config, from the Next.js 16 upgrade (24 Sep 2026): `next lint` was removed in 16, so ESLint
// runs through its own CLI (`npm run lint`). The rules are the ones `.eslintrc.json` had.
import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    rules: {
      "@next/next/no-img-element": "off",
      // React Compiler readiness rules, new in eslint-config-next 16 (react-hooks v7). They flag
      // 18 existing sites — mostly an effect that calls setState once on mount — across the vault
      // gate, the auth pages and checkout. This app does not use the React Compiler, and changing
      // those effects changes behaviour in the flows that guard a seller's data and payment, so it
      // is its own reviewed pass, not a side effect of a framework upgrade. Off, not "warn": the
      // lint gate is zero warnings, and a standing warning list teaches everyone to ignore it.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
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
