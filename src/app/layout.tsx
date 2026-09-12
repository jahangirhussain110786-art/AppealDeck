import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { fontSans, fontMono, fontAccent } from "@/lib/fonts";
import { ThemeProvider } from "@/components/theme-provider";
import { MotionProviders } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import { AnalyticsScript } from "@/components/AnalyticsScript";
import { SITE_URL } from "@/lib/urls";
import { SHARED } from "@/content/shared";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SHARED.metadata.titleDefault,
    template: "%s · AppealDeck",
  },
  description: SHARED.metadata.description,
  applicationName: "AppealDeck",
  openGraph: {
    type: "website",
    siteName: "AppealDeck",
    title: SHARED.metadata.titleDefault,
    description: SHARED.metadata.description,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: SHARED.metadata.titleDefault,
    description: SHARED.metadata.description,
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
        className={`${fontSans.variable} ${fontMono.variable} ${fontAccent.variable} min-h-screen bg-background text-foreground antialiased`}
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
        <AnalyticsScript />
      </body>
    </html>
  );
}
