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

  // Refused here as well as on the server, so an unidentified document is never put on the wire at
  // all. The server's own refusal is the backstop, not the first line.
  if (input.evidenceKind === "other") {
    return {
      kind: "unavailable",
      message:
        "This record is not one of the document types we know how to check, so we have not read it. Review the original yourself and note what it shows.",
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
