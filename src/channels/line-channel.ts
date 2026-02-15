/**
 * Tiger Bot Scout - LINE Channel
 * For Thailand market where LINE is dominant
 *
 * LINE Messaging API docs: https://developers.line.biz/en/docs/messaging-api/
 */

import crypto from 'crypto';

// LINE Configuration
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_API_URL = 'https://api.line.me/v2/bot';

/**
 * Verify LINE webhook signature
 */
export function verifyLineSignature(body: string, signature: string): boolean {
  if (!LINE_CHANNEL_SECRET) return false;

  const hash = crypto
    .createHmac('sha256', LINE_CHANNEL_SECRET)
    .update(body)
    .digest('base64');

  return hash === signature;
}

/**
 * LINE Message Types
 */
export interface LineEvent {
  type: 'message' | 'follow' | 'unfollow' | 'postback';
  replyToken: string;
  source: {
    type: 'user' | 'group' | 'room';
    userId: string;
    groupId?: string;
    roomId?: string;
  };
  message?: {
    type: 'text' | 'image' | 'video' | 'audio' | 'location' | 'sticker';
    id: string;
    text?: string;
  };
  timestamp: number;
}

export interface LineWebhookBody {
  events: LineEvent[];
  destination: string;
}

/**
 * Send reply message via LINE
 */
export async function replyMessage(replyToken: string, messages: Array<{ type: string; text: string }>): Promise<boolean> {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.error('[line-channel] No LINE_CHANNEL_ACCESS_TOKEN configured');
    return false;
  }

  try {
    const response = await fetch(`${LINE_API_URL}/message/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        replyToken,
        messages
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[line-channel] Reply failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[line-channel] Reply error:', error);
    return false;
  }
}

/**
 * Send push message to a user (doesn't require reply token)
 */
export async function pushMessage(userId: string, messages: Array<{ type: string; text: string }>): Promise<boolean> {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.error('[line-channel] No LINE_CHANNEL_ACCESS_TOKEN configured');
    return false;
  }

  try {
    const response = await fetch(`${LINE_API_URL}/message/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        to: userId,
        messages
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[line-channel] Push failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[line-channel] Push error:', error);
    return false;
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<{ displayName: string; pictureUrl?: string } | null> {
  if (!LINE_CHANNEL_ACCESS_TOKEN) return null;

  try {
    const response = await fetch(`${LINE_API_URL}/profile/${userId}`, {
      headers: {
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      }
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Format message for LINE (supports rich messages)
 */
export function formatForLine(text: string): Array<{ type: string; text: string }> {
  // LINE has 5000 char limit per message, can send up to 5 messages
  const maxLength = 4900;
  const messages: Array<{ type: string; text: string }> = [];

  // Remove markdown formatting
  let clean = text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/#{1,6}\s/g, '')
    .trim();

  // Split into chunks if needed
  while (clean.length > 0) {
    messages.push({
      type: 'text',
      text: clean.substring(0, maxLength)
    });
    clean = clean.substring(maxLength);
    if (messages.length >= 5) break; // LINE limit
  }

  return messages;
}

/**
 * LINE webhook route handler
 */
export function createLineWebhookHandler(
  processMessage: (userId: string, text: string, replyFn: (msg: string) => Promise<void>) => Promise<void>
) {
  return async (req: any, res: any) => {
    // Verify signature
    const signature = req.headers['x-line-signature'];
    const body = JSON.stringify(req.body);

    if (!verifyLineSignature(body, signature)) {
      console.warn('[line-channel] Invalid signature');
      res.status(401).send('Invalid signature');
      return;
    }

    const { events } = req.body as LineWebhookBody;

    for (const event of events) {
      if (event.type === 'message' && event.message?.type === 'text') {
        const userId = event.source.userId;
        const text = event.message.text || '';
        const replyToken = event.replyToken;

        console.log(`[line-channel] Message from ${userId}: ${text}`);

        const replyFn = async (msg: string) => {
          await replyMessage(replyToken, formatForLine(msg));
        };

        await processMessage(userId, text, replyFn);
      }

      if (event.type === 'follow') {
        // New user followed the bot
        const userId = event.source.userId;
        console.log(`[line-channel] New follower: ${userId}`);

        await replyMessage(event.replyToken, [{
          type: 'text',
          text: 'สวัสดี! 🐯 ยินดีต้อนรับสู่ Tiger Bot\n\nHey! Welcome to Tiger Bot. I help you find customers and grow your business.\n\nType "start" to begin!'
        }]);
      }
    }

    res.status(200).send('OK');
  };
}

/**
 * Setup instructions for LINE
 */
export const LINE_SETUP_INSTRUCTIONS = `
# LINE Channel Setup for Tiger Bot

## Prerequisites
1. LINE Business Account
2. LINE Developers Console access

## Steps

1. Go to https://developers.line.biz/console/
2. Create a new Provider (or use existing)
3. Create a new Messaging API Channel
4. Get your credentials:
   - Channel Secret → LINE_CHANNEL_SECRET
   - Channel Access Token → LINE_CHANNEL_ACCESS_TOKEN

5. Set webhook URL:
   https://api.botcraftwrks.ai/line/webhook

6. Enable webhook and disable auto-reply

## Environment Variables
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token

## Test
Send a message to your LINE bot and check the logs.
`;
