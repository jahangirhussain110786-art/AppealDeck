import {
  Archive,
  BookOpen,
  Copyright,
  FilePenLine,
  Fingerprint,
  FolderOpen,
  ListChecks,
  MessagesSquare,
  RefreshCcw,
  Scale,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

/**
 * One glyph per page, so a seller recognises a notice type before reading a word. Keyed by slug;
 * anything new falls back to the open book rather than going without a mark.
 */
export const PAGE_MARKS: Record<string, LucideIcon> = {
  "section-3": ShieldAlert,
  "plan-of-action": FilePenLine,
  "identity-verification": Fingerprint,
  "ip-complaint": Copyright,
  "appeal-denied": RefreshCcw,
  "inauthentic-complaint": Archive,
  "account-at-risk": ShieldAlert,
  "plan-of-action-examples": BookOpen,
  "chatgpt-for-amazon-appeals": MessagesSquare,
  "appealspro-alternative": Scale,
  "keep-the-notice-as-it-arrived": Archive,
  "answering-a-questionnaire": ListChecks,
  "what-to-keep-after-you-submit": FolderOpen,
};

export const PAGE_MARK_FALLBACK = BookOpen;
