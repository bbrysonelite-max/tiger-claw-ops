/**
 * Tiger Bot Scout - BotFather Provisioner
 * Automated bot creation using gramjs MTProto client
 *
 * Uses SessionPool for multi-account rotation — each Telegram account can
 * create ~18 bots before the pool automatically switches to the next account.
 * Add accounts via POST /admin/sessions or the add-session CLI script.
 */

import 'dotenv/config';
import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { hashToken } from '../shared/crypto.js';
import { SessionPool, POOL_API_ID, POOL_API_HASH } from './session-pool.js';

// --- Configuration ---
// Legacy single-session fallback (still works if no pool sessions in DB)
const LEGACY_API_ID = parseInt(process.env.TELEGRAM_API_ID || String(POOL_API_ID), 10);
const LEGACY_API_HASH = process.env.TELEGRAM_API_HASH || POOL_API_HASH;
const LEGACY_SESSION_STRING = process.env.TELEGRAM_SESSION_STRING || '';
const GATEWAY_URL = process.env.GATEWAY_URL || 'https://api.botcraftwrks.ai';

// BotFather username
const BOTFATHER_USERNAME = 'BotFather';

// Regex to extract bot token from BotFather response
const TOKEN_REGEX = /\d+:[A-Za-z0-9_-]+/;

// Rate limiting: minimum 90 seconds between BotFather bot creation calls
// Telegram will lock the account for 24 hours if you create bots too fast
const BOTFATHER_MIN_INTERVAL_MS = 90_000;
let lastProvisionTime = 0;

async function enforceBotFatherRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastProvisionTime;
  if (lastProvisionTime > 0 && elapsed < BOTFATHER_MIN_INTERVAL_MS) {
    const waitMs = BOTFATHER_MIN_INTERVAL_MS - elapsed;
    console.log(`[provisioner] Rate limit: waiting ${Math.ceil(waitMs / 1000)}s before next BotFather call`);
    await sleep(waitMs);
  }
  lastProvisionTime = Date.now();
}

// Random ID generator for unique usernames
function generateRandomId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a new Telegram client from a session string and credentials
 */
function createClient(sessionString: string, apiId: number, apiHash: string): TelegramClient {
  return new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
    connectionRetries: 5,
  });
}

/**
 * Create a client using legacy single-session env vars (fallback)
 */
function createLegacyClient(): TelegramClient {
  if (!LEGACY_SESSION_STRING) {
    throw new Error('No sessions available. Add a session via POST /admin/sessions or set TELEGRAM_SESSION_STRING.');
  }
  return createClient(LEGACY_SESSION_STRING, LEGACY_API_ID, LEGACY_API_HASH);
}

/**
 * Send a message to BotFather and wait for a NEW response.
 * Polls until BotFather sends a message with a higher ID than before we sent,
 * avoiding stale responses from previous steps being captured by a fixed wait.
 */
async function sendToBotFather(
  client: TelegramClient,
  message: string,
  maxWaitMs: number = 12000
): Promise<string> {
  const botFather = await client.getEntity(BOTFATHER_USERNAME);

  // Snapshot highest known message ID before we send
  const before = await client.getMessages(botFather, { limit: 1 });
  const lastKnownId = before.length > 0 ? before[0].id : 0;

  await client.sendMessage(botFather, { message });

  // Poll until BotFather sends a genuinely new message
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    await sleep(1500);
    const latest = await client.getMessages(botFather, { limit: 1 });
    if (latest.length > 0 && latest[0].id > lastKnownId) {
      return latest[0].message || '';
    }
  }

  throw new Error(`BotFather did not respond within ${maxWaitMs / 1000}s`);
}

/**
 * Set webhook URL for a bot token
 */
async function setWebhook(token: string, webhookUrl: string): Promise<boolean> {
  const url = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json() as { ok: boolean; description?: string };
    
    if (!data.ok) {
      console.error('[provisioner] Failed to set webhook:', data.description);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[provisioner] Error setting webhook:', error);
    return false;
  }
}

/**
 * Get bot info to retrieve username
 */
async function getBotInfo(token: string): Promise<{ username: string } | null> {
  const url = `https://api.telegram.org/bot${token}/getMe`;
  
  try {
    const response = await fetch(url);
    const data = await response.json() as { 
      ok: boolean; 
      result?: { username: string };
    };
    
    if (!data.ok || !data.result) {
      return null;
    }
    
    return { username: data.result.username };
  } catch (error) {
    console.error('[provisioner] Error getting bot info:', error);
    return null;
  }
}

export interface ProvisionResult {
  token: string;
  username: string;
  hash: string;
  webhookUrl: string;
}

/**
 * Provision a new Telegram bot via BotFather
 * 
 * @param customerName - Customer name for bot display name
 * @param email - Customer email (for logging)
 * @returns Bot token, username, and webhook hash
 */
