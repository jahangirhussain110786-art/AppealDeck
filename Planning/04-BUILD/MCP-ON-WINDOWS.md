# Adding a New MCP Server (on Windows) — Decision Record

**Owner:** Founder. **Status:** Settled 1 Sep 2026 after the Google Drive stdio outage.
**TL;DR:** On Windows + Kilo, prefer `type: "remote"` against a long-lived local HTTP endpoint over stdio. If stdio is unavoidable, use `cmd /c npx ...` AND verify with a fresh session.

---

## 1. The Windows problem (what bit us on 1 Sep 2026)

Kilo's stdio MCP loader on Windows was unreliable for the
`@piotr-agier/google-drive-mcp` server. The package declared in `kilo.json` as
`"command": "npx", "args": ["-y", "@piotr-agier/google-drive-mcp"]` would
either:

- silently fail to start (no error surfaced), so no `google-drive_*` tools
  appeared in the session tool list, OR
- start but lose the stdio pipe mid-handshake, so `tools/list` returned
  zero tools.

The team tried wrapping the command in `cmd /c npx ...`. This fixed some
failures but caused others: the extra `cmd.exe` layer sometimes held the
stdio handle open after the npx child exited, which made the parent shell
hang for the full 120s timeout and then kill the whole process tree — taking
the actual server down with it.

**Root cause (high confidence):** Node `child_process.spawn` on Windows with
`stdio: 'pipe'` does not reliably detach a deeply nested npx → cmd → node
process tree. The stdio transport assumes a clean 1:1 parent ↔ child
relationship that Windows job-object semantics keep disrupting.

**Verdict:** do not use stdio for new MCPs on Windows. Use HTTP.

---

## 2. The fix that works (Streamable HTTP)

The `@piotr-agier/google-drive-mcp` server supports Streamable HTTP as a
first-class transport (verified in its README and `docs/clients.md`):

```bash
npx -y @piotr-agier/google-drive-mcp start --transport http --port 3100
# -> listens on http://127.0.0.1:3100/mcp
```

Kilo supports `type: "remote"` MCP servers natively (it already uses this
for the three Paddle MCPs in `kilo.json`):

```json
"google-drive": {
  "type": "remote",
  "url": "http://127.0.0.1:3100/mcp",
  "enabled": true
}
```

A long-lived HTTP server has no parent-child pipe to break, no npx-per-call
cost, and per-call latency of ~100ms (vs 3-5s for a fresh stdio spawn).

---

## 3. The lifecycle problem (and how we solved it)

Long-lived means someone has to start it. Two approaches:

| Approach | Pros | Cons |
|---|---|---|
| Auto-start in the Kilo session hook | Zero manual work | Hook surface in kilo.json is minimal; depends on Kilo version |
| Explicit `npm run drive:up` at session start | Visible, auditable, restartable | User has to remember (or the agent has to check) |

We chose **explicit** and codified it in `scripts/drive-mcp-up.mjs` +
`scripts/drive-mcp-up.cmd` + the `drive:up` / `drive:down` npm scripts.
The `.cmd` wrapper uses `start "" /B` so the npm parent can exit immediately
without the Windows job-object issue. The `.mjs` script then polls for
readiness and writes the discovered PID to `.drive-mcp.pid`.

`drive:down` kills the server three ways for robustness: by saved pid, by
anything listening on the port, and by `wmic` matching the package name in
the command line.

---

## 4. The "if you MUST use stdio" playbook

Sometimes the MCP server only ships stdio (e.g. older packages, or ones
that have not been updated to support Streamable HTTP). In that case:

1. **Always wrap in `cmd /c npx ...`** in `kilo.json`:
   ```json
   "mcp-foo": {
     "type": "stdio",
     "command": "cmd",
     "args": ["/c", "npx", "-y", "<package>"],
     "enabled": true
   }
   ```
