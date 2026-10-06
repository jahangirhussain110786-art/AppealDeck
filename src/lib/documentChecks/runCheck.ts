/**
 * AA-41 (AM-26): client-side routing for a document check.
 *
 * This function is where the split the founder was asked to rule on actually lives. It decides, per
 * evidence kind, whether a file is read on the server or examined in the browser — and it is the
 * only place that decision is made, so changing it is one edit rather than a hunt.
 *
 * Corrected 23 Sep 2026. This said the server "refuses identity kinds independently, so a bug here
 * cannot cause a passport to be uploaded; the two agree by construction". Both halves were false.
 * The server read the same `evidenceKind` out of the same request body, so it restated this file's
 * claim rather than checking it — and the workspace was storing every upload as `"other"`, so the
 * claim it restated was wrong. A passport attached to an identity requirement missed the branch
 * below and was sent.
 *
 * What is true now: the caller derives the kind from the requirement Amazon actually asked for, and
 * the server declines to read anything it cannot name, which is its own rule and not a mirror of
 * this one. They agree because each is right separately, which is the only kind of agreement worth
 * relying on.
 */

import type { EvidenceKind, ViolationKind } from "@/core";
import {
  buildDocumentCheck,
  requirementForCheck,
  type DocumentCheckResult,
} from "@/core/documentCheck";
import { readFieldsFromText } from "@/core/localReading";
import { analyzeIdentityImage, type IdentityImageReport } from "./identity";
import { MAX_CHECK_BYTES } from "./limits";
import type { DocumentCheckCaseData } from "./context";
import type { DeviceText } from "./localReader";

/** Evidence kinds examined in the browser. Mirrors the server's own refusal list. */
export const BROWSER_ONLY_EVIDENCE_KINDS: readonly EvidenceKind[] = [
  "identity_doc",
  "financial_instrument_doc",
  // A utility bill or bank statement carries the same personal details, so it stays on the device.
  "address_proof",
];

export function isBrowserOnly(kind: EvidenceKind): boolean {
  return BROWSER_ONLY_EVIDENCE_KINDS.includes(kind);
}

export type CheckOutcome =
  /** A business document was read against Amazon's requirements. */
  | { kind: "fields"; result: DocumentCheckResult }
  /** An identity document was examined locally; contents were never read. */
  | { kind: "image"; report: IdentityImageReport }
  /**
   * Nothing could be checked. Always says so rather than showing an empty result. `fileSent` is
   * true once the file was posted to the AI reading endpoint, whatever came back.
   */
  | { kind: "unavailable"; message: string; fileSent?: boolean };

/** Mime types the server is willing to read. Anything else is reported, not silently dropped. */
const SERVER_READABLE = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export interface RunCheckInput {
  /** The case the document belongs to; a check is covered by that case's Appeal Pass. */
  caseId: string;
  kind: ViolationKind;
  evidenceKind: EvidenceKind;
  bytes: Uint8Array;
  mimeType: string;
  /** Identifiers from the case's own notices, so the reading can be compared with them. */
  caseData?: DocumentCheckCaseData;
  /**
   * False for a guest. The AI reading needs an account, so a guest's file goes straight to the
   * reading on the device and is never uploaded only to be refused.
   */
  signedIn?: boolean;
}

/** The on-device reader; tests pass their own, so they need neither pdf.js nor OCR. */
export type ReadTextOnDevice = (bytes: Uint8Array, mimeType: string) => Promise<DeviceText | null>;

const readTextOnDevice: ReadTextOnDevice = async (bytes, mimeType) =>
  (await import("./localReader")).readTextOnDevice(bytes, mimeType);

/** The files the device reader opens, and the largest: the most the case stores. */
const DEVICE_READABLE = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const MAX_DEVICE_BYTES = 10 * 1024 * 1024;

const DEVICE_TRIED_NOTE =
  "We also tried to read it on this device and could not make out its text.";
/** The reader's own files could not be fetched (offline, blocked); not about the document. */
const READER_LOAD_FAILED_NOTE =
  "The on-device reader could not load. Check your connection and try again.";
const DEVICE_TIMEOUT_NOTE =
  "We also tried to read it on this device, but it took too long and was stopped. Try again, or add a clearer or smaller copy.";
/** A password-protected PDF cannot be opened here, or by the AI reading. */
const PROTECTED_NOTE =
  "This PDF is protected with a password, so it cannot be read. Save a copy without the protection and add that instead.";

const AI_NEEDS_SIGN_IN =
  "The AI reading needs you to be signed in. Sign in, then check it again; nothing about your case has changed.";
const AI_NEEDS_PASS =
  "The AI reading is part of the Appeal Pass for this case, and this case does not have one yet.";

