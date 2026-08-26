# AppealDeck Project Context

## What This Is
AppealDeck is a Chrome extension and SaaS project documented across markdown phases. The repo contains planning docs in numbered directories, Paddle billing skills in `.agents/`, and Kilo config in `kilo.json`.

## Setup And Commands
- Dependencies: none required for docs-only work
- If a `package.json` exists later: `npm install`
- Tests: none configured yet
- Lint/typecheck: none configured yet
- Git: repo is initialized with initial commit on `master`

## Boundaries
- Do not edit files in `07-REFERENCE/` without asking
- Do not commit secrets or API keys
- Do not push to remote unless explicitly asked
- Do not run destructive git commands (`push --force`, hard reset, etc.)

## Sensitive Files
- `.env`, `.env.*`, `credentials.json`, any file with `secret` or `key` in name

## Coding Style
- Match existing conventions in whatever file you edit
- Prefer minimal, surgical changes
- Do not add comments unless asked

## Expected Handoff
- After non-trivial work, summarize what changed and what was validated
- If something failed, state the exact error and the most likely fix

## When To Stop And Ask
- Ambiguous requirements with broad blast radius
- Changes to auth, billing, encryption, migrations, or deployment
- Any external send, purchase, or deletion
- Multiple valid approaches with no clear best choice