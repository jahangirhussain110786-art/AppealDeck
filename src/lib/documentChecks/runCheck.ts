/**
 * AA-41 (AM-26): client-side routing for a document check.
 *
 * This function is where the split the founder was asked to rule on actually lives. It decides, per
 * evidence kind, whether a file is read on the server or examined in the browser — and it is the
 * only place that decision is made, so changing it is one edit rather than a hunt.
 *
 * The server route refuses identity kinds independently (`/api/read-document`), so a bug here
 * cannot cause a passport to be uploaded; the two agree by construction rather than by convention.
 */

import type { EvidenceKind, ViolationKind } from "@/core";
import type { DocumentCheckResult } from "@/core/documentCheck";
import { analyzeIdentityImage, type IdentityImageReport } from "./identity";

/** Evidence kinds examined in the browser. Mirrors the server's own refusal list. */
export const BROWSER_ONLY_EVIDENCE_KINDS: readonly EvidenceKind[] = [
  "identity_doc",
  "financial_instrument_doc",
];

export function isBrowserOnly(kind: EvidenceKind): boolean {
  return BROWSER_ONLY_EVIDENCE_KINDS.includes(kind);
}

export type CheckOutcome =
  /** A business document was read against Amazon's requirements. */
  | { kind: "fields"; result: DocumentCheckResult }
  /** An identity document was examined locally; contents were never read. */
  | { kind: "image"; report: IdentityImageReport }
  /** Nothing could be checked. Always says so rather than showing an empty result. */
  | { kind: "unavailable"; message: string };

/** Mime types the server is willing to read. Anything else is reported, not silently dropped. */
const SERVER_READABLE = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export interface RunCheckInput {
  kind: ViolationKind;
  evidenceKind: EvidenceKind;
  bytes: Uint8Array;
  mimeType: string;
}

export async function runDocumentCheck(input: RunCheckInput): Promise<CheckOutcome> {
  if (isBrowserOnly(input.evidenceKind)) {
    const blob = new Blob([toArrayBuffer(input.bytes)], { type: input.mimeType });
    const report = await analyzeIdentityImage(blob);
    return report
      ? { kind: "image", report }
      : {
          kind: "unavailable",
          message:
            "We check identity documents on your own device, and we can only do that for a photo or a scan saved as an image. A PDF is fine to submit to Amazon — we simply cannot check it here.",
        };
  }

  if (!SERVER_READABLE.includes(input.mimeType)) {
    return {
      kind: "unavailable",
      message: "We can read PDF, JPEG, PNG and WebP files. This one is a different format.",
    };
  }

  try {
    const res = await fetch("/api/read-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: input.kind,
        evidenceKind: input.evidenceKind,
        mimeType: input.mimeType,
        data: toBase64(input.bytes),
      }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        kind: "unavailable",
        message:
          (body && typeof body.error === "string" && body.error) ||
          "We could not check that document. Nothing about your case has changed.",
      };
    }
    if (!body?.ok) {
      return {
        kind: "unavailable",
        message:
          (body && typeof body.message === "string" && body.message) ||
          "We could not read that document.",
      };
    }
    return { kind: "fields", result: body.check as DocumentCheckResult };
  } catch {
    return {
      kind: "unavailable",
      message: "We could not reach the checker. Your document and your case are unchanged.",
    };
  }
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
