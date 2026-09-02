import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';

const argv = process.argv.slice(2);
const portIdx = argv.indexOf('--port');
const port = portIdx > -1 ? argv[portIdx + 1] : '3100';
const pidFile = resolve(process.cwd(), '.drive-mcp.pid');

let killed = false;

if (existsSync(pidFile)) {
  const pid = parseInt(readFileSync(pidFile, 'utf8').trim(), 10);
  if (pid) {
    try { process.kill(pid, 'SIGTERM'); killed = true; } catch {}
  }
  try { unlinkSync(pidFile); } catch {}
}

const isWindows = process.platform === 'win32';

if (!killed || isWindows) {
  try {
    const out = execFileSync('netstat', ['-ano'], {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
      windowsHide: true,
    });
    const pids = new Set();
    for (const line of out.split('\n')) {
      if (!line.includes(`:${port}`)) continue;
      if (isWindows ? !line.includes('LISTENING') : !line.includes('LISTEN')) continue;
      const m = line.trim().split(/\s+/).pop();
      if (m && /^\d+$/.test(m)) pids.add(parseInt(m, 10));
    }
    for (const pid of pids) {
      try { process.kill(pid, 'SIGTERM'); killed = true; } catch {}
    }
  } catch {}
}

if (isWindows) {
  try {
    const out = execFileSync('wmic', [
      'process', 'where', "name='node.exe'",
      'get', 'ProcessId,CommandLine', '/format:csv',
    ], {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
      windowsHide: true,
    });
    for (const row of out.split('\n')) {
      if (!row.includes('@piotr-agier/google-drive-mcp')) continue;
      const m = row.match(/,(\d+)\s*$/);
      if (m) {
        try { process.kill(parseInt(m[1], 10), 'SIGTERM'); killed = true; } catch {}
      }
    }
  } catch {}
}

if (killed) {
  await new Promise((r) => setTimeout(r, 800));
  console.log(`Stopped google-drive MCP on port ${port}.`);
} else {
  console.log(`No google-drive MCP process found on port ${port}.`);
}
