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
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { decrypt } from '../shared/crypto.js';
import {
  InboundJobData,
  VirtualBotContext,
  TelegramUpdate,
  TelegramMessage,
  QUEUE_NAMES,
} from '../shared/types.js';

// --- Gemini Client for AI Conversations (much cheaper than OpenAI) ---
const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

if (!gemini) {
  console.warn('[worker] WARNING: GEMINI_API_KEY not set - AI conversations disabled');
}

// --- Anthropic Client for Script Generation ---
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

if (!anthropic) {
  console.warn('[worker] WARNING: ANTHROPIC_API_KEY not set - script generation disabled');
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

I find qualified prospects every morning and write personalized outreach scripts for you.

*Commands:*
• /today — See today's prospects
• /script [name] — Get a script written for a specific prospect
• /help — All commands

Your daily report arrives at 7 AM Bangkok time.
Ready? Let's go. 🚀
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

/today — Today's top prospects
/script [name] — Get a personalized outreach script
/report — Same as /today
/help — Show this help message
/feedback — Send feedback

*Example:*
After seeing Nancy in your report → type:
\`/script Nancy\`

*Tips:*
• Daily report arrives automatically at 7 AM Bangkok
• Scripts are written in your prospect's language
• After using a script, let me know: 👎 /fb\\_no · 👍 /fb\\_replied · 🎯 /fb\\_converted
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

async function handleScriptCommand(
  ctx: VirtualBotContext,
  message: TelegramMessage
): Promise<void> {
  const chatId = message.chat.id;
  const text = message.text || '';

  const prospectName = text.split(' ').slice(1).join(' ').trim();

  if (!prospectName) {
    await ctx.bot.sendMessage(
      chatId,
      "Please include a name. Example: `/script Nancy`",
      { parse_mode: 'Markdown' }
    );
    return;
  }

  if (!anthropic) {
    await ctx.bot.sendMessage(chatId, "Script generation is not configured. Contact support.");
    return;
  }

  await ctx.bot.sendMessage(chatId, `✍️ Writing script for *${prospectName}*...`, { parse_mode: 'Markdown' });

  // Find prospect by name (partial, case-insensitive)
  const allProspects = await prisma.prospect.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { score: 'desc' },
  });

  const prospect = allProspects.find(p =>
    p.name.toLowerCase().includes(prospectName.toLowerCase())
  );

  if (!prospect) {
    await ctx.bot.sendMessage(
      chatId,
      `❌ No prospect named "${prospectName}" found. Use /today to see your current prospects.`
    );
    return;
  }

  // Load tenant ICP data
  const tenant = await prisma.tenant.findUnique({ where: { id: ctx.tenantId } });
  const interview = (tenant?.interview_data as Record<string, any>) || {};
  const i1 = interview.interview1 || {};
  const i2 = interview.interview2 || {};

  const icpProduct = i1.product || 'health and wellness';
  const icpApproach = i1.approach_style || 'friendly, authentic';
  const icpIncomeExample = i1.income_example || 'flexible income';
  const signals = (Array.isArray(prospect.signals) ? prospect.signals : []) as string[];

  const prompt = `You are a network marketing sales coach. Generate a personalized outreach script.

RULES:
1. Write in ${prospect.language || 'English'} ONLY
2. Opening MUST reference something specific from what they posted or their situation
3. NEVER mention the company or product name in the opening message
4. Sound like a real person, not a template
5. Keep the full message under 160 words
6. Soft ask only — no pressure, no hype

PROSPECT:
Name: ${prospect.name}
Source: ${prospect.source || 'online'}
What they posted/said: ${signals.length > 0 ? signals.join(' | ') : prospect.summary || 'Looking for opportunities'}
Summary: ${prospect.summary || ''}

YOU (the person sending this):
Product you represent: ${icpProduct}
Approach style: ${icpApproach}
Income example: ${icpIncomeExample}

Return ONLY the script message text. No labels, no JSON, no explanation. Just the message to send.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const script = (response.content[0] as Anthropic.TextBlock).text.trim();

    // Save to DB
    const saved = await prisma.script.create({
      data: {
        tenantId: ctx.tenantId,
        prospectId: prospect.id,
        language: prospect.language || 'en',
        opening: script.split('\n')[0] || script.slice(0, 100),
        fullScript: script,
        aiModel: 'claude-sonnet-4-6',
      },
    });

    // Update prospect status
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: { status: 'scripted', scriptedAt: new Date() },
    });

    const scriptId = saved.id.slice(0, 8); // short ID for feedback commands
    const reply = [
      `📝 *Script for ${prospect.name}*`,
      ``,
      script,
      ``,
      `─────────────────────────────`,
      `After sending this, let me know how it went:`,
      `👎 /fb\\_${scriptId}\\_no`,
      `👍 /fb\\_${scriptId}\\_replied`,
      `🎯 /fb\\_${scriptId}\\_converted`,
    ].join('\n');

    await ctx.bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error(`[worker] Script generation failed for tenant ${ctx.tenantId}:`, error);
    await ctx.bot.sendMessage(
      chatId,
      "😓 Couldn't generate the script right now. Please try again in a moment."
    );
  }
}

