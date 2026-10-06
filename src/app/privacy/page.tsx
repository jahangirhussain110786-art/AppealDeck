import type { Metadata } from "next";
import { LegalPage, legalPageMetadata } from "@/components/LegalPage";
import { pageMetadata } from "@/content/pageMetadata";

export const metadata: Metadata = pageMetadata({
  ...legalPageMetadata.privacy,
  canonical: "/privacy",
});

export default function PrivacyPage() {
  return <LegalPage doc="privacy" />;
}
