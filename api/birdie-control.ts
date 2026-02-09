#!/usr/bin/env npx tsx
/**
 * Birdie Control Server
 *
 * A simple local server that runs on the trash can Mac Pro to receive
 * restart/update commands from the dashboard. This solves the network
 * isolation problem (cloud API can't SSH to local machines).
 *
 * Usage:
 *   1. Copy this file to the trash can Mac Pro
 *   2. Run: npx tsx birdie-control.ts
 *   3. Point dashboard to http://192.168.0.136:3001
 *
 * Or run as a background service using pm2:
 *   pm2 start birdie-control.ts --interpreter npx --interpreter-args tsx
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const PORT = parseInt(process.env.BIRDIE_CONTROL_PORT || '3001');

// CORS headers for dashboard access
function setCorsHeaders(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Execute a shell command
async function runCommand(cmd: string): Promise<{ success: boolean; output?: string; error?: string }> {
  try {
    console.log(`[Birdie] Running: ${cmd}`);
    const { stdout, stderr } = await execAsync(cmd, { timeout: 120000 });
    return { success: true, output: stdout.trim() || stderr.trim() };
  } catch (error: any) {
    console.error(`[Birdie] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Check if OpenClaw gateway is running
async function isGatewayRunning(): Promise<boolean> {
  const result = await runCommand('pgrep -f "openclaw gateway" || echo ""');
  return result.success && result.output !== '';
}

// Get OpenClaw version
async function getVersion(): Promise<string> {
  const result = await runCommand('openclaw --version 2>/dev/null || echo "unknown"');
  return result.output || 'unknown';
}

// Request handler
async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const path = url.pathname;

  console.log(`[Birdie] ${req.method} ${path}`);

  res.setHeader('Content-Type', 'application/json');

  try {
    // Health check
    if (path === '/health' || path === '/') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', service: 'birdie-control' }));
      return;
    }

    // Status check
    if (path === '/status' || path === '/v1/bots/birdie/status') {
      const running = await isGatewayRunning();
      const version = await getVersion();

      res.writeHead(200);
      res.end(JSON.stringify({
        online: running,
        version,
        host: '192.168.0.136',
        port: 18789,
        engine: 'OpenClaw',
      }));
      return;
    }

    // Restart Birdie
    if (path === '/restart' || path === '/v1/bots/birdie/restart') {
      if (req.method !== 'POST') {
        res.writeHead(405);
        res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
        return;
      }

      console.log('[Birdie] Restarting...');

      // Kill existing processes
      await runCommand('pkill -f "openclaw gateway" 2>/dev/null || true');
      await new Promise(r => setTimeout(r, 2000));

      // Start gateway
      const startResult = await runCommand(
        'cd ~/.openclaw/agents/main/agent && nohup openclaw gateway --force > /tmp/birdie.log 2>&1 &'
      );

      // Wait for it to come up
      await new Promise(r => setTimeout(r, 3000));
      const running = await isGatewayRunning();

      res.writeHead(200);
      res.end(JSON.stringify({
        success: running,
        message: running ? 'Birdie restarted successfully' : 'Restart command sent, checking status...',
        output: startResult.output,
      }));
      return;
    }

    // Update Birdie
    if (path === '/update' || path === '/v1/bots/birdie/update') {
      if (req.method !== 'POST') {
        res.writeHead(405);
        res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
        return;
      }

      console.log('[Birdie] Updating OpenClaw...');

      // Stop gateway
      await runCommand('pkill -f "openclaw gateway" 2>/dev/null || true');
      await new Promise(r => setTimeout(r, 2000));

      // Update OpenClaw
      const updateResult = await runCommand('npm update -g openclaw');
      console.log('[Birdie] Update result:', updateResult.output);

      // Get new version
      const version = await getVersion();

      // Restart gateway
      await runCommand(
        'cd ~/.openclaw/agents/main/agent && nohup openclaw gateway --force > /tmp/birdie.log 2>&1 &'
      );

      // Wait for it to come up
      await new Promise(r => setTimeout(r, 3000));
      const running = await isGatewayRunning();

      res.writeHead(200);
      res.end(JSON.stringify({
        success: running,
        message: running ? `Updated to ${version}` : 'Update complete, restart in progress',
        version,
        output: updateResult.output,
      }));
      return;
    }

    // View logs
    if (path === '/logs') {
      const result = await runCommand('tail -50 /tmp/birdie.log 2>/dev/null || echo "No logs"');
      res.writeHead(200);
      res.end(JSON.stringify({ logs: result.output }));
      return;
    }

    // 404
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));

  } catch (error: any) {
    console.error('[Birdie] Request error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: error.message }));
  }
}

// Start server
const server = createServer(handleRequest);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                   🐦 Birdie Control Server                    ║
╠═══════════════════════════════════════════════════════════════╣
║  Running on: http://0.0.0.0:${PORT.toString().padEnd(27)}║
║                                                               ║
║  Endpoints:                                                   ║
║    GET  /status   - Check if Birdie is running                ║
║    POST /restart  - Restart Birdie (OpenClaw gateway)         ║
║    POST /update   - Update OpenClaw and restart               ║
║    GET  /logs     - View recent Birdie logs                   ║
║                                                               ║
║  To use from dashboard, set:                                  ║
║    API_BASE = http://192.168.0.136:${PORT.toString().padEnd(24)}║
║                                                               ║
║  Or run: curl -X POST http://localhost:${PORT}/restart          ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n[Birdie] Shutting down...');
  server.close();
  process.exit(0);
});
