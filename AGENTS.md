# AppealDeck Project Context

## What This Is
AppealDeck is a Chrome extension and SaaS project documented across markdown phases. The repo contains planning docs in numbered directories, Paddle billing skills in `.agents/`, and Kilo config in `kilo.json`.

## Tech Stack (Modern Web-Stack)
- **Frontend**: React 18+ with TypeScript, Next.js App Router
- **Styling**: Tailwind CSS (utility-first, no inline styles)
- **Components**: shadcn/ui primitives as base components
- **Animations**: Framer Motion (subtle, purposeful motion)
- **Icons**: Lucide icons
- **State**: React hooks + Context (Zustand if complex state needed)
- **API**: Server Actions, Route Handlers, Paddle SDK for billing

## Design & UI/UX Standards
- **Aesthetic**: Clean, modern, premium feel — whitespace-driven, subtle depth
- **Dark mode first**, light mode via system preference
- **Mobile-first responsive**: 320px → 768px → 1024px → 1440px
- **Micro-interactions**: hover lift, card scale, button feedback
- **Loading/empty/error states required** on every screen
- **Accessibility**: semantic HTML, ARIA labels, keyboard nav, focus rings, WCAG AA contrast
- **Component patterns**: composable, `cn()` for conditional classes, forward refs

## Setup And Commands
- Dependencies: `npm install` when package.json exists
- Dev: `npm run dev`
- Build: `npm run build`
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
- Use `edit` tool for existing files (never re-paste unchanged code)

## Expected Handoff
- After non-trivial work, summarize what changed and what was validated
- If something failed, state the exact error and the most likely fix

## When To Stop And Ask
- Ambiguous requirements with broad blast radius
- Changes to auth, billing, encryption, migrations, or deployment
- Any external send, purchase, or deletion
- Multiple valid approaches with no clear best choice
