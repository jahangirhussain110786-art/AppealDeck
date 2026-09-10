import { Metadata } from "next";
import { getOptionalUser } from "@/lib/auth";
import { fetchLicenseByEmail } from "@/lib/license";
import { DashboardClient } from "@/components/DashboardClient";
import { APP } from "@/content/app";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: APP.dashboard.title,
  description: APP.dashboard.subtitle,
};

export default async function DashboardPage() {
  const user = await getOptionalUser();
  const signedIn = Boolean(user);
  const email = (user?.email ?? "").trim().toLowerCase();
  const license = signedIn
    ? await fetchLicenseByEmail(email)
    : { status: "none" as const, plan: null, licenseKey: null };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h2 text-foreground">{APP.dashboard.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{APP.dashboard.subtitle}</p>
        </div>
      </div>
      <DashboardClient license={license} signedIn={signedIn} />
    </div>
  );
}
