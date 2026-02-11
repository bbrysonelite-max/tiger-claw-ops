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
export async function provisionNewBot(
  customerName: string,
  email: string
): Promise<ProvisionResult> {
  console.log(`[provisioner] Starting bot provision for: ${email}`);
  
  const client = createClient();
  
  try {
    // Connect to Telegram
    await client.connect();
    console.log('[provisioner] Connected to Telegram');
    
    // Step 1: Start new bot creation
    console.log('[provisioner] Sending /newbot command...');
    await sendToBotFather(client, '/newbot', 2000);
    
    // Step 2: Send bot display name
    const botName = `Tiger Bot - ${customerName}`.substring(0, 64);
    console.log(`[provisioner] Setting bot name: ${botName}`);
    await sendToBotFather(client, botName, 2000);
    
    // Step 3: Send unique username
    const randomId = generateRandomId();
    const botUsername = `Tiger_${randomId}_bot`;
    console.log(`[provisioner] Setting username: ${botUsername}`);
    
    const response = await sendToBotFather(client, botUsername, 3000);
    
    // Step 4: Extract token from response
    const tokenMatch = response.match(TOKEN_REGEX);
    
    if (!tokenMatch) {
      // Username might be taken, try again with different ID
      console.log('[provisioner] Username taken, retrying with new ID...');
      
      const retryId = generateRandomId();
      const retryUsername = `Tiger_${retryId}_bot`;
      const retryResponse = await sendToBotFather(client, retryUsername, 3000);
      
      const retryMatch = retryResponse.match(TOKEN_REGEX);
      if (!retryMatch) {
        throw new Error('Failed to create bot - could not extract token from BotFather response');
      }
      
      const token = retryMatch[0];
      const hash = hashToken(token).substring(0, 16);
      const webhookUrl = `${GATEWAY_URL}/webhooks/${hash}`;
      
      // Set webhook
      console.log(`[provisioner] Setting webhook: ${webhookUrl}`);
      await setWebhook(token, webhookUrl);
      
      // Get actual username from bot info
      const botInfo = await getBotInfo(token);
      const actualUsername = botInfo?.username || retryUsername;
      
      console.log(`[provisioner] Bot provisioned successfully: @${actualUsername}`);
      
      return {
        token,
        username: actualUsername,
        hash,
        webhookUrl,
      };
    }
    
    const token = tokenMatch[0];
    const hash = hashToken(token).substring(0, 16);
    const webhookUrl = `${GATEWAY_URL}/webhooks/${hash}`;
    
    // Set webhook
    console.log(`[provisioner] Setting webhook: ${webhookUrl}`);
    await setWebhook(token, webhookUrl);
    
    // Get actual username from bot info
    const botInfo = await getBotInfo(token);
    const actualUsername = botInfo?.username || botUsername;
    
    console.log(`[provisioner] Bot provisioned successfully: @${actualUsername}`);
    
    return {
      token,
      username: actualUsername,
      hash,
      webhookUrl,
    };
    
  } finally {
    // Always disconnect
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
