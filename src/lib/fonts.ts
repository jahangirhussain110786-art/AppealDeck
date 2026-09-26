import { Instrument_Sans, JetBrains_Mono, Newsreader } from "next/font/google";

// Instrument Sans (26 Sep 2026, the prototype pass): a variable grotesk with a distinct voice at
// display sizes, in place of Inter, which had become the default face of every tool on the web.
// Weights 400-700 cover body, medium labels and the semibold headlines the type scale uses.
export const fontSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

// Italic serif accent for exactly one word per major headline (AM-22/V1) — never
// body text. Weight 500 only: this is a decorative accent, not a reading face.
export const fontAccent = Newsreader({
  subsets: ["latin"],
  variable: "--font-accent",
  adjustFontFallback: false,
  display: "swap",
  style: ["italic"],
  weight: ["500"],
});
