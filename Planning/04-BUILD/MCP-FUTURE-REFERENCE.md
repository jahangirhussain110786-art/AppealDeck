# MCP — "Future Me" Reference

**Audience:** you (the founder), or a fresh Kilo session that has no context.
**Purpose:** a single page that answers "how do I add a new MCP server
correctly, and how do I debug one that's broken" — without needing to read
any other file.

---

## 0. The one-minute summary

- **Always prefer `type: "remote"`** against a long-lived local HTTP
  endpoint. On Windows, stdio MCPs are flaky.
- If the package supports HTTP, run it as a background process and
  connect to it. ~100ms per call, no npx-per-call cost.
- If the package only ships stdio, wrap in `cmd /c npx ...` AND verify in
  a fresh Kilo session.
- All local MCPs need a `npm run <name>:up` / `<name>:down` pair so
  sessions can (re)start them.
- After adding, update `AGENTS.md` (project state) and
  `Planning/04-BUILD/MCP-ON-WINDOWS.md` (registry table).

Full decision record: `Planning/04-BUILD/MCP-ON-WINDOWS.md`. Read it
before adding anything.

---

## 1. Decision tree — should I use stdio or HTTP?

```
Does the MCP package document a HTTP / Streamable HTTP transport?
├── YES -> use HTTP. Stop here.
│         Start command: npx -y <pkg> start --transport http --port <p>
│         Kilo config:    "type": "remote", "url": "http://127.0.0.1:<p>/mcp"
│
└── NO  -> stdio is your only option.
          Wrap in cmd /c npx in kilo.json.
          Verify in a fresh session (see §3).
          Add a verify line to AGENTS.md so future-you knows "good looks
          like: tools <prefix>_* appearing in the session tool list within
          5 seconds of session start."
```

---

## 2. The lifecycle scripts (template)

Every local HTTP MCP needs three files. Copy these as a starting point,
rename `<name>`, and adjust the port:

### `scripts/<name>-mcp-up.cmd`
```cmd
@echo off
setlocal
set "PORT=%1"
if "%PORT%"=="" set "PORT=<default>"

set "ENTRY=%APPDATA%\npm\node_modules\<package>\dist\index.js"
if not exist "%ENTRY%" (
  echo Local entry not found at %ENTRY%. Run: npm install -g <package>
  exit /b 1
)

start "" /B node "%ENTRY%" start --transport http --port %PORT%
exit /b 0
```

### `scripts/<name>-mcp-up.mjs`
```js
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import http from 'node:http';

const port = process.argv.find((a, i) => process.argv[i - 1] === '--port') ?? '<default>';
const pidFile = resolve(process.cwd(), '.<name>-mcp.pid');
const logFile = resolve(process.cwd(), '.<name>-mcp.log');

if (existsSync(pidFile)) {
  const pid = parseInt(readFileSync(pidFile, 'utf8').trim(), 10);
  if (pid && pid > 0) {
    try { process.kill(pid, 0); console.log(`<name> MCP already running (pid ${pid})`); process.exit(0); } catch {}
  }
}

appendFileSync(logFile, `\n--- <name>:up @ ${new Date().toISOString()} ---\n`);
const scriptDir = resolve(process.argv[1], '..');
const cmdPath = join(scriptDir, '<name>-mcp-up.cmd');
const r = spawnSync('cmd.exe', ['/c', cmdPath, port], { stdio: 'ignore', windowsHide: true, detached: true });
if (r.status !== 0 && r.status !== null) { console.error('Failed to launch <name> MCP'); process.exit(1); }

const probe = () => new Promise((res) => {
  const req = http.request({ host: '127.0.0.1', port: Number(port), path: '/mcp', method: 'GET', timeout: 1500 }, (r) => { r.resume(); res({ ok: true }); });
  req.on('error', (e) => res({ ok: false, refused: e?.code === 'ECONNREFUSED' }));
  req.on('timeout', () => { req.destroy(); res({ ok: false }); });
  req.end();
});

if ((await probe()).ok) { console.error(`Port ${port} already in use`); process.exit(1); }
const deadline = Date.now() + 60000;
while (Date.now() < deadline) {
  if ((await probe()).ok) {
    let pid = null;
    try {
      const out = spawnSync('netstat', ['-ano'], { encoding: 'utf8' }).stdout || '';
      for (const line of out.split('\n')) if (line.includes(`:${port}`) && line.includes('LISTENING')) { const m = line.trim().split(/\s+/).pop(); if (m && /^\d+$/.test(m)) { pid = parseInt(m, 10); break; } }
    } catch {}
    if (pid) writeFileSync(pidFile, String(pid));
    console.log(`<name> MCP ready${pid ? ` (pid ${pid})` : ''} on http://127.0.0.1:${port}/mcp`);
    console.log(`Logs: ${logFile}`); console.log(`Stop with: npm run <name>:down`);
    process.exit(0);
  }
  await new Promise((r) => setTimeout(r, 1000));
}
console.error(`<name> MCP did not become ready within 60s. Check ${logFile}.`);
process.exit(1);
```

### `scripts/<name>-mcp-down.mjs`
```js
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import process from 'node:process';