2. **Verify in a fresh session.** Restart the Kilo CLI. Confirm the
   `mcp_foo_*` tools appear in the tool list. If they don't:
   - Check `~/.config/<package>/` for auth/credentials files.
   - Check `%APPDATA%\npm\_logs\` and the package's own stderr.
   - Run the server manually (`npx -y <package>`) and look for errors.
3. **Add a "verify" line to `AGENTS.md` Current Project State** so future
   sessions know what good looks like.

Do not assume stdio will keep working. The failure mode is silent.

---

## 5. The "future me" checklist — adding a new MCP

When the founder says "wire up MCP X," run through this in order:

- [ ] **Read the package's own docs** for supported transports. If HTTP is
      listed, use it. Skip the rest of this checklist.
- [ ] **Install globally** with `npm install -g <package>` (or note the
      local install path). This is what the lifecycle script will use.
- [ ] **Authenticate once** with `npx -y <package> auth` (or equivalent).
      Credentials land in `%USERPROFILE%\.config\<package>\` by default.
- [ ] **Test HTTP transport manually** before adding to kilo.json:
      `npx -y <package> start --transport http --port <p> &`
      then `curl http://127.0.0.1:<p>/mcp` (or whatever the path is).
      Confirm it speaks JSON-RPC.
- [ ] **Add to `kilo.json`** as `type: "remote"`. Do NOT add to
      `~/.config/kilo/kilo.jsonc` — that one is a global default; project
      configs should be in the project's own `kilo.json` to keep the
      single-source-of-truth property.
- [ ] **Add a `npm run <name>:up` / `<name>:down` script pair** in
      `package.json` mirroring `drive:up` / `drive:down`. Use the same
      pattern: a `.mjs` script that does the readiness probe and PID
      discovery, optionally a `.cmd` wrapper if `npm` parent-exit is
      a problem.
- [ ] **Add a permission** to `kilo.json` under `permission`:
      `"<mcp-prefix>_*": "allow"`.
- [ ] **Update `AGENTS.md`** Current Project State with: package name,
      endpoint, account, lifecycle scripts, and the "if tools don't
      appear, run `<name>:up` and restart" recovery line.
- [ ] **Add the new MCP to this doc** under §6 (registry) with the
      minimal repro so future-me can debug from this file alone.

---

## 6. MCP registry (live)

| MCP | Package | Endpoint | Lifecycle | Auth | Notes |
|---|---|---|---|---|---|
| paddle-sandbox | `@paddle/paddle-mcp` (sandbox) | `https://sandbox-mcp.paddle.com/mcp` (remote, in kilo.json) | n/a — hosted | API key via `PADDLE_SANDBOX_KEY` | Works. |
| paddle-live | `@paddle/paddle-mcp` (live) | `https://mcp.paddle.com/mcp` (remote) | n/a — hosted | API key | Works. Do NOT call in test scripts. |
| paddle-docs | hosted | `https://paddlehq.mcp.kapa.ai` (remote) | n/a — hosted | none | Docs search. |
| google-drive | `@piotr-agier/google-drive-mcp` | `http://127.0.0.1:3100/mcp` (remote, lifecycle via npm scripts) | `npm run drive:up` / `drive:down` | OAuth — `jahangirhussain110786@gmail.com` | 116 tools. **Default pattern for any new local MCP** — see §3. |
| filesystem | `@modelcontextprotocol/server-filesystem` | stdio (in kilo.json) | n/a | none | Works with `cmd /c npx`. |
| fetch | `@modelcontextprotocol/server-fetch` | stdio | n/a | none | Works. |
| memory | `@modelcontextprotocol/server-memory` | stdio | n/a | none | Works. |
| sequential-thinking | `@modelcontextprotocol/server-sequential-thinking` | stdio | n/a | none | Works. |
| time | `@modelcontextprotocol/server-time` | stdio | n/a | none | Works. |
| duckduckgo | `@modelcontextprotocol/server-duckduckgo` | stdio | n/a | none | Works. |
| github | `@modelcontextprotocol/server-github` | stdio (in kilo.json) | n/a | `GITHUB_TOKEN` env | Works. |
| context7 | `@upstash/context7-mcp` | stdio (in `kilo.jsonc`) | n/a | none | Works. |
| playwright | `@playwright/mcp` | stdio (auto-started by Kilo) | n/a | none | Works. Browser opens. |
| browser-use | `browser-use` (npm) | stdio (in kilo.json) | n/a | `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` | Local autonomous browser. `--cli-mcp` mode. |
| calcom | `@calcom/cal-mcp` (npm) | stdio (in kilo.json) | n/a | `CAL_API_KEY` | Cal.com scheduling. Self-hosted or hosted. |

When you add a new MCP, append a row. When one breaks, edit its row with the
date and the symptom. This table is the single place future-you looks first.
