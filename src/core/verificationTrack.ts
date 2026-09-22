/**
 * AA-42 (AM-26): preparation checklist for the verification track.
 *
 * AA-39 gave identity and business verification a home in the taxonomy and a routing decision of
 * its own. What it did not give the seller is an order of operations. Verification is unlike every
 * other track in the product: there is nothing to argue and nothing to draft. The seller either
 * produces a document that matches their registered details, or they do not — and the commonest
 * failures are mundane (a name that differs by a middle initial, an expired card, a photo with a
 * corner cut off), not substantive.
 *
 * So this is a checklist rather than a composer. Each step is something the seller can do and
 * verify for themselves, ordered so that the cheap checks come before the expensive ones — there
 * is no point retaking a photograph until you know which document is being asked for.
 *
 * Deliberately absent: any claim about whether verification will succeed, any estimate of how long
 * it takes, and any instruction to alter a document. An edited identity document is treated as a
 * forged one, which is a D6 severity gate and the worst outcome available here.
 */

import type { ParsedNotice } from "./noticeParser";

export type VerificationFlavour =
  /** A video or live call with an Amazon representative. */
  | "video_call"
  /** A document upload — passport, national ID, licence, or a business record. */
  | "document"
  /** INFORM Consumers Act certification or re-certification. */
  | "inform"
  /** The notice names verification but not which kind. */
  | "unspecified";

export interface VerificationStep {
  id: string;
  title: string;
  detail: string;
  /** True when skipping this step is the usual cause of a failed attempt. */
  critical: boolean;
}

/**
 * Reads the flavour from the seller's own notice text. Returns `unspecified` rather than guessing
 * when nothing matches — the checklist then covers what is common to all of them.
 */
export function verificationFlavour(notice: string): VerificationFlavour {
  if (/\bvideo (?:call|interview|verification)\b|\blive call\b/i.test(notice)) return "video_call";
  if (/INFORM Consumers Act|INFORM Act|re-?certif(?:y|ication)|certification page/i.test(notice)) {
    return "inform";
  }
  if (
    /government[\s-]issued (?:ID|identification)|identity document|passport|driver'?s licen[cs]e|national (?:ID|identity) card|bank statement|utility bill/i.test(
      notice,
    )
  ) {
    return "document";
  }
  return "unspecified";
}

const COMMON: VerificationStep[] = [
  {
    id: "identify_request",
    title: "Find the exact document or step the notice names",
    detail:
      "Verification requests are specific. Re-read the notice and the response page and write down precisely what is being asked for, before preparing anything. Sending the wrong document restarts the wait.",
    critical: true,
  },
  {
    id: "match_details",
    title: "Check your name and address match the account exactly",
    detail:
      "Compare the spelling on your document against your Seller Central registered details, character by character, including middle names and abbreviations. A mismatch is the most common reason a genuine document fails.",
    critical: true,
  },
  {
    id: "check_validity",
    title: "Check the document is still in date",
    detail:
      "An expired document is rejected regardless of anything else. Check the expiry date before you photograph or scan it.",
    critical: true,
  },
];

const BY_FLAVOUR: Record<VerificationFlavour, VerificationStep[]> = {
  document: [
    {
      id: "capture_quality",
      title: "Photograph or scan it so a person can read it",
      detail:
        "All four corners inside the frame, even lighting with no flash glare, flat on a surface, and large enough that the small print is legible. Upload it here first and we will check the picture on your own device without sending it anywhere.",
      critical: true,
    },
    {
      id: "no_edits",
      title: "Send the original, never a tidied-up version",
      detail:
        "Do not crop, rotate, retouch, annotate, or re-type any part of the document. An altered identity document is treated as a forged one, which is far worse than a document that is merely hard to read.",
      critical: true,
    },
  ],
  video_call: [
    {
      id: "book_slot",
      title: "Book the earliest slot you can genuinely attend",
      detail:
        "Choose a time you are certain of rather than the soonest available. Missing the call costs more time than waiting for a later one.",
      critical: false,
    },
    {
      id: "originals_present",
      title: "Have the physical original documents with you",
      detail:
        "A photograph of a document on a phone screen is not usually accepted on a call. Have the physical originals in your hand, and somewhere with a steady connection and good light.",
      critical: true,
    },
  ],
  inform: [
    {
      id: "inform_window",
      title: "Note when the certification window started",
      detail:
        "The INFORM Consumers Act certification runs from when you view the certification page, and it is re-certified annually. Record the date you opened it so the deadline is yours and not a guess.",
      critical: true,
    },
    {
      id: "inform_details",
      title: "Confirm the business details you are certifying",
      detail:
        "Bank account, tax identity, business address and contact details all have to match what you have registered. Correct them in your account first if any of them have changed.",
      critical: true,
    },
  ],
  unspecified: [
    {
      id: "confirm_kind",
      title: "Confirm which kind of verification this is",
      detail:
        "This notice mentions verification but does not say whether it wants a document, a call, or a certification. Check the response page in Seller Central — the wording there decides what to prepare.",
      critical: true,
    },
  ],
};

const CLOSING: VerificationStep = {
  id: "record_what_sent",
  title: "Record what you sent and when",
  detail:
    "Keep a note of the date, the document, and any reference number. If the request repeats, this is what shows you already answered it.",
  critical: false,
};

/**
 * Builds the ordered checklist. `parsed` is accepted for future use by callers that already hold a
 * decoded notice; only the raw text is read today.
 */
export function verificationChecklist(
  notice: string,
  parsed?: ParsedNotice,
): { flavour: VerificationFlavour; steps: VerificationStep[] } {
  const flavour = verificationFlavour(parsed?.raw ?? notice);
  return {
    flavour,
    steps: [...COMMON, ...BY_FLAVOUR[flavour], CLOSING],
  };
}

export const VERIFICATION_FLAVOUR_LABELS: Record<VerificationFlavour, string> = {
  video_call: "Video call verification",
  document: "Document verification",
  inform: "INFORM Consumers Act certification",
  unspecified: "Verification — kind not yet clear",
};
