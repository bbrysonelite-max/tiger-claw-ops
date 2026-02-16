/**
 * Tiger Bot Scout - Fleet Worker
 * BullMQ worker that processes inbound Telegram updates
 * Implements virtual bot pattern - instantiates bots on-demand per tenant
 */

import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import TelegramBot from 'node-telegram-bot-api';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { decrypt } from '../shared/crypto.js';
import {
  InboundJobData,
  VirtualBotContext,
  TelegramUpdate,
  TelegramMessage,
  QUEUE_NAMES,
} from '../shared/types.js';

// --- OpenAI Client for AI Conversations ---
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

if (!openai) {
  console.warn('[worker] WARNING: OPENAI_API_KEY not set - AI conversations disabled');
}

// --- Configuration ---
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '10', 10);

// --- Database Client ---
const prisma = new PrismaClient();

// --- Redis Connection ---
const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisConnection.on('connect', () => {
  console.log('[worker] Connected to Redis');
});

redisConnection.on('error', (err: Error) => {
  console.error('[worker] Redis connection error:', err.message);
});

// --- Bot Instance Cache ---
// Short-lived cache to avoid re-creating bots for rapid sequential messages
const botCache = new Map<string, { bot: TelegramBot; timestamp: number }>();
const BOT_CACHE_TTL = 60000; // 1 minute

/**
 * Get or create a TelegramBot instance for a tenant
 */
function getOrCreateBot(token: string, tenantId: string): TelegramBot {
  const cached = botCache.get(tenantId);
  
  if (cached && Date.now() - cached.timestamp < BOT_CACHE_TTL) {
    return cached.bot;
  }
  
  // Create new bot instance (polling disabled - we use webhooks)
  const bot = new TelegramBot(token, { polling: false });
  
  botCache.set(tenantId, { bot, timestamp: Date.now() });
  
  return bot;
}

/**
 * Clean up expired bot instances from cache
 */
function cleanupBotCache(): void {
  const now = Date.now();
  for (const [tenantId, entry] of botCache.entries()) {
    if (now - entry.timestamp > BOT_CACHE_TTL) {
      botCache.delete(tenantId);
    }
  }
}

// Run cache cleanup every 5 minutes
setInterval(cleanupBotCache, 5 * 60 * 1000);

// --- Command Handlers ---

async function handleStartCommand(
  ctx: VirtualBotContext,
  message: TelegramMessage
): Promise<void> {
  const chatId = message.chat.id;
  const firstName = message.from?.first_name || 'there';
  
  const welcomeText = `
🐯 *Welcome to Tiger Bot Scout, ${firstName}!*

I'm your AI-powered recruiting assistant. I help network marketers find and connect with prospects.

*Here's what I can do:*
• 📊 /today - Get your daily prospect report
• 💬 /help - See all available commands
• ⭐ /feedback - Share your thoughts with us

Ready to find your next team member? Let's go! 🚀
  `.trim();
  
  await ctx.bot.sendMessage(chatId, welcomeText, { parse_mode: 'Markdown' });
}

async function handleHelpCommand(
  ctx: VirtualBotContext,
  message: TelegramMessage
): Promise<void> {
  const chatId = message.chat.id;
  
  const helpText = `
🐯 *Tiger Bot Scout Commands*

/start - Welcome message and introduction
/today - Get today's prospect report
/help - Show this help message
/feedback - Send feedback to improve the bot

*Tips:*
• Your daily report arrives automatically at 7 AM
• Reply to any prospect card to get a custom script
• Use /feedback to help us improve!

_Need more help? Contact support at help@tigerbotscout.com_
  `.trim();
  
  await ctx.bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
}

