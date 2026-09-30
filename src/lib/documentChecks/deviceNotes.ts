/**
 * What a reading made on the seller's device says about itself (30 Sep 2026). One place, so the
 * panel a seller sees and the export a specialist reads cannot drift apart or claim different
 * things about where the file went.
 */

import type { DocumentCheckResult } from "@/core/documentCheck";
import { APP } from "@/content/app";

const C = APP.evidenceSlots.check;

export interface DeviceReadingNotes {
  title: string;
  /** Why the AI reading was not used, when the result records it. */
  whyNotAi?: string;
  /** Present when the words came from a picture, which can be misread. */
  picture?: string;
  /** Where the file went, and what this kind of reading can and cannot do. */
  where: string;
}

/** Null for a result that was read by the AI. */
export function deviceReadingNotes(result: DocumentCheckResult): DeviceReadingNotes | null {
  if (result.readOn !== "device") return null;
  return {
    title: C.deviceTitle,
    ...(result.aiNote ? { whyNotAi: `${C.aiNotUsed} ${result.aiNote}` } : {}),
    ...(result.textSource === "ocr" ? { picture: C.pictureNote } : {}),
    where:
      result.fileSent === true
        ? C.deviceNoteSent
        : result.fileSent === false
          ? C.deviceNoteNotSent
          : C.deviceNoteUnknown,
  };
}
