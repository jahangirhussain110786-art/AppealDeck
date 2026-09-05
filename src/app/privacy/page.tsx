import { LegalPage, legalMetadata } from "@/components/LegalPage";

export const metadata = legalMetadata("privacy");

export default function PrivacyPage() {
  return <LegalPage doc="privacy" />;
}
