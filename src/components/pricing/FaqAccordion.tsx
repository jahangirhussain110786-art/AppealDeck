"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Compass,
  CreditCard,
  FileCheck2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconTile } from "@/components/workspace/WorkspaceVisuals";
import { faqByGroup } from "@/content/marketing";

const TOPICS: Record<string, { icon: LucideIcon; tone: "primary" | "info" | "warning" }> = {
  start: { icon: Compass, tone: "primary" },
  response: { icon: FileCheck2, tone: "info" },
  privacy: { icon: ShieldCheck, tone: "primary" },
  pass: { icon: CreditCard, tone: "warning" },
};
const groups = faqByGroup();

export function FaqAccordion() {
  return (
    <Tabs defaultValue="start" className="min-w-0">
      <TabsList
        aria-label="Question topics"
        className="grid h-auto grid-cols-2 gap-2 bg-transparent p-0 sm:grid-cols-4 sm:gap-3"
      >
        {groups.map((group) => {
          const topic = TOPICS[group.id] ?? { icon: Compass, tone: "primary" as const };
          return (
            <TabsTrigger
              key={group.id}
              value={group.id}
              aria-label={group.name}
              className="flex h-full min-w-0 flex-col items-start gap-3 whitespace-normal rounded-xl border border-border/80 bg-card px-4 py-4 text-left shadow-card hover:bg-surface-2 data-[state=active]:border-primary/40 data-[state=active]:bg-primary/5 data-[state=active]:shadow-none"
            >
              <IconTile icon={topic.icon} tone={topic.tone} />
              <span className="text-sm font-semibold text-foreground">{group.name}</span>
              <span className="hidden text-xs font-normal leading-relaxed text-muted-foreground sm:block">
                {group.hint}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>
      {groups.map((group) => (
        <TabsContent
          key={group.id}
          value={group.id}
          className="mt-4 overflow-hidden rounded-xl border border-border/80 bg-card shadow-card"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-surface-2/40 px-5 py-4 sm:px-6">
            <h3 className="text-sm font-semibold text-foreground">{group.name}</h3>
            <span className="text-xs text-muted-foreground">{group.items.length} questions</span>
          </div>
          <Accordion
            type="single"
            collapsible
            defaultValue={group.items[0]?.id}
            className="px-5 sm:px-6"
          >
            {group.items.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger className="min-h-14 rounded-sm py-5 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="max-w-prose pr-5 text-sm leading-relaxed">
                  <p className="font-medium text-foreground">{item.a}</p>
                  {item.detail && <p className="mt-2">{item.detail}</p>}
                  {item.link && (
                    <Link
                      href={item.link.href}
                      className="mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-sm font-medium text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {item.link.label}
                      <ArrowUpRight className="size-3.5" aria-hidden />
                    </Link>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>
      ))}
    </Tabs>
  );
}
