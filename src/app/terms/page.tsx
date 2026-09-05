import { LegalPage, legalMetadata } from "@/components/LegalPage";

export const metadata = legalMetadata("terms");

export default function TermsPage() {
  return <LegalPage doc="terms" />;
}
