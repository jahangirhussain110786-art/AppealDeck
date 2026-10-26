import Link from "next/link";
import { ArrowRight, Check, Info, MessageSquare } from "lucide-react";
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
 * The honest comparison with a general chatbot (22 Oct 2026; reframed 24 Oct 2026). The question
 * stays as the eyebrow because it is what sellers ask. The heading answers it: a chatbot can write
 * the letter, and the case is the part it cannot hold. The phone layout uses cards instead of a
 * sideways-scrolling table; the desktop table keeps the same rows and names.
 */
export function VersusSection() {
  const v = PRICING.versus;
  const m = PRICING.market;
  const title = splitAccent(v.title, v.accent);

  return (
    <section id={v.id} aria-labelledby="versus-title" className="scroll-mt-24 py-16">
      <p className="text-eyebrow text-muted-foreground">{v.eyebrow}</p>
      <h2
        id="versus-title"
        className="mt-2 text-[clamp(1.75rem,1.2rem+1.6vw,2.5rem)] font-semibold tracking-[-0.035em] text-foreground"
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

      <div className="mt-8 hidden sm:block">
        <Card className="overflow-hidden rounded-[20px] p-0 shadow-lift">
          <Table aria-label={`${v.headings.chatbot} and ${v.headings.us}`}>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">{v.headings.job}</TableHead>
                <TableHead className="w-[31%]">
                  <span className="inline-flex items-center gap-1.5">
                    <MessageSquare aria-hidden className="size-3.5" />
                    {v.headings.chatbot}
                  </span>
                </TableHead>
                <TableHead className="w-[39%] bg-[hsl(var(--stage-2))] text-white">
                  <span className="inline-flex items-center gap-1.5">
                    <Check aria-hidden className="size-3.5" strokeWidth={3.5} />
                    {v.headings.us}
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {v.rows.map((row) => (
                <TableRow key={row.job}>
                  <TableHead
                    scope="row"
                    className="h-auto py-4 align-top font-medium text-foreground"
                  >
                    {row.job}
                  </TableHead>
                  <TableCell className="align-top text-muted-foreground">{row.chatbot}</TableCell>
                  <TableCell className="bg-primary/[0.05] align-top font-medium text-foreground">
                    {row.us}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <ul className="mt-8 space-y-3 sm:hidden">
        {v.rows.map((row) => (
          <li key={row.job} className="rounded-2xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold leading-snug text-foreground">{row.job}</h3>
            <dl className="mt-3 grid gap-2">
              <div className="rounded-xl bg-muted/60 px-3 py-2">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {v.headings.chatbot}
                </dt>
                <dd className="mt-0.5 text-sm leading-snug text-muted-foreground">{row.chatbot}</dd>
              </div>
              <div className="rounded-xl bg-primary/[0.06] px-3 py-2 ring-1 ring-inset ring-primary/15">
                <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-ink">
                  <Check aria-hidden className="size-3" strokeWidth={3.5} />
                  {v.headings.us}
                </dt>
                <dd className="mt-0.5 text-sm font-medium leading-snug text-foreground">
                  {row.us}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <p className="mt-4 flex max-w-prose gap-2 text-sm text-muted-foreground">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
        <span>{v.note}</span>
      </p>

      <div className="mt-12 border-t border-border pt-8">
        <h3 className="text-lg font-semibold tracking-[-0.02em] text-foreground">{m.title}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-primary/25 bg-primary/[0.06] p-5">
            <dl>
              <dt className="text-sm font-semibold text-foreground">{m.own.what}</dt>
              <dd className="mt-1 text-xl font-semibold tracking-[-0.02em] text-foreground tabular-nums">
                {m.own.price}
              </dd>
            </dl>
            <p className="mt-1 text-xs text-muted-foreground">{m.own.detail}</p>
            <Link
              href={m.own.href}
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-link underline-offset-4 hover:underline"
            >
              See what the Pass covers
              <ArrowRight aria-hidden className="size-3" />
            </Link>
          </div>
          {m.items.map((item) => (
            <div key={item.what} className="rounded-2xl border border-border bg-card p-5">
              <dl>
                <dt className="text-sm text-muted-foreground">
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-link underline underline-offset-4"
                  >
                    {item.what}
                  </a>
                </dt>
                <dd className="mt-1 text-xl font-semibold tracking-[-0.02em] text-foreground tabular-nums">
                  {item.price}
                </dd>
              </dl>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{m.checkedLabel}</p>
      </div>
    </section>
  );
}
