import { spawnSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import http from 'node:http';

const argv = process.argv.slice(2);
const portIdx = argv.indexOf('--port');
const port = portIdx > -1 ? argv[portIdx + 1] : '3100';

const pidFile = resolve(process.cwd(), '.drive-mcp.pid');
const logFile = resolve(process.cwd(), '.drive-mcp.log');

if (existsSync(pidFile)) {
  const pid = parseInt(readFileSync(pidFile, 'utf8').trim(), 10);
  if (pid && pid > 0) {
    try {
      process.kill(pid, 0);
      console.log(`google-drive MCP already running (pid ${pid}) on http://127.0.0.1:${port}/mcp`);
      process.exit(0);
    } catch {}
  }
}

appendFileSync(logFile, `\n--- drive:up @ ${new Date().toISOString()} ---\n`);

const scriptDir = resolve(process.argv[1], '..');
const cmdPath = join(scriptDir, 'drive-mcp-up.cmd');

const r = spawnSync('cmd.exe', ['/c', cmdPath, port], {
  stdio: 'ignore',
  windowsHide: true,
  detached: true,
});

if (r.status !== 0 && r.status !== null) {
  console.error('Failed to launch google-drive MCP (see .drive-mcp.log)');
  process.exit(1);
}

const probe = () => new Promise((resolveP) => {
  const req = http.request({ host: '127.0.0.1', port: Number(port), path: '/mcp', method: 'GET', timeout: 1500 }, (res) => {
    res.resume();
    resolveP({ ok: true });
  });
  req.on('error', (e) => resolveP({ ok: false, refused: e && e.code === 'ECONNREFUSED' }));
  req.on('timeout', () => { req.destroy(); resolveP({ ok: false }); });
  req.end();
});

const initial = await probe();
if (initial.ok) {
  console.error(`Port ${port} is already in use by another process. Run: npm run drive:down`);
  process.exit(1);
}

const deadline = Date.now() + 60000;
let lastRefused = false;
let discoveredPid = null;
while (Date.now() < deadline) {
  const r2 = await probe();
  if (r2.ok) {
    if (discoveredPid === null) {
      try {
        const out = spawnSync('netstat', ['-ano'], { encoding: 'utf8' }).stdout || '';
        for (const line of out.split('\n')) {
          if (line.includes(`:${port}`) && line.includes('LISTENING')) {
            const m = line.trim().split(/\s+/).pop();
            if (m && /^\d+$/.test(m)) { discoveredPid = parseInt(m, 10); break; }
          }
        }
      } catch {}
      if (discoveredPid) writeFileSync(pidFile, String(discoveredPid));
    }
    console.log(`google-drive MCP ready${discoveredPid ? ` (pid ${discoveredPid})` : ''} on http://127.0.0.1:${port}/mcp`);
    console.log(`Logs: ${logFile}`);
    console.log(`Stop with: npm run drive:down`);
    process.exit(0);
  }
  lastRefused = lastRefused || !!r2.refused;
  await new Promise((r) => setTimeout(r, 1000));
}

console.error(`google-drive MCP did not become ready within 60s.${lastRefused ? ' (port refused — another process may be bound)' : ''} Check ${logFile}.`);
process.exit(1);
