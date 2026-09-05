import { DECODE } from "@/content/marketing";

export type NoticeLikenessScore = 0 | 1 | 2 | 3;

export interface NoticeLikeness {
  score: NoticeLikenessScore;
  hint: string | null;
}

const AMAZON_MARKERS: RegExp[] = [
  /amazon/i,
  /seller central/i,
  /performance notification/i,
  /your account/i,
  /deactivat/i,
  /suspended/i,
  /plan of action/i,
  /\bASIN/i,
  /policy/i,
  /account health/i,
  /selling privileges/i,
  /disbursement/i,
  /intellectual property/i,
  /trademark/i,
  /infringement/i,
  /seller challenge/i,
  /counter.?notification/i,
  /taken down/i,
  /notice of/i,
  /notice:?:?\s/i,
  /suppressed/i,
  /prohibited/i,
];

export function assessNoticeLikeness(text: string): NoticeLikeness {
  const trimmed = text.trim();
  const length = trimmed.length;

  let score: number = 0;
  if (length >= 100) score = 1;
  if (length >= 300) score = 2;
  if (length >= 800) score = 3;

  const hits = AMAZON_MARKERS.filter((re) => re.test(trimmed)).length;
  if (hits >= 2) score = Math.max(score, 2);
  if (hits >= 4) score = Math.max(score, 3);

  const finalScore = (score > 3 ? 3 : score) as NoticeLikenessScore;
  if (hits >= 2) return { score: finalScore, hint: null };

  return {
    score: finalScore,
    hint: DECODE.likenessHint,
  };
}