/** The longest reason kept with a saved reading; the vault's validator refuses a longer one. */
const MAX_AI_NOTE = 500;

/**
 * 29 Sep 2026: the AI reading first, and the reading on the device when it cannot run — switched
 * off, busy, over its quota, the seller not signed in, or the file too large to send. A business
 * document is only ever read, never judged, either way; the device reading says which it was.
 */
export async function runDocumentCheck(
  input: RunCheckInput,
  readText: ReadTextOnDevice = readTextOnDevice,
): Promise<CheckOutcome> {
  if (isBrowserOnly(input.evidenceKind)) {
    const blob = new Blob([toArrayBuffer(input.bytes)], { type: input.mimeType });
    const report = await analyzeIdentityImage(blob);
    return report
      ? { kind: "image", report }
      : {
          kind: "unavailable",
          message:
            "We check identity documents on your own device, and we can only do that for a photo or a scan saved as a JPEG, PNG or WebP. A PDF, or an iPhone (HEIC) photo, is fine to submit to Amazon — we simply cannot check it here.",
        };
  }

  // Refused here as well as on the server, so an unidentified document is never put on the wire at
  // all. The server's own refusal is the backstop, not the first line.
  if (input.evidenceKind === "other") {
    return {
      kind: "unavailable",
      message:
        "This record is not one of the document types we know how to check, so we have not read it. Review the original yourself and note what it shows.",
    };
  }

  const ai =
    input.signedIn === false
      ? { kind: "unavailable" as const, message: AI_NEEDS_SIGN_IN }
      : await readWithAi(input);
  if (ai.kind !== "unavailable") return ai;
  const local = await readOnDevice(input, ai, readText);
  if (local.outcome) return local.outcome;
  // A protected PDF is the same answer whoever reads it; signing in would not help.
  if (local.failure === "protected") {
    return { kind: "unavailable", message: PROTECTED_NOTE, fileSent: ai.fileSent === true };
  }
  // Said, so a seller whose scan has no legible text is not left thinking that signing in would fix it.
  if (!local.tried) return ai;
  const tried =
    local.failure === "timeout"
      ? DEVICE_TIMEOUT_NOTE
      : local.failure === "load"
        ? READER_LOAD_FAILED_NOTE
        : DEVICE_TRIED_NOTE;
  return { ...ai, message: `${tried} ${ai.message}` };
}

/**
 * The reading on the device, or null when it cannot open the file or finds no legible text. The
 * same `buildDocumentCheck` makes every comparison, so a date window or a buyer mismatch is judged
 * alike whichever way the words were read.
 */
async function readOnDevice(
  input: RunCheckInput,
  ai: { message: string; fileSent?: boolean },
  readText: ReadTextOnDevice,
): Promise<{
  outcome: CheckOutcome | null;
  tried: boolean;
  /** Why the file could not be read, when the reader knew: a password, or the time limit. */
  failure?: "protected" | "timeout" | "load";
}> {
  if (!DEVICE_READABLE.includes(input.mimeType) || input.bytes.byteLength > MAX_DEVICE_BYTES)
    return { outcome: null, tried: false };
  const requirement = requirementForCheck(input.kind, input.evidenceKind);
  if (!requirement) return { outcome: null, tried: false };
  try {
    const read = await readText(input.bytes, input.mimeType);
    if (!read) return { outcome: null, tried: true };
    const ctx = input.caseData;
    const context = {
      ...(ctx?.business ? { business: ctx.business } : {}),
      ...(ctx?.suppliers ? { suppliers: ctx.suppliers } : {}),
    };
    const findings = readFieldsFromText(read.text, requirement.fields, context, read.source);
    const result = buildDocumentCheck(
      input.kind,
      input.evidenceKind,
      findings,
      {
        today: localToday(),
        asins: ctx?.asins ?? [],
        referenceIds: ctx?.referenceIds ?? [],
        ...context,
      },
      // Every quote is a line copied out of the document by code, not a model's words. A picture
      // can be misread, so a mismatch in an ID or a name read from one is not shown as a conflict.
      { quotesAreVerbatim: true, fromPicture: read.source === "ocr" },
    );
    return {
      outcome: {
        kind: "fields",
        result: {
          ...result,
          readOn: "device",
          aiNote: ai.message.slice(0, MAX_AI_NOTE),
          fileSent: ai.fileSent === true,
          textSource: read.source,
        },
      },
      tried: true,
    };
  } catch (error) {
    // The reader names the two failures a seller can act on; anything else is "could not make out".
    const named = error as { name?: string; reason?: string } | null;
    const failure =
      named?.name === "DeviceReadError" &&
      (named.reason === "protected" || named.reason === "timeout" || named.reason === "load")
        ? named.reason
        : undefined;
    return { outcome: null, tried: true, ...(failure ? { failure } : {}) };
  }
}

