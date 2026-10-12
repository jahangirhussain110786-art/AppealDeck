import type { Vault } from "@/core/vault/vault";
import { APP } from "@/content/app";
import { listCases, loadCaseFile, loadCaseLog } from "@/lib/caseStore";
import { summarizeCase } from "@/lib/caseSummary";
import { labelOf } from "@/lib/caseLabel";

/**
 * Every case on this device as one spreadsheet (G-60, 12 Oct 2026), for someone who runs many
 * accounts and keeps the real list in Sheets. It is built here, from the encrypted vault, and
 * downloaded as a file: nothing is sent anywhere. It carries only what the case already stores:
 * the seller's own name for it, the kind, the dates, what is next, who is being waited on. No
 * notice text, no document, no hash.
 */

export const CASES_CSV_HEADER = [
  "Case name",
  "Kind",
  "Case ID",
  "Opened",
  "Status",
  "Next step",
  "Reply by",
  "Waiting on",
  "Chase on",
  "Last activity",
] as const;

/**
 * One CSV field. Quoted when it needs to be, and a value that a spreadsheet would run as a formula
 * (it starts with =, +, - or @) is written with a leading apostrophe so it stays text. A case name
 * is typed by the seller, so this is not a hypothetical.
 */
export function csvField(value: string): string {
  let v = value.replace(/\r?\n/g, " ");
  if (/^[=+\-@\t]/.test(v)) v = `'${v}`;
  return /[",]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function csvRow(fields: readonly string[]): string {
  return fields.map(csvField).join(",");
}

const day = (iso: string | undefined) => (iso ? iso.slice(0, 10) : "");

/** The whole file, header first. `\r\n` line ends, which every spreadsheet reads. */
export async function buildCasesCsv(vault: Vault, now = new Date()): Promise<string> {
  const index = await listCases(vault);
  const rows: string[] = [csvRow(CASES_CSV_HEADER)];
  for (const entry of index) {
    const file = await loadCaseFile(vault, entry.id).catch(() => null);
    const log = await loadCaseLog(vault, entry.id).catch(() => null);
    const summary = summarizeCase(entry, file, now, null, log);
    const last = file?.workspace?.history.at(-1)?.at;
    rows.push(
      csvRow([
        labelOf(file?.workspace),
        APP.violationKinds[file?.kind && file.kind !== "UNKNOWN" ? file.kind : entry.kind] ??
          entry.kind,
        entry.id,
        day(entry.createdAt),
        summary.status === "closed" ? "Closed" : summary.status === "waiting" ? "Waiting" : "Act",
        summary.next,
        summary.due?.day ?? summary.due?.label ?? "",
        log?.waitingOn?.party ?? "",
        day(log?.waitingOn?.followUpAt ?? log?.reminderAt),
        day(last ?? log?.lastSeenAt),
      ]),
    );
  }
  return rows.join("\r\n") + "\r\n";
}

export const CASES_CSV_FILENAME = "appealdeck-cases.csv";