async function handleFeedbackOutcome(
  ctx: VirtualBotContext,
  message: TelegramMessage
): Promise<void> {
  const chatId = message.chat.id;
  const text = message.text || '';

  // Parse /fb_{shortId}_{outcome}
  const match = text.match(/^\/fb_([a-z0-9]+)_(no|replied|converted)$/i);
  if (!match) return;

  const shortId = match[1];
  const outcomeRaw = match[2].toLowerCase();
  const outcomeMap: Record<string, string> = {
    no: 'no_response',
    replied: 'replied',
    converted: 'converted',
  };
  const outcome = outcomeMap[outcomeRaw];

  try {
    // Find the script by short ID prefix
    const scripts = await prisma.script.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const script = scripts.find(s => s.id.startsWith(shortId));
    if (!script) {
      await ctx.bot.sendMessage(chatId, "Couldn't find that script. Try generating a fresh one.");
      return;
    }

    await prisma.script.update({
      where: { id: script.id },
      data: { outcome, feedbackAt: new Date() },
    });

    const statusMap: Record<string, string> = {
      no_response: 'contacted',
      replied: 'replied',
      converted: 'converted',
    };

    await prisma.prospect.update({
      where: { id: script.prospectId },
      data: { status: statusMap[outcome] },
    });

    const replies: Record<string, string> = {
      no_response: "Got it. Sometimes it takes a follow-up. Try again in a few days.",
      replied: "They replied! 🎉 Keep the conversation going. Use /objection if they push back.",
      converted: "🎯 YES! That's a win. I've learned from this script — future ones will be even better.",
    };

    await ctx.bot.sendMessage(chatId, replies[outcome]);

  } catch (error) {
    console.error(`[worker] Feedback error for tenant ${ctx.tenantId}:`, error);
  }
}

