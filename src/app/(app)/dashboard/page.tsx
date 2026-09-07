import { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { fetchLicenseByEmail } from "@/lib/license";
import { DashboardClient } from "@/components/DashboardClient";
import { APP } from "@/content/app";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: APP.dashboard.title,
  description: APP.dashboard.subtitle,
};

export default async function DashboardPage() {
  const user = await requireUser();
  const license = await fetchLicenseByEmail(user.email);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {APP.dashboard.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{APP.dashboard.subtitle}</p>
      </div>
      <DashboardClient user={user} license={license} />
    </div>
  );
}