async function handleTodayCommand(
  ctx: VirtualBotContext,
  message: TelegramMessage
): Promise<void> {
  const chatId = message.chat.id;
  
  try {
    // Get today's prospects for this tenant
    const prospects = await prisma.prospect.findMany({
      where: {
        tenantId: ctx.tenantId,
        status: 'new',
      },
      take: 5,
      orderBy: {
        score: 'desc',
      },
    });
    
    if (prospects.length === 0) {
      await ctx.bot.sendMessage(
        chatId,
        "📭 No new prospects today yet. I'm still searching! Check back later or wait for your 7 AM report.",
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    let reportText = `📊 *Today's Hot Prospects*\n\n`;
    
    for (let i = 0; i < prospects.length; i++) {
      const p = prospects[i];
      const stars = '⭐'.repeat(Math.min(Math.floor(p.score / 20), 5));
      reportText += `*${i + 1}. ${p.name}*\n`;
      reportText += `Score: ${stars} (${p.score}/100)\n`;
      if (p.summary) {
        reportText += `${p.summary}\n`;
      }
      reportText += `\n`;
    }
    
    reportText += `_Reply with a prospect name to get a personalized script!_`;
    
    await ctx.bot.sendMessage(chatId, reportText, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error(`[worker] Error fetching prospects for tenant ${ctx.tenantId}:`, error);
    await ctx.bot.sendMessage(
      chatId,
      "😓 Sorry, I couldn't fetch your prospects right now. Please try again in a moment."
    );
  }
}

async function handleFeedbackCommand(
  ctx: VirtualBotContext,
  message: TelegramMessage
): Promise<void> {
  const chatId = message.chat.id;
  
  const feedbackText = `
⭐ *We'd love your feedback!*

Just type your thoughts and send them as a reply to this message.

What would you like to tell us?
• What's working well?
• What could be improved?
• Any feature requests?

_Your feedback helps make Tiger Bot Scout better for everyone!_
  `.trim();
  
  await ctx.bot.sendMessage(chatId, feedbackText, { parse_mode: 'Markdown' });
}

async function handleUnknownMessage(
  ctx: VirtualBotContext,
  message: TelegramMessage
): Promise<void> {
  const chatId = message.chat.id;
  const text = message.text || '';
  const firstName = message.from?.first_name || 'there';

  // If it's a short message or looks like a typo, suggest help
  if (text.length <= 3) {
    await ctx.bot.sendMessage(
      chatId,
      "🤔 I didn't understand that. Try /help to see what I can do!"
    );
    return;
  }

  // Use OpenAI for intelligent conversation
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are Tiger Bot Scout, a friendly AI recruiting assistant for network marketers. Your job is to help users find and connect with prospects.

Key capabilities you can mention:
- /today command shows today's hot prospects
- /help shows all commands
- Daily reports arrive at 7 AM
- You scan social media to find people interested in wellness, health, and business opportunities

Personality: Friendly, helpful, encouraging. Use emojis sparingly (1-2 per message max).
Keep responses concise (2-4 sentences). Always be helpful and on-topic.
If they ask about something unrelated to recruiting/prospecting, gently steer back to how you can help them find prospects.

The user's first name is: ${firstName}`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      const aiResponse = completion.choices[0]?.message?.content;

      if (aiResponse) {
        await ctx.bot.sendMessage(chatId, aiResponse, { parse_mode: 'Markdown' });
        return;
      }
    } catch (error) {
      console.error(`[worker] OpenAI error for tenant ${ctx.tenantId}:`, error);
      // Fall through to default response
    }
  }

  // Fallback if OpenAI is not configured or fails
  await ctx.bot.sendMessage(
    chatId,
    `Hey ${firstName}! 🐯 I'm here to help you find great prospects. Try /today to see who I've found for you, or /help to see all my commands.`,
    { parse_mode: 'Markdown' }
  );
}

// --- Main Message Handler ---

async function handleTelegramUpdate(
  ctx: VirtualBotContext,
  update: TelegramUpdate
): Promise<void> {
  const message = update.message;
  
  if (!message || !message.text) {
    // Ignore non-text messages for now
    return;
  }
  
  const text = message.text.trim();
  const command = text.split(' ')[0].toLowerCase();
  
  // Remove @botusername suffix if present
  const cleanCommand = command.split('@')[0];
  
  switch (cleanCommand) {
    case '/start':
      await handleStartCommand(ctx, message);
      break;
    case '/help':
      await handleHelpCommand(ctx, message);
      break;
    case '/today':
      await handleTodayCommand(ctx, message);
      break;
    case '/feedback':
      await handleFeedbackCommand(ctx, message);
      break;
    default:
      await handleUnknownMessage(ctx, message);
  }
}

// --- Job Processor ---

async function processInboundJob(job: Job<InboundJobData>): Promise<void> {
  const { hash, update } = job.data;
  
  console.log(`[worker] Processing job ${job.id} for hash: ${hash.substring(0, 8)}...`);
  
  // Look up tenant by botTokenHash
  const tenant = await prisma.tenant.findFirst({
    where: {
      botTokenHash: hash,
      status: 'active',
    },
  });
  
  if (!tenant) {
    console.warn(`[worker] No active tenant found for hash: ${hash.substring(0, 8)}...`);
    return;
  }
  
  // Decrypt the bot token
  let decryptedToken: string;
  try {
    decryptedToken = decrypt(tenant.botToken);
  } catch (error) {
    console.error(`[worker] Failed to decrypt token for tenant ${tenant.id}:`, error);
    return;
  }
  
  // Get or create bot instance
  const bot = getOrCreateBot(decryptedToken, tenant.id);
  
  // Create virtual bot context
  const ctx: VirtualBotContext = {
    tenantId: tenant.id,
    token: decryptedToken,
    bot,
  };
  
  // Handle the update
  try {
    await handleTelegramUpdate(ctx, update as TelegramUpdate);
    console.log(`[worker] Successfully processed job ${job.id}`);
  } catch (error) {
    console.error(`[worker] Error handling update for tenant ${tenant.id}:`, error);
    throw error; // Let BullMQ retry
  }
}

// --- Worker Instance ---

const worker = new Worker(
  QUEUE_NAMES.INBOUND,
  processInboundJob,
  {
    connection: redisConnection,
    concurrency: WORKER_CONCURRENCY,
    limiter: {
      max: 100,
      duration: 1000, // 100 jobs per second max
    },
  }
);

worker.on('completed', (job) => {
  console.log(`[worker] Job ${job.id} completed`);
});

worker.on('failed', (job, error) => {
  console.error(`[worker] Job ${job?.id} failed:`, error.message);
});

worker.on('error', (error) => {
  console.error('[worker] Worker error:', error);
});

// --- Graceful Shutdown ---

const shutdown = async () => {
  console.log('[worker] Shutting down...');
  
  await worker.close();
  await prisma.$disconnect();
  await redisConnection.quit();
  
  // Clear bot cache
  botCache.clear();
  
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log(`[worker] Tiger Bot Fleet Worker started`);
console.log(`[worker] Redis: ${REDIS_URL}`);
console.log(`[worker] Concurrency: ${WORKER_CONCURRENCY}`);
console.log(`[worker] Listening on queue: ${QUEUE_NAMES.INBOUND}`);

export { worker };
