import { Inter, Lora, Open_Sans } from "next/font/google";

/**
 * Three typefaces for three names in the home-page credits row (27 Oct 2026), chosen by the founder
 * so those names read like the wordmarks sellers already know: a serif for Claude, a tight grotesque
 * for ChatGPT, a humanist sans for Microsoft. They are free, substitutable faces, not the
 * brands' own typefaces — the row identifies the tools, it does not dress as them.
 *
 * Loaded here rather than in the root layout because nothing else on the site uses them.
 */
export const creditSerif = Lora({
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
  variable: "--font-credit-serif",
});

export const creditGrotesque = Inter({
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
  variable: "--font-credit-grotesque",
});

export const creditHumanist = Open_Sans({
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
  variable: "--font-credit-humanist",
});
