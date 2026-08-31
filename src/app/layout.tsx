import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AppealDeck — Amazon suspension notice decoder",
  description:
    "Paste your Amazon deactivation notice and get it decoded in plain English. Free decoder, $199 Appeal Pass for a drafted Plan of Action. No automation, no guarantees.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-gray-200 antialiased">{children}</body>
    </html>
  );
}
