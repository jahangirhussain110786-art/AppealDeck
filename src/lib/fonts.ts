import { Inter, JetBrains_Mono } from "next/font/google";

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
