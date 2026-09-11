# Kilo Upgrade Guide

Complete reference for upgrading Kilo (kilo.ai — VS Code / JetBrains / CLI, built on the OpenCode
agent core) into a deeply grounded, budget-disciplined, MCP-connected setup that behaves like Claude
Fable 5: verifies before asserting, compares before committing, executes autonomously, and asks at the
right boundary. Applies globally, to any project — not just AppealDeck.

Compiled 2026-08-26.

---

## 0. Reality check — what Kilo actually is now

Kilo has moved past "a VS Code extension." It's now a unified product (VS Code + JetBrains + CLI +
cloud agents), configured through one `kilo.jsonc` / `kilo.json` file, with a gateway that routes to
500+ models. Everything in this guide is grounded in that current architecture — verified against
Kilo's own docs and its config-reference source, not assumed from the older Roo/Cline-era extension.

---

## 1. Immediate fix — exposed secret in this project

[kilo.json](kilo.json) has a Paddle sandbox API key hardcoded in plaintext in the `paddle-sandbox` MCP
entry. Two facts make this worth fixing now:

- Kilo's security model **ignores `{env:VAR}` templating in project-level `kilo.json`** — env
  resolution only happens in trusted config locations (global config, `KILO_CONFIG`, or
  org-managed config). Swapping to `{env:...}` in the project file alone does nothing.
- The fix is to move the server definition to **global** config, where env resolution is honored.

```powershell
setx PADDLE_SANDBOX_KEY "pdl_sdbx_apikey_..."
```
(paste your real sandbox key; open a new terminal after, for it to take effect)

`C:\Users\Hawlton Alliance\.config\kilo\kilo.jsonc`
```jsonc
{
  "$schema": "https://app.kilo.ai/config.json",
  "mcp": {
    "paddle-sandbox": {
      "type": "remote",
      "url": "https://sandbox-mcp.paddle.com/mcp",
      "headers": { "Authorization": "Bearer {env:PADDLE_SANDBOX_KEY}" },
      "enabled": true
    }
  }
}
```

Then strip the `Authorization` header out of the `paddle-sandbox` block in the project's `kilo.json` —
the global entry deep-merges over it. `paddle-live` and `paddle-docs` carry no secrets, so they can
stay in the project file as-is.

---

## 2. Scope architecture — global vs project