async function handleUnknownMessage(
  ctx: VirtualBotContext,
  message: TelegramMessage
): Promise<void> {
  if (!message.chat) {
    console.log('[worker] Skipping message without chat object');
    return;
  }
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

  // Use Gemini for intelligent conversation (much cheaper than OpenAI)
  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const systemPrompt = `You are Tiger Bot Scout, an AI recruiting coach and prospect-finder for network marketers in the wellness/anti-aging space.

YOUR CORE PHILOSOPHY (live by this):
- "If your mouth is closed, your business is closed"
- This business is not a lottery—it's a manufacturing process. You manufacture success by following the system.
- Be a FINISHER, not just a starter. Focus on 1% improvement daily.

THE "THREE THREES" FORMULA (teach this when relevant):
1. Talk to 3 NEW people today - constantly feed your pipeline
2. Do 3 three-way calls today - leverage your upline's credibility
3. Sponsor 3 people this month - consistency builds massive organizations

KEY COACHING PRINCIPLES:
- DRIVE YOUR LINES DEEP: Real wealth comes from depth (levels 4, 5, 6), not just your front line
- Find the "LOCKER": That person who says "Get out of my way, I'm going to do this" - they're usually found deep, not on level 1
- RECRUIT UP: Look for successful people with contacts and credibility, not people who "need" the opportunity
- PLAN BACKWARDS: What do you want at 90? 50? 40? Align daily actions with your ultimate destination
- BE THE PRODUCT: You can't represent wellness if you don't live it

Bot capabilities:
- /today shows today's hot prospects
- /help shows all commands
- Daily prospect reports arrive at 7 AM

Personality: Direct, motivating, action-oriented. Like a coach who believes in them. Use emojis sparingly (1-2 max).
Keep responses concise (2-4 sentences) but impactful. Always push toward ACTION.
When they share wins, celebrate briefly then redirect to "What's your next Three Threes?"
When they share struggles, acknowledge briefly then give ONE specific action step.

The user's first name is: ${firstName}

User message: ${text}`;

      const result = await model.generateContent(systemPrompt);
      const aiResponse = result.response.text();

      if (aiResponse) {
        await ctx.bot.sendMessage(chatId, aiResponse, { parse_mode: 'Markdown' });
        return;
      }
    } catch (error) {
      console.error(`[worker] Gemini error for tenant ${ctx.tenantId}:`, error);
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
  
  if (!message || !message.chat || !message.text) {
    // Ignore non-text messages or malformed updates
    return;
  }
  
  const text = message.text.trim();
  const command = text.split(' ')[0].toLowerCase();
  
  // Remove @botusername suffix if present
  const cleanCommand = command.split('@')[0];
  
  // Feedback outcome commands: /fb_{shortId}_{outcome}
  if (/^\/fb_[a-z0-9]+_(no|replied|converted)$/i.test(cleanCommand)) {
    await handleFeedbackOutcome(ctx, message);
    return;
  }

  switch (cleanCommand) {
    case '/start':
      await handleStartCommand(ctx, message);
      break;
    case '/help':
      await handleHelpCommand(ctx, message);
      break;
    case '/today':
    case '/report':
      await handleTodayCommand(ctx, message);
      break;
    case '/script':
      await handleScriptCommand(ctx, message);
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
  
  // Look up tenant by botTokenHash (include suspended for trial-expiry messaging)
  const tenant = await prisma.tenant.findFirst({
    where: {
      botTokenHash: hash,
      status: { in: ['active', 'suspended'] },
    },
  });

  if (!tenant) {
    console.warn(`[worker] No active tenant found for hash: ${hash.substring(0, 8)}...`);
    return;
  }

  // If suspended, drop silently
  if (tenant.status === 'suspended') {
    console.log(`[worker] Dropped job for suspended tenant ${tenant.id}`);
    return;
  }

  // Check trial expiry
  if (tenant.trialEndsAt && new Date() > tenant.trialEndsAt) {
    console.log(`[worker] Trial expired for tenant ${tenant.id} - suspending`);
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { status: 'suspended' },
    });
    // Notify the customer on Telegram if we have their chat_id
    if (tenant.chat_id) {
      let decryptedToken: string;
      try {
        decryptedToken = decrypt(tenant.botToken);
        const bot = getOrCreateBot(decryptedToken, tenant.id);
        await bot.sendMessage(
          tenant.chat_id,
          `Your Tiger Bot trial has ended. 🐯\n\nTo keep your bot running, visit *botcraftwrks.ai* to upgrade.`,
          { parse_mode: 'Markdown' }
        );
      } catch (e) {
        console.error(`[worker] Failed to send trial-expiry message to tenant ${tenant.id}:`, e);
      }
    }
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

  // Capture chat_id from every inbound message — ensures daily reports can reach this customer
  const incomingChatId = (update as TelegramUpdate).message?.chat?.id;
  if (incomingChatId && !tenant.chat_id) {
    prisma.tenant.update({
      where: { id: tenant.id },
      data: { chat_id: String(incomingChatId) },
    }).catch(err => console.error(`[worker] Failed to save chat_id for tenant ${tenant.id}:`, err));
  }

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
