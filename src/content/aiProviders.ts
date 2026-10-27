/**
 * The AI providers AppealDeck may send text to (27 Oct 2026): one list that the privacy policy, the
 * short privacy cards and the FAQ read, and that the code checks before it calls anyone.
 *
 * Why it exists. The product's pages say "AI", not a company, because which provider answers is a
 * decision that can change. The privacy policy cannot be that vague: a seller deciding whether to
 * upload an invoice is entitled to know who receives it, and what that company says it does with it.
 * So the names live here, once, with the date each provider's terms were last checked, and
 * `src/lib/llm/ai.ts` refuses to call a provider in production unless it is `listed` below. A
 * provider can therefore never receive a seller's text without first appearing in the policy.
 *
 * To add or switch a provider:
 * 1. Read its API data terms yourself and write what it states into `dataTerms`, with the date in
 *    `verifiedOn`. Do not copy another provider's sentence: terms differ.
 * 2. Set `listed: true`. The policy, the cards and the tests follow.
 * 3. Set its key and its `*_PRODUCTION_CONFIRMED=true` in the host's environment, and name the
 *    order in `AI_PROVIDERS` (see docs/DEPLOYMENT.md §6b).
 *
 * Nothing here says which provider is first in line: that is deployment configuration, and the
 * policy describes every listed provider as one the service may use.
 */

export type AiProviderId = "gemini" | "anthropic" | "openai" | "groq";

export interface AiProviderEntry {
  id: AiProviderId;
  /** How the policy names it. */
  name: string;
  /** The company behind it, for the data-transfer paragraph. */
  company: string;
  /** Whether it may receive a document (an invoice, a scan), or text only. */
  readsDocuments: boolean;
  /** Written into the policy. Null until a person has read the provider's terms (never guessed). */
  dataTerms: string | null;
  /** The day those terms were last read, as YYYY-MM-DD. */
  verifiedOn: string | null;
  /** Only a listed provider may be called in production, and only a listed one is in the policy. */
  listed: boolean;
}

export const AI_PROVIDERS: readonly AiProviderEntry[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    company: "Google",
    readsDocuments: true,
    // Verified against Google's paid-tier terms on 22 Sep 2026; the 55-day figure is Google's own.
    dataTerms:
      "on the paid tier we use, Google states it does not use prompts or responses to improve its products, and logs them for up to 55 days solely to detect abuse of its service. If Google changes those terms, this page changes with them",
    verifiedOn: "2026-09-22",
    listed: true,
  },
  {
    id: "groq",
    name: "Groq",
    company: "Groq",
    readsDocuments: false,
    dataTerms: null,
    verifiedOn: null,
    listed: true,
  },
  // Built and tested against the provider's published request format, not live. Not listed, so it
  // cannot run in production: read its API data terms first (step 1 above).
  {
    id: "anthropic",
    name: "Claude",
    company: "Anthropic",
    readsDocuments: true,
    dataTerms: null,
    verifiedOn: null,
    listed: false,
  },
  {
    id: "openai",
    name: "OpenAI",
    company: "OpenAI",
    readsDocuments: true,
    dataTerms: null,
    verifiedOn: null,
    listed: false,
  },
];

export function listedProviders(): AiProviderEntry[] {
  return AI_PROVIDERS.filter((provider) => provider.listed);
}

export function isProviderListed(id: string): boolean {
  return AI_PROVIDERS.some((provider) => provider.id === id && provider.listed);
}

/** "Google Gemini and Groq", "A, B and C": the way the policy lists the providers. */
export function listedProviderNames(): string {
  const names = listedProviders().map((provider) => provider.name);
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** The companies, for the paragraph about processing outside the seller's country. */
export function listedCompanyNames(): string {
  const companies = [...new Set(listedProviders().map((provider) => provider.company))];
  if (companies.length <= 1) return companies.join("");
  return `${companies.slice(0, -1).join(", ")} and ${companies[companies.length - 1]}`;
}
