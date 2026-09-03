import { requireUser } from "@/lib/auth";
import { isLicenseActive } from "@/lib/license";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import VaultView from "@/components/VaultView";

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const user = await requireUser();
  const active = await isLicenseActive(user.email);

  if (!active) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Encrypted evidence vault</h1>
        <Card className="p-6">
          <p className="text-sm">
            The encrypted evidence vault is included with the Appeal Pass. It stores your supplier
            invoices, brand authorizations, and other case documents encrypted on your device
            (AES-GCM, key derived from a passphrase you set — we never see it).
          </p>
          <div className="mt-4 flex gap-2">
            <Button asChild>
              <Link href="/pricing">Get the Appeal Pass</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/case">Back to your case</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Encrypted evidence vault</h1>
      <p className="text-sm text-muted-foreground">
        Files you upload here are encrypted on your device with a key derived from your passphrase.
        Cloud sync uploads only ciphertext. Per the data architecture:{" "}
        <Link href="/privacy" className="text-primary underline-offset-2 hover:underline">
          read the privacy posture
        </Link>
        .
      </p>
      <VaultView userId={user.id} />
    </div>
  );
}
