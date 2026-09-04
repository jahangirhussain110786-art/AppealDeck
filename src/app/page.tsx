"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileSearch, FileText, ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: FileSearch,
    title: "Free decoder",
    body: "Paste a notice, see what it means and the deadlines — processed in your browser.",
  },
  {
    icon: FileText,
    title: "POA drafting",
    body: "A $199 Appeal Pass drafts your Plan of Action; you edit and submit it yourself.",
  },
  {
    icon: ShieldCheck,
    title: "You stay in control",
    body: "We never submit to Amazon on your behalf. Local-first, read-only, no automation.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader mode="marketing" />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-16">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Understand your Amazon suspension notice.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            AppealDeck decodes your deactivation or policy notice into plain English and drafts a
            Plan of Action you edit and submit yourself. Local-first, read-only, no automation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/decode">
                Decode a notice (free) <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
        </motion.section>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 + i * 0.08 }}
              whileHover={{ y: -4 }}
            >
              <Card className="h-full transition-shadow hover:shadow-soft-lg">
                <CardContent className="pt-5">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h2 className="mt-4 font-medium text-foreground">{f.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