/** Today on the seller's own calendar, YYYY-MM-DD, as every other date on the case is counted. */
function localToday(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The AI reading on the server. */
async function readWithAi(input: RunCheckInput): Promise<CheckOutcome> {
  if (!SERVER_READABLE.includes(input.mimeType)) {
    return {
      kind: "unavailable",
      message: "We can read PDF, JPEG, PNG and WebP files. This one is a different format.",
    };
  }

  // Refused before it is sent: the host would reject it with a page that is not JSON, and the seller
  // would be told only that the check failed. See `limits.ts`.
  if (input.bytes.byteLength > MAX_CHECK_BYTES) {
    return { kind: "unavailable", message: tooLargeMessage(input.bytes.byteLength) };
  }

  // Ask before sending, not after: the server refuses a file it may not read, but by then the whole
  // file has already crossed the wire. A free account, or a Pass that covers a different case, has
  // no AI reading to send it to. (A failed question is not an answer: send, as before.)
  const pass = await passState(input.caseId);
  if (pass === "signed_out") return { kind: "unavailable", message: AI_NEEDS_SIGN_IN };
  if (pass === "no") return { kind: "unavailable", message: AI_NEEDS_PASS };

  try {
    const res = await fetch("/api/read-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId: input.caseId,
        kind: input.kind,
        evidenceKind: input.evidenceKind,
        mimeType: input.mimeType,
        data: toBase64(input.bytes),
        ...(input.caseData ? { context: input.caseData } : {}),
      }),
    });
    // Should be unreachable after the check above; kept so a lowered host limit still gets a reason.
    // From here the file has left the browser (a failed request may have left too), so every
    // unavailable answer says so: the reading on the device must not claim "never uploaded".
    if (res.status === 413) {
      return {
        kind: "unavailable",
        message: tooLargeMessage(input.bytes.byteLength),
        fileSent: true,
      };
    }
    // 25 Sep 2026: an expired session reached the seller as the bare word "Unauthorized".
    // 29 Sep 2026: a guest who never signed in was told their sign-in had expired, so the message
    // now holds for both.
    if (res.status === 401) {
      return { kind: "unavailable", message: AI_NEEDS_SIGN_IN, fileSent: true };
    }
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        kind: "unavailable",
        message:
          (body && typeof body.error === "string" && body.error) ||
          "We could not check that document. Nothing about your case has changed.",
        fileSent: true,
      };
    }
    if (!body?.ok) {
      return {
        kind: "unavailable",
        message:
          (body && typeof body.message === "string" && body.message) ||
          "We could not read that document.",
        fileSent: true,
      };
    }
    return { kind: "fields", result: body.check as DocumentCheckResult };
  } catch {
    return {
      kind: "unavailable",
      message: "We could not reach the checker. Your document and your case are unchanged.",
      fileSent: true,
    };
  }
}

/**
 * Whether an Appeal Pass covers this case, from the same lookup the server makes before it reads a
 * file (`/api/license/status`): a Pass bound to this case, or one not yet bound to any.
 * "unknown" when the answer could not be had, which must never block a seller who has paid.
 */
async function passState(caseId: string): Promise<"yes" | "no" | "signed_out" | "unknown"> {
  try {
    const res = await fetch(`/api/license/status?caseId=${encodeURIComponent(caseId)}`, {
      cache: "no-store",
    });
    if (res.status === 401) return "signed_out";
    if (!res.ok) return "unknown";
    const body = (await res.json().catch(() => null)) as { status?: unknown } | null;
    if (!body || typeof body.status !== "string") return "unknown";
    return body.status === "active" ? "yes" : "no";
  } catch {
    return "unknown";
  }
}

/**
 * Sizes in decimal megabytes, rounded up, so the file's size and the limit are in the same unit and
 * a file just over the limit never reads as "3.0 MB" beside "up to 3 MB".
 */
function megabytes(bytes: number): string {
  return `${Math.ceil(bytes / 100_000) / 10} MB`;
}

function tooLargeMessage(bytes: number): string {
  return `This file is ${megabytes(bytes)}, and the AI reading takes files up to ${megabytes(MAX_CHECK_BYTES)}. It is saved in your case either way. For the AI reading, save the scan at a lower resolution, or keep only the pages Amazon asks about.`;
}

/** Chunked so a multi-megabyte scan does not blow the argument limit of `String.fromCharCode`. */
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Copies into a plain ArrayBuffer so the Blob constructor accepts it under any TS lib target. */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(out).set(bytes);
  return out;
}
