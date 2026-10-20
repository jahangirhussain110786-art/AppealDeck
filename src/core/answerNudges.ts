/**
 * A plain check of the tone of a seller's written answer (20 Oct 2026, from a live session).
 *
 * A seller who has just lost a listing writes what they feel: that it is unfair, that the rights
 * owner is a bully, that they will sue. Nothing in the free part of the product said that none of
 * that helps, so it was found out only after paying for a draft that carried it. The root-cause
 * coach already does this for the Plan of Action; this is the same idea for every other answer.
 *
 * Deterministic, never blocks, never claims to know what a reviewer will think. The advice is
 * attributed to the people who give it, as the coach does, and it names the words it found so the
 * seller can see exactly what it is talking about.
 */

export interface AnswerNudge {
  id: "threat" | "venting" | "demand";
  /** The words found, quoted from the seller's own text. */
  found: string[];
}

const THREAT =
  /\b(?:sue|sued|suing|lawsuit|legal action|see you in court|take you to court|report you to)\b/gi;
const VENTING =
  /\b(?:unfair|bully|bullying|bullies|ashamed|scam|ridiculous|outrageous|disgusting|corrupt|stupid|idiots?|pathetic|incompetent)\b/gi;
const DEMAND =
  /\b(?:put (?:it|my listing|my account|them) back|reinstate (?:it|me|my (?:listing|account)) (?:right now|immediately|today)|(?:right now|immediately|asap|at once))\b/gi;

function found(pattern: RegExp, text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(pattern)) out.add(m[0].toLowerCase());
  return [...out].slice(0, 4);
}

export function assessAnswerTone(text: string): AnswerNudge[] {
  if (text.trim().length < 20) return [];
  const nudges: AnswerNudge[] = [];
  const threat = found(THREAT, text);
  if (threat.length) nudges.push({ id: "threat", found: threat });
  const venting = found(VENTING, text);
  if (venting.length || /!{2,}/.test(text)) nudges.push({ id: "venting", found: venting });
  const demand = found(DEMAND, text);
  if (demand.length) nudges.push({ id: "demand", found: demand });
  return nudges;
}

/** The words shown for each nudge, in one place so the page and the critic say the same thing. */
export const TONE_COPY = {
  found: "We noticed: {words}.",
  threat: {
    title: "Leave out the legal threat.",
    body: "Appeal writers advise against it: a response that threatens is read as a dispute and gives the reviewer nothing to act on. If you need a lawyer, that is a separate step, and nothing you write here is private.",
  },
  venting: {
    title: "Keep to facts.",
    body: "Words like “unfair” or “bullying” give the reviewer nothing to check. Say what you made or bought, from whom, and when.",
  },
  demand: {
    title: "Ask once, calmly, at the end.",
    body: "A demand to put the listing back does not help. Say what the documents show and ask for the review in one sentence.",
  },
} as const;