const port = process.argv.find((a, i) => process.argv[i - 1] === '--port') ?? '<default>';
const pidFile = resolve(process.cwd(), '.<name>-mcp.pid');
let killed = false;

if (existsSync(pidFile)) {
  const pid = parseInt(readFileSync(pidFile, 'utf8').trim(), 10);
  if (pid) { try { process.kill(pid, 'SIGTERM'); killed = true; } catch {} }
  try { unlinkSync(pidFile); } catch {}
}

if (process.platform === 'win32') {
  try {
    const out = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' });
    for (const line of out.split('\n')) {
      const m = line.trim().split(/\s+/).pop();
      if (m && /^\d+$/.test(m)) { try { process.kill(parseInt(m, 10), 'SIGTERM'); killed = true; } catch {} }
    }
    const t = execSync('wmic process where "name=\'node.exe\'" get ProcessId,CommandLine /format:csv', { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' });
    for (const row of t.split('\n')) if (row.includes('<package>')) { const m = row.match(/,(\d+)\s*$/); if (m) { try { process.kill(parseInt(m[1], 10), 'SIGTERM'); killed = true; } catch {} } }
  } catch {}
}

if (killed) { await new Promise((r) => setTimeout(r, 800)); console.log(`Stopped <name> MCP on port ${port}.`); }
else console.log(`No <name> MCP process found on port ${port}.`);
```

### `package.json` scripts
```json
"<name>:up":   "node scripts/<name>-mcp-up.mjs",
"<name>:down": "node scripts/<name>-mcp-down.mjs"
```

### `kilo.json` MCP entry
```json
"<name>": {
  "type": "remote",
  "url": "http://127.0.0.1:<port>/mcp",
  "enabled": true
}
```

### `kilo.json` permission
```json
"permission": {
  "<prefix>_*": "allow"
}
```

---

## 3. Verify checklist (after every new MCP)

Run in order. If any step fails, go to §4.

1. **Server starts:** `npm run <name>:up` prints `<name> MCP ready (pid N) on http://127.0.0.1:<port>/mcp` and exits 0.
2. **HTTP responds:** `curl -i http://127.0.0.1:<port>/mcp` returns HTTP/1.1 (likely 400 to GET — that's fine, it wants POST).
3. **JSON-RPC works:**
   ```
   curl -X POST http://127.0.0.1:<port>/mcp \
     -H "Content-Type: application/json" \
     -H "Accept: application/json, text/event-stream" \
     -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"0"}}}'
   ```
   Should return a session id in the `mcp-session-id` header.
4. **Kilo sees the tools:** start a new Kilo session. The `<prefix>_*` tools appear in the tool list within ~5s.
5. **First call works:** in the session, call one of the listed tools. It should return data in ~1s.

---

## 4. Debugging — "tools don't appear"

| Symptom | Likely cause | Fix |
|---|---|---|
| Tools never appear after session start | HTTP server isn't up | `npm run <name>:up`, then restart Kilo session |
| "Cannot reach MCP at http://127.0.0.1:<port>/mcp" from a wrapper call | Server died | `npm run <name>:up` to restart, retry the call |
| Tools appear then disappear mid-session | Server crashed | `tail -f .<name>-mcp.log`, look for auth/credential errors |
| `search returns 0 results` for files you know exist | Env-var auth override (per `piotr-agier/google-drive-mcp` troubleshooting) | Check `%GOOGLE_APPLICATION_CREDENTIALS%` and `%GOOGLE_DRIVE_MCP_ACCESS_TOKEN%` are unset for the MCP process |
| 429 rate limit on rapid bulk calls | Google API quota (Drive: 12k/min, Docs/Sheets/Slides: 300/min) | Add backoff in the calling code; batch where possible |
| `npm run drive:up` hangs past 60s | npx first-time download (only happens once per npx cache miss) | Wait, or pre-warm with `npx -y <pkg> --version` |
| `npm run drive:up` prints "Port already in use" | Zombie from a prior run that didn't get cleaned up | `npm run <name>:down` (it kills by port + cmdline as a fallback) |

---

## 5. Per-session startup ordering (for Kilo)

When a new session starts, the agent should:

1. Check if the HTTP server is up: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3100/mcp`. If 200/400 → already up, skip.
2. If not, `npm run drive:up` (or the equivalent for the MCP in question).
3. If the `<prefix>_*` tools still don't appear in the session tool list, the Kilo MCP loader hasn't picked up the new `kilo.json` config — restart the Kilo CLI.
4. Proceed.

Future improvement: make the AGENTS.md "Current Project State" section
start with a one-liner that the agent reads first:

> "**MCPs to verify at session start:** `npm run drive:up` (and check that
> the resulting 116 tools show up as `google-drive_*` in this session).
> If absent, restart the Kilo CLI."

This file is the source of truth for that line. Keep it current.
