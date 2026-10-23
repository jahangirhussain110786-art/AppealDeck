import type { Metadata } from "next";
import { MarketingShell } from "@/components/MarketingShell";
import { GUEST_REMINDER } from "@/content/guestReminder";
import { ReminderAction } from "./ReminderAction";

/**
 * Where the link in a reminder email lands (23 Oct 2026). It never confirms or stops anything on
 * load: mail systems open links to scan them, and that must not confirm an address nobody asked for
 * or stop one the owner wanted. The reader presses a button, which sends a POST.
 */
export const metadata: Metadata = {
  title: GUEST_REMINDER.page.metaTitle,
  description: GUEST_REMINDER.page.metaDescription,
  robots: { index: false, follow: false },
};

export default async function ReminderPage({
  searchParams,
}: {
  searchParams: Promise<{ do?: string; token?: string }>;
}) {
  const { do: action, token } = await searchParams;
  const valid =
    (action === "confirm" || action === "stop") &&
    typeof token === "string" &&
    /^[0-9a-f]{48}$/.test(token);
  return (
    <MarketingShell>
      <div className="mx-auto max-w-xl py-16">
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">
          {action === "stop"
            ? GUEST_REMINDER.page.stop.heading
            : GUEST_REMINDER.page.confirm.heading}
        </h1>
        {valid ? (
          <ReminderAction action={action as "confirm" | "stop"} token={token!} />
        ) : (
          <p className="mt-4 text-muted-foreground">{GUEST_REMINDER.page.unknown}</p>
        )}
      </div>
    </MarketingShell>
  );
}
