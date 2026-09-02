---
name: drive-quick
description: 1-call Google Drive write of a markdown / text note. Use when the user wants to "drop a note in Drive", "create a quick md file in my Drive", or any intent whose entire output is a single text/markdown file. Skips the wrapper entirely when native google-drive_createTextFile tools are loaded; otherwise uses the long-lived HTTP server via the gdrive.cjs file-arg pattern.
---

# drive-quick

A single-call skill for the smallest Drive intent: "make a markdown / text file in my Drive and tell me the URL."

## When to use
- User says: "create a note in drive", "save this as a md in my drive", "drop a file in drive called X", "write a markdown summary of Y into drive", or any phrasing whose ONLY output is one Drive text/markdown file.
- Output type: `text/plain` or `text/markdown` only. For docs/sheets/slides, use `drive-workflow`.

## When NOT to use
- The user wants a Google Doc, Sheet, or Slides — go to `drive-workflow`.
- The user wants to read or update an existing file — go to `drive-workflow`.
- The user wants to share or organize — go to `drive-workflow`.

## Preferred path (1 call) — native MCP tools
If `google-drive_createTextFile` appears in this session's tool list, call it directly:

```
google-drive_createTextFile(name: "<user-chosen-name>.md", content: "<the markdown>")
```

The content is the markdown the agent composes in this session from the user's prompt + any in-repo context (AGENTS.md, Planning/, etc.). Never re-fetch the same data the agent already has in context.

After success, respond with the file's URL (`https://docs.google.com/document/d/<id>`) — the tool result includes the id.

## Fallback path (1 call) — HTTP server + gdrive.cjs
If native tools are not loaded, the long-lived HTTP server should already be up. Verify with `node scripts/drive-mcp-up.mjs` if needed. Then:

1. Write the JSON params to a temp file (Windows-safe path, no inline JSON).
2. Call: `node .agents/skills/google-drive/gdrive.cjs call createTextFile @<params-file>`
3. Read the response, extract the file id, return the URL.

The params schema for `createTextFile`:
- `name` (string, required) — the file name including `.md` or `.txt` extension
- `content` (string, required) — the file body
- `parentFolderId` (string, optional) — skip unless the user named a folder

## What this skill deliberately does NOT do
- It does not re-read content from Drive that the user already gave the agent. If the user says "summarize the AppealDeck doc", the agent reads the doc ONCE (via `drive-workflow` or directly with the `search` + `getGoogleDocContent` tools), composes the markdown in context, and writes the result with this skill. One read, one write.
- It does not format. Markdown is markdown; no rich-text conversion.
- It does not share. No permission changes.

## Common pitfalls (learned the hard way)
- **PowerShell mangles inline JSON.** Always pass params as a file: `node gdrive.cjs call X @p.json`. The wrapper rejects inline JSON with a clear error.
- **UTF-8 BOM.** If the params file is written by `Set-Content` in PowerShell, it may start with a BOM. The wrapper strips it automatically, but a hand-written `echo > p.json` in PS adds a BOM too. Use `[IO.File]::WriteAllText($p, $json, [Text.UTF8Encoding]::new($false))` if you need a clean UTF-8 file.
- **Don't kill the HTTP server.** It is shared across all Drive actions in this session. If `drive:up` is needed, run it once via the background process tool, never the foreground shell.
