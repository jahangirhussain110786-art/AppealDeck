module.exports = {
  ci: {
    collect: {
      url: [
        "http://127.0.0.1:3000/",
        "http://127.0.0.1:3000/pricing",
        "http://127.0.0.1:3000/decode",
        // /login is deliberately `noindex` since 25 Sep 2026 (dfc5718), which Lighthouse scores as
        // an SEO failure (0.63) by design. Its accessibility is covered by e2e/a11y.spec.ts.
        "http://127.0.0.1:3000/privacy",
        "http://127.0.0.1:3000/terms",
        "http://127.0.0.1:3000/refund",
        "http://127.0.0.1:3000/faq",
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: "--no-sandbox --headless --disable-gpu",
        preset: "desktop",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 1.0 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 0.95 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
