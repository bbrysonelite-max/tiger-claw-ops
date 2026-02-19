/**
 * Tiger Bot Scout - BotFather Provisioner
 * Automated bot creation using gramjs MTProto client
 */

import 'dotenv/config';
import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { hashToken } from '../shared/crypto.js';

// --- Configuration ---
const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0', 10);
const API_HASH = process.env.TELEGRAM_API_HASH || '';
const SESSION_STRING = process.env.TELEGRAM_SESSION_STRING || '';
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
 * Create a new Telegram client with the stored session
 */
function createClient(): TelegramClient {
  if (!API_ID || !API_HASH) {
    throw new Error('TELEGRAM_API_ID and TELEGRAM_API_HASH must be set');
  }
  
  if (!SESSION_STRING) {
    throw new Error('TELEGRAM_SESSION_STRING must be set. Run generate-session script first.');
  }
  
  const session = new StringSession(SESSION_STRING);
  return new TelegramClient(session, API_ID, API_HASH, {
    connectionRetries: 5,
  });
}

/**
 * Send a message to BotFather and wait for response
 */
async function sendToBotFather(
  client: TelegramClient,
  message: string,
  waitMs: number = 2000
): Promise<string> {
  // Get BotFather entity
  const botFather = await client.getEntity(BOTFATHER_USERNAME);
  
  // Send message
  await client.sendMessage(botFather, { message });
  
  // Wait for response
  await sleep(waitMs);
  
  // Get latest messages from BotFather
  const messages = await client.getMessages(botFather, { limit: 1 });
  
  if (messages.length === 0) {
    throw new Error('No response from BotFather');
  }
  
  return messages[0].message || '';
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
  email: string
): Promise<ProvisionResult> {
  console.log(`[provisioner] Starting bot provision for: ${email}`);

  // Enforce 90-second minimum between BotFather calls to avoid 24-hour lockout
  await enforceBotFatherRateLimit();

  const client = createClient();

  try {
    await client.connect();
    console.log('[provisioner] Connected to Telegram');
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
