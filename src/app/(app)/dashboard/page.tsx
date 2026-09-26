import { Metadata } from "next";
import { getOptionalUser } from "@/lib/auth";
import { fetchLicenseForUser } from "@/lib/license";
import { DashboardClient } from "@/components/DashboardClient";
import { APP } from "@/content/app";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: APP.dashboard.title,
  description: APP.dashboard.subtitle,
};

/** The page heading is the greeting's sentence, which `DashboardClient` writes once the cases are read. */
export default async function DashboardPage() {
  const user = await getOptionalUser();
  const signedIn = Boolean(user);
  const license = signedIn
    ? await fetchLicenseForUser(user?.id)
    : { status: "none" as const, plan: null, licenseKey: null };

  return (
    <div className="max-w-[67.5rem]">
      <DashboardClient license={license} signedIn={signedIn} />
    </div>
  );
}