async function runBotFatherFlow(
  client: TelegramClient,
  customerName: string,
  email: string
): Promise<ProvisionResult> {
  // Cancel any stuck flow first — always start clean
  console.log('[provisioner] Sending /cancel to clear any stuck BotFather state...');
  await sendToBotFather(client, '/cancel', 3000);

  // Start new bot creation
  console.log('[provisioner] Sending /newbot...');
  await sendToBotFather(client, '/newbot', 3000);

  // Send bot display name
  const botName = `Tiger Bot - ${customerName}`.substring(0, 64);
  console.log(`[provisioner] Setting bot name: ${botName}`);
  await sendToBotFather(client, botName, 3000);

  // Send unique username and wait for token
  const randomId = generateRandomId();
  const botUsername = `Tiger_${randomId}_bot`;
  console.log(`[provisioner] Setting username: ${botUsername}`);
  const response = await sendToBotFather(client, botUsername, 5000);

  const tokenMatch = response.match(TOKEN_REGEX);

  if (!tokenMatch) {
    console.warn(`[provisioner] No token in BotFather response. Response was: "${response.substring(0, 200)}"`);

    // Username was likely taken — restart the full flow cleanly, don't just send another username
    console.log('[provisioner] Restarting flow with new username...');
    await sendToBotFather(client, '/cancel', 3000);
    await sendToBotFather(client, '/newbot', 3000);
    await sendToBotFather(client, botName, 3000);

    const retryId = generateRandomId();
    const retryUsername = `Tiger_${retryId}_bot`;
    console.log(`[provisioner] Retry username: ${retryUsername}`);
    const retryResponse = await sendToBotFather(client, retryUsername, 5000);

    const retryMatch = retryResponse.match(TOKEN_REGEX);
    if (!retryMatch) {
      console.error(`[provisioner] Retry also failed. BotFather said: "${retryResponse.substring(0, 200)}"`);
      throw new Error(`Failed to create bot - BotFather did not return a token. Last response: "${retryResponse.substring(0, 100)}"`);
    }

    const token = retryMatch[0];
    const hash = hashToken(token).substring(0, 16);
    const webhookUrl = `${GATEWAY_URL}/webhooks/${hash}`;
    await setWebhook(token, webhookUrl);
    const botInfo = await getBotInfo(token);
    const actualUsername = botInfo?.username || retryUsername;
    console.log(`[provisioner] Bot provisioned successfully: @${actualUsername}`);
    return { token, username: actualUsername, hash, webhookUrl };
  }

  const token = tokenMatch[0];
  const hash = hashToken(token).substring(0, 16);
  const webhookUrl = `${GATEWAY_URL}/webhooks/${hash}`;
  await setWebhook(token, webhookUrl);
  const botInfo = await getBotInfo(token);
  const actualUsername = botInfo?.username || botUsername;
  console.log(`[provisioner] Bot provisioned successfully: @${actualUsername}`);
  return { token, username: actualUsername, hash, webhookUrl };
}

export async function provisionNewBot(
  customerName: string,
  email: string,
  pool?: SessionPool
): Promise<ProvisionResult> {
  console.log(`[provisioner] Starting bot provision for: ${email}`);

  // Enforce 90-second minimum between BotFather calls to avoid 24-hour lockout
  await enforceBotFatherRateLimit();

  // Try pool sessions first, fall back to legacy env var
  if (pool) {
    const session = await pool.acquireSession();
    if (session) {
      console.log(`[provisioner] Using pool session for ${session.phoneNumber} (${session.botsCreated} bots created)`);
      const client = createClient(session.sessionString, session.apiId, session.apiHash);
      try {
        await client.connect();
        const result = await runBotFatherFlow(client, customerName, email);
        await pool.recordBotCreated(session.id);
        return result;
      } catch (err: any) {
        // Detect BotFather rate limit and mark session
        if (err.message?.toLowerCase().includes('sorry') || err.message?.includes('too many')) {
          console.warn(`[provisioner] Pool session ${session.phoneNumber} hit rate limit`);
          await pool.markRateLimited(session.id, err.message);
        }
        throw err;
      } finally {
        await client.disconnect();
      }
    }
    console.warn('[provisioner] No pool sessions available, falling back to legacy session');
  }

  // Legacy single-session fallback
  const client = createLegacyClient();
  try {
    await client.connect();
    console.log('[provisioner] Connected to Telegram (legacy session)');
    return await runBotFatherFlow(client, customerName, email);
  } finally {
    await client.disconnect();
    console.log('[provisioner] Disconnected from Telegram');
  }
}

/**
 * Delete a bot via BotFather (for cleanup)
 */
export async function deleteBot(botUsername: string): Promise<boolean> {
  console.log(`[provisioner] Deleting bot: @${botUsername}`);
  
  const client = createClient();
  
  try {
    await client.connect();
    
    // Send /deletebot command
    await sendToBotFather(client, '/deletebot', 2000);
    
    // Select the bot to delete
    const response = await sendToBotFather(client, `@${botUsername}`, 2000);
    
    // Confirm deletion
    if (response.includes('Are you sure')) {
      await sendToBotFather(client, 'Yes, I am absolutely sure.', 2000);
      console.log(`[provisioner] Bot @${botUsername} deleted successfully`);
      return true;
    }
    
    console.warn(`[provisioner] Unexpected response during deletion: ${response}`);
    return false;
    
  } finally {
    await client.disconnect();
  }
}