| Scope | Location | Holds |
|---|---|---|
| **Global** (every project) | `C:\Users\Hawlton Alliance\.config\kilo\` | How Kilo thinks & behaves, generic MCP servers, agent roster, secrets |
| **Project** (this repo only) | `V:\AppealDeck1\kilo.json`, `.kilo\` | Paddle MCP servers, `.agents/skills` path, anything AppealDeck-specific |

| File | Purpose |
|---|---|
| `~/.config/kilo/kilo.jsonc` | mcp servers, compaction, permission defaults, agent model/reasoning overrides |
| `~/.config/kilo/AGENTS.md` | **Always loaded, cannot be disabled** — the core behavior contract (Section 4) |
| `~/.config/kilo/rules/*.md` | Modular, toggleable rule files, referenced via `instructions` array |
| `~/.config/kilo/agent/*.md` | Global custom agents/subagents (Section 7) |

Keep AppealDeck's own `kilo.json` minimal from here on — project-specific MCP servers and skills only.
Everything about *how* Kilo thinks belongs globally, set once.

---

## 3. Pillar 1 — MCP ecosystem (zero local hosting)

Every server below is a thin Node/HTTP process — none hosts a model, none strains the machine.

**Already built in, zero config:**

| Built-in | What it gives you |
|---|---|
| `websearch` | Web search routed through Exa/Parallel — free when signed into Kilo |
| `webfetch` | Fetch + render any URL |
| Playwright (MCP, built-in) | Real browser automation — the "real-time inspect / verify" tool |

**Add globally** (`~/.config/kilo/kilo.jsonc`):

```jsonc
"mcp": {
  "sequentialthinking": {          // forces step-by-step reasoning as tool calls
    "type": "local",
    "command": ["npx", "-y", "@modelcontextprotocol/server-sequential-thinking"],
    "enabled": true
  },
  "memory": {                      // persistent knowledge graph across sessions
    "type": "local",
    "command": ["npx", "-y", "@modelcontextprotocol/server-memory"],
    "enabled": true
  },
  "context7": {                    // pulls current library/framework docs — kills API hallucination
    "type": "local",
    "command": ["npx", "-y", "@upstash/context7-mcp"],
    "enabled": true
  },
  "github": {                      // repo/PR/issue ops on any repo you push
    "type": "local",
    "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
    "environment": { "GITHUB_TOKEN": "{env:GITHUB_TOKEN}" },
    "enabled": true
  }
}
```

From the official marketplace (`kilo mcp add <name>`, or browse
[Kilo-Org/kilo-marketplace](https://github.com/Kilo-Org/kilo-marketplace)) — 100+ servers available,
notably: `firecrawl`, `tavily`, `brave-search`, `kagi`, `exa` (alternates/second sources for
verification), `figma-dev-mode`, `notion`, `gdrive`, `slack`, `postgres`/`sqlite`, `stripe`.

Marketplace **agents** (drop-in, not build-your-own) map directly to a planner/executor/verifier
split: `architect`, `code-reviewer`, `code-simplifier`, `code-skeptic`, `frontend-specialist`,
`test-engineer`, `docs-specialist`. `code-skeptic` is built specifically to argue against a claim, not
confirm it — the "verifies and authenticates" role.

This project isn't a git repo yet. Run `git init` — it unlocks Kilo's checkpoints, the `git`/`github`
MCP servers, and `agent_manager` worktree sessions.

---

## 4. Pillar 2 — the "think like Fable" contract

Fable's edge isn't a secret prompt trick — it's three disciplined habits: **verify before asserting,
compare before committing, act autonomously but hand off at the right boundary.** Encode those
directly, globally, so they apply everywhere:

`C:\Users\Hawlton Alliance\.config\kilo\AGENTS.md`
```markdown
# Global operating contract — applies to every project

## Grounded reasoning (non-negotiable)
- Never state a fact you haven't verified when a tool could verify it. If you're recalling something
  from training rather than a tool result, say "from memory, unverified" — don't present it as checked.
- For anything involving current prices, APIs, library versions, docs, or live site behavior: use
  websearch/webfetch/context7/playwright BEFORE answering, not after being challenged.
- When you cite a claim, name the source (URL, file, command output). No source = flag it as unverified.

## Best-possible-solution seeking
- For any non-trivial decision (architecture, library choice, approach), briefly weigh 2-3 real options
  and state why you picked one — don't default to the first plausible answer.
- Don't pad this into an essay. One line per option, one line for the pick. Then move.

## Reasoning discipline (budget-conscious)
- Plan in ≤5 bullets before acting. State it once, don't restate it.
- Bullets, not prose, for internal reasoning. No preamble, no "let me think about this."
- One scoped task per turn. Finish, report one line, stop — don't chain unrelated work silently.

## Autonomy boundary
- Proceed without asking on: reading, searching, drafting, local file edits, reversible steps.
- ALWAYS stop and ask (use the `question` tool) before: sending anything externally, spending money,
  deleting data, changing account/security settings, or any step you can't undo.
- Don't over-ask on trivial matters either — asking permission for every read is its own failure mode.
  Ask when it's genuinely irreversible or ambiguous, not by default.

## Sign-in / auth / payment handoff
- You NEVER type a password, card number, OTP, or API key into a page yourself, even if the user
  pasted it into chat.
- When a task needs the user signed in: use Playwright to navigate to the exact login/checkout page,
  describe what's on screen, then stop with the `question` tool: "I've opened <page> — please sign in
  / complete this, then tell me to continue." Wait for their reply before proceeding.
- If a browser profile is already authenticated (system Chrome, existing session), just proceed and
  say what you did — no need to ask again for the same already-open session.
```

Model-level reasoning controls, layered on top (`~/.config/kilo/kilo.jsonc`):
```jsonc
"agent": {
  "orchestrator": { "thinking": { "type": "enabled", "budgetTokens": 4000 } },  // Claude-class models
  "executor":      { "reasoningEffort": "low" }                                // GPT/xAI/Venice-class
}
```

Routing tiers (zero-config lever):

| Tier | Behavior |
|---|---|
| `kilo-auto/efficient` | Classifies task difficulty live, routes to the cheapest model proven accurate enough |
| `kilo-auto/frontier` | Routes to top-tier models — architecture, hard debugging, research |
| `kilo-auto/free` | Free rotation — throwaway exploration, compaction summaries |

---

## 5. Browser config for the sign-in handoff

`Settings → Web Tools → Browser Automation`, or in global `kilo.jsonc`:
```jsonc
"browser": {
  "headless": false,        // default is already off — keep it off; a hidden browser can't be signed into
  "use_system_chrome": true // reuses your real, already-logged-in Chrome profile when possible
}
```
With `use_system_chrome: true`, Playwright often lands already-authenticated (Google, GitHub, Amazon,
etc. if that Chrome profile is logged in) — no handoff needed, it proceeds and says what it did. Where
it hits a page you're not logged into, the AGENTS.md rule above kicks in: it opens the page, visibly,
and asks.

---

## 6. Pillar 3 — stop mid-response cutoffs

The ceiling is a max-output-tokens setting per mode/model. Kilo's own guidance: keep Code-mode output
≤16k tokens, raise it only for Architect/Debug where long reasoning is genuinely needed. Three real
fixes:

1. **Use the `edit` tool, not `write`, for existing files.** `edit` emits a diff-sized patch; `write`
   reprints the whole file. Most mid-code cutoffs are the model re-emitting a whole file it didn't need
   to touch in full.
2. **Split by subagent, not by hoping one response fits.** The orchestrator pattern (Section 7) means
   each subagent's output only covers its own scoped step — a 500-line feature becomes 5 subagent turns
   of ~100 lines each, each well under any ceiling.
3. **Raise the ceiling explicitly where a long single-shot output is genuinely needed:**
```jsonc
"agent": {
  "docs-specialist": { "options": { "max_tokens": 32000 } }
}
```
Check `kilo.ai/docs/code-with-ai/agents/custom-models` for the exact field name per provider — most use
`max_tokens`; Anthropic-family models route it through the `thinking`/`max_output_tokens` pair together.

---

## 7. Global agent roster

Living in `~/.config/kilo/agent/`, usable from any project.

`orchestrator.md`
```yaml
---
description: Plans work and delegates to specialist subagents. Never writes code directly.
mode: primary
model: kilo-auto/frontier
temperature: 0.2
steps: 20
---
You are a planning-only orchestrator.
1. Restate the goal in one sentence.
2. Produce a numbered plan, max 7 steps.
3. Delegate each step via @architect, @researcher, @executor, @code-skeptic, or @test-engineer.
4. Never write implementation code yourself — delegate it.
5. Stop and report after each delegated step completes; do not chain silently.
```

`researcher.md`
```yaml
---
description: Deep, source-verified research on any topic — used before committing to an approach.
mode: subagent
model: kilo-auto/frontier
temperature: 0.2
---
You research to ground a decision, not to summarize the internet.
- Pull from multiple independent sources (websearch + webfetch + context7 as relevant); note where they
  disagree.
- Prefer primary sources (official docs, source code, the actual site) over blogs about the thing.
- Deliverable: a short comparison with a recommendation and your confidence level — not a literature dump.
```

`executor.md`
```yaml
---
description: Implements one scoped change at a time.
mode: subagent
model: kilo-auto/efficient
temperature: 0.1
steps: 15
---
You implement exactly the scope you were given — no more.
- Use the edit tool for existing files (never re-paste unchanged code).
- One logical change per turn. Stop and report when it's done; do not continue to the next file unprompted.
- If a fact about an external API/library is uncertain, use context7 or websearch and cite the source.
  Never state an unverified claim as fact — say "unverified" instead.
```

`code-skeptic.md`
```yaml
---
description: Adversarially checks a completed change for bugs, unverified claims, and scope creep. Cannot edit files.
mode: subagent
model: kilo-auto/frontier
permission: { edit: deny, bash: { "*": deny, "git diff*": allow, "git log*": allow } }
---
Your job is to find what's wrong, not to confirm it's fine. Check: does every factual claim have a
verified source? Does the diff match the stated scope? What breaks it?
```

Also worth pulling straight from the marketplace rather than hand-rolling: `architect`,
`code-reviewer`, `code-simplifier`, `frontend-specialist`, `test-engineer`, `docs-specialist`.

---

## 8. Pillar 4 — session and context management

**Compaction** (`~/.config/kilo/kilo.jsonc`):
```jsonc
"compaction": {
  "auto": true,
  "threshold_percent": 80,      // compact at 80% of window instead of waiting for the wall
  "prune": true,                // clear stale tool output (>40k tokens old) between turns
  "tail_turns": 2,              // keep the last 2 turns verbatim, always
  "reserved": 20000
},
"agent": {
  "compaction": { "model": "kilo-auto/free" }   // summarizing is cheap work — don't burn frontier tokens on it
}
```
Manual control: `/compact` any time, to force it before hitting the wall.

**Scoping what enters context** — large planning/reference trees shouldn't auto-flood every session:
```jsonc
"permission": {
  "read": {
    "07-REFERENCE/**": "ask",   // asks before pulling in reference docs, rather than auto-loading them
    "*": "allow"
  }
}
```
Pull specific docs in deliberately with `@07-REFERENCE/02-COMPETITOR-DOSSIER.md` when a task actually
needs them.

**Session commands:**
```bash
kilo session list --search "paddle"     # find a past session by title
kilo session --session <id> --fork      # branch a specific past session forward
```
Forking gives the whole prior transcript continued as new — useful, but not "summon a slice by name
into today's unrelated task."

**"Summon by name" — the pattern that actually delivers this:** Kilo has no single command that merges
transcript B into a different live session A. What does deliver it — and is what Kilo's own
rules/AGENTS.md system is built for — is a **named memory bank**: at the end of a session, have the
agent write a distilled summary to a file; in any future session, summon it by `@`-mentioning that
file, by name.

```
.kilo/memory/
  paddle-billing-integration.md
  amazon-poa-appeal-flow.md
  competitor-positioning.md
```
```markdown
# End of session
Write a summary of this session's key decisions, open questions, and file locations to
`.kilo/memory/paddle-billing-integration.md`. Keep it under 300 words.
```
Next session: `@.kilo/memory/paddle-billing-integration.md let's continue this` — that *is*
summon-by-name, provider-agnostic, version-controlled, near-zero tokens to load versus forking a full
transcript. Combine with the `memory` MCP server (Section 3) for facts that should persist
automatically without a manual write-up.

---

## 9. Action checklist

- [ ] `setx PADDLE_SANDBOX_KEY "..."` then remove the hardcoded key from project `kilo.json`
- [ ] Create `~/.config/kilo/kilo.jsonc` with the mcp servers, compaction, and permission blocks above
- [ ] Create `~/.config/kilo/AGENTS.md` with the Fable behavior contract
- [ ] Set `browser.headless: false` and `browser.use_system_chrome: true`
- [ ] Create the global agent roster in `~/.config/kilo/agent/`
- [ ] `git init` in AppealDeck to unlock checkpoints and git-aware MCP servers
- [ ] Start using `.kilo/memory/*.md` for cross-session continuity, by name
