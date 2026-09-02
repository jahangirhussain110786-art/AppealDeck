# Drive Templates

This folder holds reusable templates for the Drive workflow skill
(`.agents/skills/drive-workflow/SKILL.md`). Templates are plain `.md` or `.json`
files, read from the repo (not from Drive), and composed in-context by the
agent before one `createGoogleDoc` / `createTextFile` call.

**Convention:** add a new template by adding a file here. Do not add a new
skill. Do not put secrets, PII, or live data in templates — they are committed
to git.

**Current templates:** none. Add only when a real recurring need appears.
