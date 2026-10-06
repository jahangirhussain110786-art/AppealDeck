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
  // "policies" as well (29 Sep 2026): "a serious violation of our policies" matched nothing.
  /polic(?:y|ies)/i,
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
  // 6 Oct 2026: a short genuine notice ("To verify your identity, enter the verification code… Upload
  // a government-issued ID within 7 days.") carried one marker at most and was refused. These are
  // phrases only an Amazon-style message about a seller's account uses together.
  /verify your identity/i,
  /government[\s-]issued/i,
  /\bappeal/i,
  /reinstat/i,
  /root cause/i,
  /seller account/i,
  /your listings?\b/i,
];

/**
 * How many Amazon-notice markers the text carries. Shared with `/api/decode`'s prefilter
 * (29 Sep 2026), which kept its own six-marker list and so refused a genuine short notice about
 * falsified documents — the one kind of case D6 routes to professional help — that this page's own
 * check accepted. One list now decides both.
 */
export function noticeMarkerHits(text: string): number {
  const trimmed = text.trim();
  return AMAZON_MARKERS.filter((re) => re.test(trimmed)).length;
}

export function assessNoticeLikeness(text: string): NoticeLikeness {
  const trimmed = text.trim();
  const length = trimmed.length;

  let score: number = 0;
  if (length >= 100) score = 1;
  if (length >= 300) score = 2;
  if (length >= 800) score = 3;

  const hits = noticeMarkerHits(trimmed);
  if (hits >= 2) score = Math.max(score, 2);
  if (hits >= 4) score = Math.max(score, 3);

  const finalScore = (score > 3 ? 3 : score) as NoticeLikenessScore;
  if (hits >= 2) return { score: finalScore, hint: null };

  return {
    score: finalScore,
    hint: DECODE.likenessHint,
  };
}
