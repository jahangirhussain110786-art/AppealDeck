# MCPs Essential List
**AppealDeck — Essential MCPs for Autonomous Operation**
*All listed MCPs are FREE (open source or free-tier) unless noted. No credit-card-required items.*

---

## Legend
- ✅ **Already Installed** — MCP is configured in `kilo.json` and active
- 🔧 **Must Add** — Missing from current setup, required for core workflow
- 🚀 **Add Immediately** — High ROI for AppealDeck-specific workflows
- ⏳ **Add When Needed** — Useful but not urgent for solo-founder stage

---

## Already Installed (Current `kilo.json`)

| MCP | Status | Notes |
|-----|--------|-------|
| Google Drive MCP | ✅ Active | Remote HTTP on `127.0.0.1:3100`; 116 tools |
| Filesystem MCP | ✅ Active | Stdio via `@modelcontextprotocol/server-filesystem` |
| Fetch MCP | ✅ Active | Stdio via `@modelcontextprotocol/server-fetch` |
| Memory MCP | ✅ Active | Stdio basic memory; consider upgrading to Mem0 |
| Sequential Thinking MCP | ✅ Active | Stdio via `@modelcontextprotocol/server-sequential-thinking` |
| Time MCP | ✅ Active | Stdio via `@modelcontextprotocol/server-time` |
| DuckDuckGo MCP | ✅ Active | Stdio search; can be replaced by Brave Search |
| Paddle Sandbox/Live/Docs | ✅ Active | Remote MCPs for Paddle billing integration |

---

## Core Section — Must Have (16)

These form the foundation of autonomous operation. Any missing items here should be installed immediately.

| # | MCP | Cost | Status | AppealDeck Use Case |
|---|-----|------|--------|---------------------|
| 1 | **Terminal MCP** | FREE | 🔧 Must Add | Run shell commands, builds, tests, npm scripts |
| 2 | **Filesystem MCP** | FREE | ✅ Installed | Bulk read/write across repo |
| 3 | **GitHub MCP** | FREE | 🔧 Must Add | PRs, issues, repo management, CI/CD |
| 4 | **Git MCP** | FREE | 🔧 Must Add | Local version control (commit, branch, diff) |
| 5 | **Vercel MCP** | FREE tier | 🔧 Must Add | Deploy, logs, env vars, edge functions |
| 6 | **Supabase MCP** | FREE | 🔧 Must Add | Database ops, auth, RLS, migrations |
| 7 | **Postgres/SQLite MCP** | FREE | 🔧 Must Add | Raw SQL queries when Supabase MCP is insufficient |
| 8 | **Google Drive MCP** | FREE | ✅ Installed | Document storage, 116 tools, HTTP transport |
| 9 | **Email MCP (Gmail/IMAP/SMTP)** | FREE | 🔧 Must Add | Client emails, support, transactional mail |
| 10 | **Playwright MCP** | FREE | 🔧 Must Add | E2E tests, Chrome extension debugging, browser automation |
| 11 | **Browser-Use MCP** | FREE | 🔧 Must Add | Autonomous Chrome control for Seller Central, scraping |
| 12 | **Browser MCP** | FREE | 🔧 Must Add | Lightweight browser interaction, DOM reading |
| 13 | **Sentry MCP** | FREE tier | 🔧 Must Add | Error tracking (5K errors/mo free) |
| 14 | **PostHog MCP** | FREE tier | 🔧 Must Add | Analytics, feature flags, session replay |
| 15 | **Refactor MCP** | FREE (Open Source MIT) | 🔧 Must Add | Automated codebase refactoring, analysis |
| 16 | **Mem0 MCP** | FREE Hobby tier | 🔧 Must Add | Persistent long-term memory across sessions; replaces basic Memory MCP |

---

## Add Immediately Section — AppealDeck-Specific (4)

High-ROI additions for POA processing, scheduling, and workflow automation.

| # | MCP | Cost | Status | AppealDeck Use Case |
|---|-----|------|--------|---------------------|
| 17 | **PDF/OCR MCP** | FREE (Open Source) | 🚀 Add Immediately | POA document text extraction, parsing, scanned PDF digitization |
| 18 | **Sequential Thinking MCP** | FREE | ✅ Installed | Multi-step reasoning for POA composition, planning, complex decisions |
| 19 | **Brave Search MCP** | FREE tier | 🚀 Add Immediately | Web research for Amazon policies, legal precedents, competitor analysis |
| 20 | **Cal.com MCP** | FREE (Open Source) | 🚀 Add Immediately | Client call scheduling, booking management, demo coordination |

---

## Add When Specific Need Arises (3)

| # | MCP | Cost | Status | AppealDeck Use Case |
|---|-----|------|--------|---------------------|
| 21 | **Qdrant MCP** | FREE tier | ⏳ Add Later | RAG for encrypted vault; semantic search across POA templates |
| 22 | **Langfuse MCP** | FREE tier | ⏳ Add Later | AI observability; trace LLM calls for POA generation quality |
| 23 | **n8n MCP** | FREE (Self-hosted) | ⏳ Add Later | Workflow automation; email → POA → billing pipelines |

---

## Key Decisions & Notes

### Brave Search vs. Browser MCPs
**Question:** With Playwright, Browser-Use, and Browser MCP installed, is Brave Search necessary?

**Answer:** **Yes, they serve different purposes.**
- **Playwright/Browser-Use/Browser MCP** = *action* (navigate pages, click buttons, fill forms, scrape rendered content)
- **Brave Search** = *discovery* (get search results instantly without browser overhead)

For AppealDeck, you need both: Brave Search for fast research on Amazon policies and legal precedents, and Browser MCPs for interacting with Seller Central and scraping dynamic content.

### Email MCP: Gmail vs. IMAP/SMTP
- **Current:** No dedicated email MCP installed (DuckDuckGo and Fetch can read public pages only)
- **Recommendation:** Install an IMAP/SMTP email MCP (e.g., `email-smtp-imap-mcp` or `mcp-server-email`) for multi-provider support (Gmail, Outlook, custom SMTP). More flexible than Gmail-only MCP.

### Mem0 vs. Basic Memory MCP
- **Current:** Basic `@modelcontextprotocol/server-memory` is installed (simple key-value store)
- **Upgrade:** Replace with Mem0 MCP for persistent, semantic memory across sessions. Mem0 offers:
  - 10K add requests/mo free
  - 1K retrieval/mo free
  - Self-hostable for unlimited usage

### Paddle Integration
- Paddle is covered by 3 remote MCPs (sandbox, live, docs) + Node SDK in webhook/checkout code. No additional MCP needed.

### Amazon Seller Central
- No dedicated Seller Central MCP exists. Covered by **Browser-Use + Playwright** for automation and scraping. This is the standard approach until an official MCP is released.

---

## Current Gap Summary

| Gap | MCP to Install | Priority |
|-----|---------------|----------|
| No email client | Email MCP (IMAP/SMTP) | 🔧 Core |
| No code search/PR management | GitHub MCP + Git MCP | 🔧 Core |
| No deploy management | Vercel MCP | 🔧 Core |
| No database admin | Supabase MCP + Postgres MCP | 🔧 Core |
| No persistent semantic memory | Mem0 MCP (replace basic Memory) | 🔧 Core |
| No code refactoring | Refactor MCP | 🔧 Core |
| No PDF/OCR | PDF/OCR MCP | 🚀 Immediate |
| No scheduling | Cal.com MCP | 🚀 Immediate |
| No search API | Brave Search MCP | 🚀 Immediate |

**Total MCPs listed:** 23 (7 currently installed + 16 to add)
