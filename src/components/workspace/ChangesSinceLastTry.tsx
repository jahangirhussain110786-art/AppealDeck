"use client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ChangeReport } from "@/core/changeReport";
import { formatDate } from "@/lib/format";
import { WORKSPACE as C } from "@/content/workspace";

const MAX_SENTENCES = 5;
const SENTENCE_LENGTH = 220;

function List({ title, items }: { title: string; items: readonly string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const clip = (s: string) =>
  s.length > SENTENCE_LENGTH ? `${s.slice(0, SENTENCE_LENGTH - 1)}…` : s;

/**
 * What is different from the response the seller last recorded, shown where they are about to record
 * another one (10 Oct 2026). Warns when nothing is; never blocks, because the decision is theirs.
 * It replaces the plain "this looks like what you already sent" warning, which covered the wording
 * only and said nothing of the documents and open items that make a response different.
 */
export function ChangesSinceLastTry({ report }: { report: ChangeReport }) {
  const C2 = C.changes;
  const date = formatDate(report.comparedTo.at);

  if (!report.text.comparable && report.comparedTo.fromBeforeAppealDeck) {
    return (
      <Alert variant="warning">
        <AlertTitle>{C2.priorTitle}</AlertTitle>
        <AlertDescription>{C2.priorBody}</AlertDescription>
      </Alert>
    );
  }

  // Sentences that carry a new fact first: they are what a reviewer has not seen.
  const factual = new Set(report.text.addedWithNewFacts);
  const ordered = [
    ...report.text.added.filter((s) => factual.has(s)),
    ...report.text.added.filter((s) => !factual.has(s)),
  ];
  const sentences = ordered.slice(0, MAX_SENTENCES).map(clip);
  const more = ordered.length - sentences.length;
  const wordingSame =
    report.text.verdict === "identical" || report.text.verdict === "near-identical";
  const little = report.level === "little";

  return (
    <Alert variant={report.level === "changed" ? "info" : "warning"}>
      <AlertTitle>
        {report.nothingChanged ? C2.nothingTitle : little ? C2.littleTitle : C2.changedTitle}
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          {(report.nothingChanged
            ? C2.nothingBody
            : little
              ? C2.littleBody
              : C2.changedIntro
          ).replace("{date}", date)}
        </p>
        {report.level === "changed" && wordingSame && report.text.comparable && (
          <p>{C2.sameWording}</p>
        )}
        {!report.nothingChanged && (
          <>
            <List
              title={little ? C2.newOrReworded : C2.newSentences}
              items={
                more > 0 ? [...sentences, C2.moreSentences.replace("{n}", String(more))] : sentences
              }
            />
            <List title={C2.documentsAdded} items={report.documents.added} />
            <List title={C2.documentsRemoved} items={report.documents.removed} />
            <List title={C2.resolved} items={report.resolved} />
            <List title={C2.stillOpen} items={report.stillOpen} />
          </>
        )}
        {!report.documents.comparable && <p className="text-xs">{C2.documentsUnknown}</p>}
      </AlertDescription>
    </Alert>
  );
}
