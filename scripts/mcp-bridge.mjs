import http from 'node:http';
import { spawn } from 'node:child_process';
import { writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

const NAME = process.env.MCP_NAME || 'mcp-bridge';
const PACKAGE = process.env.MCP_PACKAGE;
const PORT = Number(process.env.MCP_PORT || 3111);
const PATH_MCP = process.env.MCP_PATH || '/mcp';
const EXTRA_ARGS = (process.env.MCP_ARGS || '').split(/\s+/).filter(Boolean);

if (!PACKAGE) {
  console.error('[bridge] MCP_PACKAGE env var required');
  process.exit(1);
}

const env = { ...process.env };
for (const [k, v] of Object.entries(process.env)) {
  if (k.startsWith('MCP_ENV_')) {
    const real = k.slice('MCP_ENV_'.length);
    if (v !== undefined) env[real] = v;
    delete env[k];
  }
}
delete env.MCP_NAME;
delete env.MCP_PACKAGE;
delete env.MCP_PORT;
delete env.MCP_PATH;
delete env.MCP_ARGS;

const cmd = process.platform === 'win32' ? 'cmd' : 'npx';
const cmdArgs = process.platform === 'win32'
  ? ['/c', 'npx', '-y', PACKAGE, ...EXTRA_ARGS]
  : ['-y', PACKAGE, ...EXTRA_ARGS];

console.error(`[bridge:${NAME}] spawning: ${cmd} ${cmdArgs.join(' ')}`);

const child = spawn(cmd, cmdArgs, {
  env,
  stdio: ['pipe', 'pipe', 'pipe'],
  windowsHide: true,
});
child.stderr.on('data', (b) => process.stderr.write(`[child:${NAME}] ${b}`));
child.on('exit', (code, sig) => {
  console.error(`[bridge:${NAME}] child exited code=${code} sig=${sig}`);
  process.exit(code ?? 1);
});

const client = new Client({ name: `bridge-${NAME}`, version: '1.0.0' }, { capabilities: {} });
const stdioTransport = new StdioClientTransport({ command: cmd, args: cmdArgs, env });
await client.connect(stdioTransport);
console.error(`[bridge:${NAME}] child stdio MCP connected`);

const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
transport.onmessage = async (msg) => {
  if (!msg || typeof msg !== 'object') return;
  const isRequest = 'method' in msg && 'id' in msg;
  if (!isRequest) {
    try { await client.notification(msg); } catch (e) {
      console.error(`[bridge:${NAME}] notif forward failed:`, e.message);
    }
    return;
  }
  try {
    const { result, error } = await client.request(msg, { timeout: 120_000 });
    await transport.send(result !== undefined ? { jsonrpc: '2.0', id: msg.id, result } : { jsonrpc: '2.0', id: msg.id, error });
  } catch (e) {
    const err = { jsonrpc: '2.0', id: msg.id, error: { code: -32603, message: String(e?.message ?? e) } };
    try { await transport.send(err); } catch {}
  }
};
transport.onerror = (e) => console.error(`[bridge:${NAME}] transport error:`, e?.message ?? e);

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/healthz') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, name: NAME, package: PACKAGE, port: PORT }));
    return;
  }
  if (req.url === PATH_MCP) {
    try { await transport.handleRequest(req, res); }
    catch (e) { console.error(`[bridge:${NAME}] handleRequest err:`, e?.message ?? e); if (!res.headersSent) { res.writeHead(500); res.end(); } }
    return;
  }
  res.writeHead(404).end();
});

const pidFile = resolve(process.cwd(), `.mcp-bridge-${NAME}.pid`);
writeFileSync(pidFile, String(process.pid));
console.error(`[bridge:${NAME}] HTTP listening on http://127.0.0.1:${PORT}${PATH_MCP} (pid ${process.pid})`);

server.listen(PORT, '127.0.0.1', () => {
  process.stderr.write(`[bridge:${NAME}] ready\n`);
});

const shutdown = (sig) => {
  console.error(`[bridge:${NAME}] ${sig} received, shutting down`);
  try { child.kill('SIGTERM'); } catch {}
  try { server.close(); } catch {}
  try { if (existsSync(pidFile)) unlinkSync(pidFile); } catch {}
  setTimeout(() => process.exit(0), 500);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
