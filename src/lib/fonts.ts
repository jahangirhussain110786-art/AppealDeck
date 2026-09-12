import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";

// Variable Inter with the optical-size axis: display sizes get display letterforms automatically.
export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  axes: ["opsz"],
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
  display: "swap",
  style: ["italic"],
  weight: ["500"],
});
