import localFont from "next/font/local";

/*
  Self-hosted (8 Oct 2026). These were `next/font/google`, which fetches the font CSS from Google at
  build time. When that fetch fails the build stops with "next/font/google queries have exactly one
  entry", which says nothing about the network: it failed one CI run and one local build the same
  morning, and a deploy would fail the same way. The three files below are the latin subsets Google
  served for these families (all SIL Open Font License 1.1), so the build needs no network and the
  pages look exactly as they did. Each is a variable font, so one file covers the weights used.
*/

// Instrument Sans (26 Sep 2026, the prototype pass): a variable grotesk with a distinct voice at
// display sizes, in place of Inter, which had become the default face of every tool on the web.
// Weights 400-700 cover body, medium labels and the semibold headlines the type scale uses.
export const fontSans = localFont({
  src: [{ path: "./fonts/InstrumentSans-latin.woff2", style: "normal", weight: "400 700" }],
  variable: "--font-sans",
  display: "swap",
});

export const fontMono = localFont({
  src: [{ path: "./fonts/JetBrainsMono-latin.woff2", style: "normal", weight: "400 500" }],
  variable: "--font-mono",
  display: "swap",
});

// Italic serif accent for exactly one word per major headline (AM-22/V1) — never
// body text. Weight 500 only: this is a decorative accent, not a reading face.
export const fontAccent = localFont({
  src: [{ path: "./fonts/Newsreader-italic-latin.woff2", style: "italic", weight: "500" }],
  variable: "--font-accent",
  adjustFontFallback: false,
  display: "swap",
});
