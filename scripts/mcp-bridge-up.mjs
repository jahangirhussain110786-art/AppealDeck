import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

const argv = process.argv.slice(2);
function arg(name, fallback) {
  const i = argv.indexOf(`--${name}`);
  return i > -1 ? argv[i + 1] : fallback;
}
function argList(name) {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return [];
  const out = [];
  for (let j = i + 1; j < argv.length; j++) {
    if (argv[j].startsWith('--')) break;
    out.push(argv[j]);
  }
  return out;
}

const name = arg('name');
const port = arg('port', '3111');
const pkg = arg('package');
const extraArgs = argList('args');
const envKeys = argList('env');

if (!name || !pkg) {
  console.error('Usage: node mcp-bridge-up.mjs --name X --port N --package "@org/pkg" [--args a b c] [--env KEY1 KEY2 ...]');
  process.exit(2);
}

const pidFile = resolve(process.cwd(), `.mcp-bridge-${name}.pid`);
const logFile = resolve(process.cwd(), `.mcp-bridge-${name}.log`);
const here = dirname(fileURLToPath(import.meta.url));
const bridgeScript = join(here, 'mcp-bridge.mjs');
const helperCmd = resolve(process.cwd(), `.mcp-bridge-${name}.cmd`);

if (existsSync(pidFile)) {
  const pid = parseInt(readFileSync(pidFile, 'utf8').trim(), 10);
  if (pid && pid > 0) {
    try {
      process.kill(pid, 0);
      console.log(`mcp-bridge[${name}] already running (pid ${pid}) on http://127.0.0.1:${port}/mcp`);
      process.exit(0);
    } catch {}
  }
}

appendFileSync(logFile, `\n--- mcp-bridge:${name} up @ ${new Date().toISOString()} ---\n`);

let cmdBody = '@echo off\r\nsetlocal\r\n';
for (const k of envKeys) {
  const v = process.env[k];
  if (v !== undefined) cmdBody += `set "MCP_ENV_${k}=${v.replace(/"/g, '')}"\r\n`;
}
cmdBody += `set "MCP_NAME=${name}"\r\nset "MCP_PORT=${port}"\r\nset "MCP_PACKAGE=${pkg}"\r\n`;
if (extraArgs.length) cmdBody += `set "MCP_ARGS=${extraArgs.join(' ')}"\r\n`;
cmdBody += `start "" /B node "${bridgeScript}" >> "${logFile}" 2>&1\rnexit /b 0\r\n`;

writeFileSync(helperCmd, cmdBody);

const r = spawnSync('cmd.exe', ['/c', helperCmd], {
  stdio: 'ignore',
  windowsHide: true,
  detached: true,
});
r?.child?.unref?.();
setTimeout(() => { try { existsSync(helperCmd) && require('node:fs').unlinkSync(helperCmd); } catch {} }, 2000);

const probe = () => new Promise((resolveP) => {
  const req = http.request({ host: '127.0.0.1', port: Number(port), path: '/healthz', method: 'GET', timeout: 1500 }, (res) => {
    res.resume();
    resolveP({ ok: res.statusCode === 200 });
  });
  req.on('error', (e) => resolveP({ ok: false, refused: e && e.code === 'ECONNREFUSED' }));
  req.on('timeout', () => { req.destroy(); resolveP({ ok: false }); });
  req.end();
});

const initial = await probe();
if (initial.ok) {
  console.error(`Port ${port} is already in use by another process. Run: npm run ${name}:down`);
  process.exit(1);
}

const deadline = Date.now() + 90000;
let discoveredPid = null;
while (Date.now() < deadline) {
  const r2 = await probe();
  if (r2.ok) {
    if (discoveredPid === null) {
      try {
        const out2 = spawnSync('netstat', ['-ano'], { encoding: 'utf8' }).stdout || '';
        for (const line of out2.split('\n')) {
          if (line.includes(`:${port}`) && line.includes('LISTENING')) {
            const m = line.trim().split(/\s+/).pop();
            if (m && /^\d+$/.test(m)) { discoveredPid = parseInt(m, 10); break; }
          }
        }
      } catch {}
      if (discoveredPid) writeFileSync(pidFile, String(discoveredPid));
    }
    console.log(`mcp-bridge[${name}] ready${discoveredPid ? ` (pid ${discoveredPid})` : ''} on http://127.0.0.1:${port}/mcp`);
    console.log(`Package: ${pkg}${extraArgs.length ? ' ' + extraArgs.join(' ') : ''}`);
    console.log(`Logs: ${logFile}`);
    console.log(`Stop with: npm run ${name}:down`);
    process.exit(0);
  }
  await new Promise((r) => setTimeout(r, 1000));
}

console.error(`mcp-bridge[${name}] did not become ready within 90s. Check ${logFile}.`);
process.exit(1);
