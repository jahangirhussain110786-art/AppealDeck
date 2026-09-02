import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://appealdeck.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AppealDeck — Amazon suspension notice decoder",
    template: "%s · AppealDeck",
  },
  description:
    "Paste your Amazon deactivation notice and get it decoded in plain English. Free decoder, $199 Appeal Pass for a drafted Plan of Action. No automation, no guarantees.",
  applicationName: "AppealDeck",
  openGraph: {
    type: "website",
    siteName: "AppealDeck",
    title: "AppealDeck — Amazon suspension notice decoder",
    description:
      "Decode your Amazon deactivation or policy notice into plain English and draft a Plan of Action you edit and submit yourself.",
    url: siteUrl,
  },
  twitter: {
    card: "summary",
    title: "AppealDeck — Amazon suspension notice decoder",
    description:
      "Decode your Amazon deactivation or policy notice into plain English. Free decoder, $199 Appeal Pass.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
