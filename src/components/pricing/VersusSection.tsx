import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccentWord } from "@/components/ui/accent-word";
import { PRICING } from "@/content/marketing";
import { splitAccent } from "@/lib/splitAccent";

/**
 * "Can I ask a chatbot instead?" (22 Oct 2026). A general chatbot writes a letter for nothing, so the
 * page says what a letter alone leaves out, and where the chatbot is enough. Then the going rates
 * around the Pass, dated, so $249 is read against something real. Both come from `PRICING`.
 */
export function VersusSection() {
  const v = PRICING.versus;
  const m = PRICING.market;
  const title = splitAccent(v.title, v.accent);
  return (
    <section id={v.id} aria-labelledby="versus-title" className="scroll-mt-24 py-16">
      <h2
        id="versus-title"
        className="text-[clamp(1.75rem,1.2rem+1.6vw,2.5rem)] font-semibold tracking-[-0.035em] text-foreground"
      >
        {title ? (
          <>
            {title.pre}
            <AccentWord className="text-primary-ink">{title.accent}</AccentWord>
            {title.post}
          </>
        ) : (
          v.title
        )}
      </h2>
      <p className="mt-3 max-w-prose text-lg text-muted-foreground">{v.lead}</p>
      <div className="mt-8 overflow-x-auto">
        <Card className="overflow-hidden rounded-[20px] p-0 shadow-lift">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{v.headings.job}</TableHead>
                <TableHead>{v.headings.chatbot}</TableHead>
                <TableHead className="bg-[hsl(var(--stage-2))] text-white">
                  {v.headings.us}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {v.rows.map((row) => (
                <TableRow key={row.job}>
                  <TableCell className="font-medium">{row.job}</TableCell>
                  <TableCell className="text-muted-foreground">{row.chatbot}</TableCell>
                  <TableCell className="bg-primary/[0.05] text-foreground">{row.us}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
      <p className="mt-4 max-w-prose text-sm text-muted-foreground">{v.note}</p>

      <div className="mt-12 border-t border-border pt-8">
        <h3 className="text-lg font-semibold tracking-[-0.02em] text-foreground">{m.title}</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          {m.items.map((item) => (
            <div key={item.what} className="rounded-2xl border border-border bg-card p-5">
              <dt className="text-sm text-muted-foreground">{item.what}</dt>
              <dd className="mt-1 text-xl font-semibold tracking-[-0.02em] text-foreground tabular-nums">
                {item.price}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">{m.checkedLabel}</p>
      </div>
    </section>
  );
}
