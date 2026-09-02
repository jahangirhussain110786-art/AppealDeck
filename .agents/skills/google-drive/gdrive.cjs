#!/usr/bin/env node
/**
 * Google Drive MCP CLI Wrapper (file-arg-only, uses long-lived HTTP server)
 *
 * Usage:
 *   node gdrive.cjs tools
 *   node gdrive.cjs call <tool_name> @<params-file>
 *
 * Params MUST be a JSON file path prefixed with '@'. Inline JSON is rejected
 * because PowerShell mangles single-quoted JSON on Windows.
 *
 * Connects to the long-lived google-drive MCP HTTP server on
 * http://127.0.0.1:3100/mcp. Start it with:  npm run drive:up
 *
 * Examples:
 *   echo '{"query":"AppealDeck"}' > p.json
 *   node gdrive.cjs call search @p.json
 *
 *   echo '{"name":"notes.md","content":"# Hi"}' > p.json
 *   node gdrive.cjs call createTextFile @p.json
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const MCP_URL = process.env.GDRIVE_MCP_URL || 'http://127.0.0.1:3100/mcp';
const PORT = parseInt((new URL(MCP_URL)).port, 10) || 3100;

function readParamsFile(p) {
  let raw = fs.readFileSync(p, 'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  return JSON.parse(raw);
}

function ssePost(body) {
  return new Promise((resolve, reject) => {
    const u = new URL(MCP_URL);
    const req = http.request({
      host: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        if (res.headers['mcp-session-id']) {
          resolve({ sessionId: res.headers['mcp-session-id'], body: data });
        } else {
          resolve({ body: data });
        }
      });
    });
    req.on('error', (e) => reject(new Error(`Cannot reach ${MCP_URL}. Is the server running? Start it with: npm run drive:up\n${e.message}`)));
    req.setTimeout(120000, () => { req.destroy(new Error('Request timeout (120s)')); });
    req.write(body);
    req.end();
  });
}

function ssePostWithSession(body, sessionId) {
  return new Promise((resolve, reject) => {
    const u = new URL(MCP_URL);
    const req = http.request({
      host: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': sessionId,
      },
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ body: data }));
    });
    req.on('error', (e) => reject(e));
    req.setTimeout(120000, () => { req.destroy(new Error('Request timeout (120s)')); });
    req.write(body);
    req.end();
  });
}

function extractFirstData(sseBody) {
  for (const line of sseBody.split('\n')) {
    if (line.startsWith('data: ')) return line.slice(6);
  }
  return sseBody;
}

async function initialize() {
  const initBody = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'gdrive-cjs', version: '1' },
    },
  });
  const { sessionId, body } = await ssePost(initBody);
  if (!sessionId) throw new Error('MCP initialize did not return a session id');
  // Send initialized notification
  await ssePostWithSession(
    JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
    sessionId
  );
  return sessionId;
}

async function listTools() {
  const sessionId = await initialize();
  const { body } = await ssePostWithSession(
    JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
    sessionId
  );
  const parsed = JSON.parse(extractFirstData(body));
  if (parsed.error) throw new Error(parsed.error.message);
  return parsed.result?.tools || [];
}

async function callTool(toolName, params) {
  const sessionId = await initialize();
  const { body } = await ssePostWithSession(
    JSON.stringify({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { name: toolName, arguments: params },
    }),
    sessionId
  );
  return JSON.parse(extractFirstData(body));
}

function formatOutput(result) {
  if (result.error) return JSON.stringify({ error: result.error }, null, 2);
  if (result.result?.content) {
    return result.result.content
      .map((c) => (c.type === 'text' ? c.text : JSON.stringify(c)))
      .join('\n');
  }
  return JSON.stringify(result.result, null, 2);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    console.log(`
Google Drive MCP CLI Wrapper (HTTP, file-arg-only)

Usage:
  node gdrive.cjs tools
  node gdrive.cjs call <tool_name> @<params-file>

Connects to: ${MCP_URL}  (start with: npm run drive:up)
Params must be a JSON file path prefixed with '@'. PowerShell mangles inline JSON.

Examples:
  echo '{"query":"AppealDeck"}' > p.json
  node gdrive.cjs call search @p.json

  echo '{"name":"notes.md","content":"# Hi"}' > p.json
  node gdrive.cjs call createTextFile @p.json
`);
    process.exit(0);
  }

  if (command === 'tools') {
    try {
      const tools = await listTools();
      console.log(JSON.stringify(tools.map((t) => ({
        name: t.name,
        description: t.description,
        params: Object.keys(t.inputSchema?.properties || {}),
      })), null, 2));
    } catch (e) { console.error(e.message); process.exit(1); }
    return;
  }

  if (command === 'call') {
    if (args.length < 3) {
      console.error('Usage: node gdrive.cjs call <tool_name> @<params-file>');
      process.exit(1);
    }
    const toolName = args[1];
    const rawParamsArg = args[2];
    if (!rawParamsArg.startsWith('@')) {
      console.error('Error: params must be a file path prefixed with "@".');
      console.error('       PowerShell breaks inline JSON; use a file.');
      console.error('Example:  echo \'{"query":"x"}\' > p.json && node gdrive.cjs call search @p.json');
      process.exit(1);
    }
    const paramsFile = rawParamsArg.slice(1);
    if (!fs.existsSync(paramsFile)) {
      console.error(`Params file not found: ${paramsFile}`);
      process.exit(1);
    }
    let params;
    try { params = readParamsFile(paramsFile); }
    catch (e) { console.error(`Cannot parse ${paramsFile}: ${e.message}`); process.exit(1); }

    try {
      const result = await callTool(toolName, params);
      console.log(formatOutput(result));
    } catch (e) { console.error(e.message); process.exit(1); }
    return;
  }

  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

main();
