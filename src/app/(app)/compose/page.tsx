import { requireUser } from "@/lib/auth";
import { isLicenseActive } from "@/lib/license";
import ComposeView from "@/components/ComposeView";
import { ComposeGate } from "@/components/ComposeGate";

export const dynamic = "force-dynamic";

export default async function ComposePage() {
  const user = await requireUser("/compose");
  const email = (user.email ?? "").trim().toLowerCase();
  const hasPass = await isLicenseActive(email);
  return hasPass ? <ComposeView /> : <ComposeGate email={user.email} />;
}
