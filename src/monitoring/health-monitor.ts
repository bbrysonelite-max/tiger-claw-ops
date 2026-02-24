/**
 * Tiger Claw Scout — Health Monitor
 * Runs every 60 seconds. Checks Redis, DB, and all bot webhooks.
 * Sends Telegram alert to admin when anything fails.
 * Self-heals what it can (re-register broken webhooks).
 */

import 'dotenv/config';
import { Redis } from 'ioredis';
import { Pool } from 'pg';
import CryptoJS from 'crypto-js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DB_URL = process.env.DATABASE_URL || '';
const ADMIN_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ALERT_CHAT_ID = process.env.TELEGRAM_REPORT_CHAT_ID || '';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
const GATEWAY_URL = process.env.GATEWAY_URL || 'https://api.botcraftwrks.ai';
const CHECK_INTERVAL_MS = 60 * 1000; // 60 seconds

// Track failure counts to avoid alert spam (only alert on first failure and every 10th)
const failureCounts: Record<string, number> = {};
// Track resolved states to send a "back online" message
const wasDown: Record<string, boolean> = {};

async function sendAlert(title: string, body: string, urgent = false) {
  if (!ADMIN_BOT_TOKEN || !ALERT_CHAT_ID) return;

  const prefix = urgent ? '🚨 URGENT' : '⚠️';
  const message = `${prefix} *${title}*\n\n${body}\n\n_${new Date().toISOString()}_`;

  try {
    await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: ALERT_CHAT_ID, text: message, parse_mode: 'Markdown' }),
    });
    console.log(`[monitor] Alert sent: ${title}`);
  } catch (err: any) {
    console.error('[monitor] Failed to send alert:', err.message);
  }
}

async function sendRecovery(title: string) {
  if (!ADMIN_BOT_TOKEN || !ALERT_CHAT_ID) return;
  const message = `✅ *RECOVERED: ${title}*\n\n_Back online at ${new Date().toISOString()}_`;
  try {
    await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: ALERT_CHAT_ID, text: message, parse_mode: 'Markdown' }),
    });
  } catch {}
}

function shouldAlert(key: string, failed: boolean): boolean {
  if (!failed) {
    if (wasDown[key]) {
      wasDown[key] = false;
      sendRecovery(key);
    }
    failureCounts[key] = 0;
    return false;
  }
  failureCounts[key] = (failureCounts[key] || 0) + 1;
  const count = failureCounts[key];
  wasDown[key] = true;
  // Alert on first failure, then every 10th
  return count === 1 || count % 10 === 0;
}

// --- Redis health check ---
async function checkRedis(): Promise<boolean> {
  let redis: Redis | null = null;
  try {
    redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 1, connectTimeout: 5000, lazyConnect: true });
    await redis.connect();
    await redis.ping();
    return true;
  } catch (err: any) {
    if (shouldAlert('Redis', true)) {
      await sendAlert('Redis Down', `Cannot connect to Redis at ${REDIS_URL}\n\nError: ${err.message}\n\nBullMQ queues are non-functional. No messages will be processed.`, true);
    }
    return false;
  } finally {
    try { redis?.disconnect(); } catch {}
  }
}

// --- Database health check ---
async function checkDatabase(): Promise<{ ok: boolean; tenants: any[] }> {
  const pool = new Pool({ connectionString: DB_URL, ssl: false, max: 1, idleTimeoutMillis: 5000 });
  try {
    await pool.query('SELECT 1');
    const result = await pool.query(
      `SELECT id, name, "botToken", "botTokenHash", "botUsername", chat_id
       FROM "Tenant" WHERE status = 'active'`
    );
    return { ok: true, tenants: result.rows };
  } catch (err: any) {
    if (shouldAlert('Database', true)) {
      await sendAlert('Database Down', `Cannot connect to PostgreSQL.\n\nError: ${err.message}\n\nAll bots will fail to process messages.`, true);
    }
    return { ok: false, tenants: [] };
  } finally {
    await pool.end().catch(() => {});
  }
}

// --- Webhook health check for all customer bots ---
async function checkBotWebhooks(tenants: any[]): Promise<void> {
  if (!ENCRYPTION_KEY) return;

  const brokenBots: string[] = [];

  for (const tenant of tenants) {
    try {
      let token: string;
      try {
        token = CryptoJS.AES.decrypt(tenant.botToken, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
        if (!token || !token.includes(':')) continue; // PENDING or invalid token
      } catch {
        continue;
      }

      const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
      const data: any = await res.json();

      if (!data.ok) continue;

      const webhookUrl = data.result?.url || '';
      const expectedUrl = `${GATEWAY_URL}/webhooks/${tenant.botTokenHash}`;
      const pendingCount = data.result?.pending_update_count || 0;
      const lastError = data.result?.last_error_message;

      const correctWebhook = webhookUrl.includes(tenant.botTokenHash);

      if (!correctWebhook) {
        brokenBots.push(tenant.botUsername);
        console.log(`[monitor] Re-registering webhook for ${tenant.botUsername}`);

        // Auto-heal: re-register the webhook
        await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: expectedUrl }),
        });
      }

      if (pendingCount > 50) {
        console.warn(`[monitor] ${tenant.botUsername} has ${pendingCount} pending updates`);
      }

      if (lastError) {
        console.warn(`[monitor] ${tenant.botUsername} last webhook error: ${lastError}`);
      }

    } catch (err: any) {
      console.error(`[monitor] Error checking ${tenant.botUsername}:`, err.message);
    }
  }

  const key = 'BotWebhooks';
  if (brokenBots.length > 0) {
    if (shouldAlert(key, true)) {
      await sendAlert(
        'Bot Webhooks Auto-Healed',
        `${brokenBots.length} bot(s) had broken webhooks and were automatically re-registered:\n\n${brokenBots.map(b => `• @${b}`).join('\n')}`
      );
    }
  } else {
    shouldAlert(key, false);
  }
}

// --- API self-check ---
async function checkApi(): Promise<void> {
  const apiUrl = `${GATEWAY_URL}/health`;
  try {
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(5000) });
    const data: any = await res.json();
    if (data.status !== 'ok') throw new Error(`Unexpected status: ${data.status}`);
    shouldAlert('API', false);
  } catch (err: any) {
    if (shouldAlert('API', true)) {
      await sendAlert('API Unresponsive', `GET ${apiUrl} failed.\n\nError: ${err.message}\n\nCustomers cannot reach the bot.`, true);
    }
  }
}

// --- Main check loop ---
async function runChecks() {
  console.log(`[monitor] Running checks at ${new Date().toISOString()}`);

  const [redisOk, dbResult] = await Promise.all([
    checkRedis(),
    checkDatabase(),
  ]);

  if (dbResult.ok && dbResult.tenants.length > 0) {
    await checkBotWebhooks(dbResult.tenants);
  }

  await checkApi();

  const status = redisOk && dbResult.ok ? 'ALL OK' : 'DEGRADED';
  console.log(`[monitor] Check complete — ${status} | Redis: ${redisOk} | DB: ${dbResult.ok} | Bots: ${dbResult.tenants.length}`);
}

// Run immediately, then on interval
runChecks();
setInterval(runChecks, CHECK_INTERVAL_MS);

// Graceful shutdown
process.on('SIGTERM', () => { console.log('[monitor] Shutting down'); process.exit(0); });
process.on('SIGINT', () => { console.log('[monitor] Shutting down'); process.exit(0); });

console.log(`[monitor] Tiger Claw Health Monitor started — checking every ${CHECK_INTERVAL_MS / 1000}s`);
