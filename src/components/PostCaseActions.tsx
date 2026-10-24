"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GROWTH } from "@/content/growth";
import { SUPPORT_EMAIL } from "@/content/support";
import { SITE_URL } from "@/lib/urls";
import { FUNNEL_EVENTS, trackFunnelEvent } from "@/lib/analytics";

export function PostCaseActions() {
  const c = GROWTH.afterCase;
  async function share() {
    try {
      await navigator.clipboard.writeText(`${SITE_URL}/decode`);
      trackFunnelEvent(FUNNEL_EVENTS.toolShared, { where: "case_closed" });
      toast.success(c.copied);
    } catch {
      toast.error(c.failed);
    }
  }
  return (
    <div className="space-y-3 border-t border-border pt-4">
      <p className="text-sm font-medium">{c.title}</p>
      <p className="text-sm text-muted-foreground">{c.body}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="/case?view=history">{c.backup}</Link>
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => void share()}>
          {c.share}
        </Button>
      </div>
      <a
        href={`mailto:${SUPPORT_EMAIL}?subject=AppealDeck%20feedback`}
        className="inline-flex min-h-11 items-center text-sm text-link underline underline-offset-4"
      >
        {c.feedback}
      </a>
    </div>
  );
}
