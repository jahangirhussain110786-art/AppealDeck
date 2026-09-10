import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { fontSans, fontMono } from "@/lib/fonts";
import { ThemeProvider } from "@/components/theme-provider";
import { MotionProviders } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import { SITE_URL } from "@/lib/urls";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AppealDeck — Amazon suspension notice decoder",
    template: "%s · AppealDeck",
  },
  description:
    "Paste your Amazon deactivation notice and get it decoded in plain English. Free decoder, $199 Appeal Pass for a drafted Plan of Action. No automation, no outcome promises.",
  applicationName: "AppealDeck",
  openGraph: {
    type: "website",
    siteName: "AppealDeck",
    title: "AppealDeck — Amazon suspension notice decoder",
    description:
      "Decode your Amazon deactivation or policy notice into plain English and draft a Plan of Action you edit and submit yourself.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "AppealDeck — Amazon suspension notice decoder",
    description:
      "Decode your Amazon deactivation or policy notice in plain English. Free decoder, $199 Appeal Pass.",
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "hsl(0 0% 100%)" },
    { media: "(prefers-color-scheme: dark)", color: "hsl(224 28% 7%)" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <MotionProviders>
            {children}
            <Toaster />
          </MotionProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
