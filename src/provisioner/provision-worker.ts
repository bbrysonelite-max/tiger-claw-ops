/**
 * Tiger Bot Scout - Provision Worker
 * Processes provision jobs from Stripe webhooks
 * Creates new bots for customers automatically
 */

import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import CryptoJS from 'crypto-js';
import crypto from 'crypto';
import { QUEUE_NAMES, ProvisionJobData } from '../shared/types.js';
import { provisionNewBot } from './userbot.js';

// --- Configuration ---
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'tiger-bot-scout-encryption-key!!';
const ADMIN_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BREVO_API_KEY = process.env.BREVO_API_KEY;

// --- Database Client ---
const prisma = new PrismaClient();

// --- Redis Connection ---
const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisConnection.on('connect', () => {
  console.log('[provision-worker] Connected to Redis');
});

redisConnection.on('error', (err: Error) => {
  console.error('[provision-worker] Redis connection error:', err.message);
});

/**
 * Generate a unique bot username
 */
function generateBotUsername(): string {
  const suffix = crypto.randomBytes(4).toString('hex');
  return `Tiger_${suffix}_bot`;
}

/**
 * Encrypt a bot token using CryptoJS (matching existing format)
 */
function encryptToken(token: string): string {
  return CryptoJS.AES.encrypt(token, ENCRYPTION_KEY).toString();
}

/**
 * Hash a bot token for webhook routing
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Send welcome email to new customer via Brevo
 */
async function sendWelcomeEmail(email: string, name: string, botUsername: string): Promise<void> {
  if (!BREVO_API_KEY) {
    console.warn('[provision-worker] No BREVO_API_KEY — skipping welcome email');
    return;
  }

  const displayName = name || 'there';
  const html = `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
  <h2 style="margin:0 0 8px">Your Tiger Bot is ready 🐯</h2>
  <p style="margin:0 0 24px;color:#555">Hi ${displayName}, your personal prospect-hunting bot has been created.</p>

  <div style="background:#f5f5f5;border-radius:8px;padding:20px 24px;margin:0 0 24px">
    <p style="margin:0 0 4px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.5px">Your bot username</p>
    <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:.5px">@${botUsername}</p>
  </div>

  <p style="margin:0 0 8px"><strong>To get started:</strong></p>
  <ol style="margin:0 0 24px;padding-left:20px;line-height:1.8">
    <li>Open Telegram</li>
    <li>Search <strong>@${botUsername}</strong></li>
    <li>Tap <strong>Start</strong> or type <code>/start</code></li>
    <li>Your bot will introduce itself and walk you through setup</li>
  </ol>

  <p style="margin:0 0 24px">Your bot will find prospects for you every day and deliver a morning report with personalized outreach scripts — ready to send.</p>

  <p style="margin:0;color:#888;font-size:13px">Questions? Reply to this email or message <a href="https://t.me/tigerbotscout">@tigerbotscout</a> on Telegram.</p>
</div>`;

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { email: 'noreply@botcraftwrks.ai', name: 'Tiger Bot Scout' },
      to: [{ email, name: name || undefined }],
      subject: `Your Tiger Bot is ready — @${botUsername}`,
      htmlContent: html,
    }),
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json();
      console.error('[provision-worker] Welcome email failed:', JSON.stringify(err));
    } else {
      console.log(`[provision-worker] Welcome email sent to ${email}`);
    }
  }).catch((err) => {
    console.error('[provision-worker] Welcome email error:', err.message);
  });
}

/**
 * Process a provision job
 */
async function processProvisionJob(job: Job<ProvisionJobData>): Promise<any> {
  const { email, name, stripeId, inviteTokenId, trialDays } = job.data;

  console.log(`[provision-worker] Processing provision for: ${email}`);

  // Check if tenant already exists
  const existing = await prisma.tenant.findUnique({
    where: { email }
  });

  if (existing) {
    console.log(`[provision-worker] Tenant already exists: ${email}`);
    return { success: true, existing: true, tenantId: existing.id };
  }

  // Auto-provision a real bot via BotFather using gramjs MTProto
  let tenant;
  try {
    console.log(`[provision-worker] Starting auto-provision via BotFather for: ${email}`);
    const result = await provisionNewBot(name || 'New Customer', email);

    const encryptedToken = encryptToken(result.token);

    const trialEndsAt = trialDays && trialDays > 0
      ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)
      : null;

    tenant = await prisma.tenant.create({
      data: {
        email,
        name: name || 'New Customer',
        stripeId: stripeId || null,
        botToken: encryptedToken,
        botTokenHash: result.hash,
        botUsername: result.username,
        inviteTokenId: inviteTokenId || null,
        trialEndsAt,
        status: 'active',
      }
    });

    console.log(`[provision-worker] Bot provisioned and tenant created: ${tenant.id} (@${result.username})`);

    if (ADMIN_BOT_TOKEN && process.env.TELEGRAM_REPORT_CHAT_ID) {
      const message = `✅ *New Customer Bot Created!*\n\n` +
        `Email: ${email}\n` +
        `Name: ${name || 'Not provided'}\n` +
        `Bot: @${result.username}\n` +
        `Stripe: ${stripeId || 'N/A'}`;

      await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_REPORT_CHAT_ID,
          text: message,
          parse_mode: 'Markdown'
        })
      }).catch(console.error);
    }

    // Welcome email to customer
    await sendWelcomeEmail(email, name || 'New Customer', result.username);

    // Mark invite token as claimed
    if (inviteTokenId) {
      await prisma.inviteToken.update({
        where: { id: inviteTokenId },
        data: { claimedBy: email, claimedAt: new Date(), tenantId: tenant.id },
      }).catch(console.error);
    }

    return {
      success: true,
      tenantId: tenant.id,
      email,
      status: 'active',
      botUsername: result.username,
      trialEndsAt: trialEndsAt?.toISOString() || null,
    };

  } catch (provisionError: any) {
    console.error(`[provision-worker] Auto-provision failed for ${email}:`, provisionError.message);

    // Fall back to a pending record so the signup isn't lost
    const uniquePlaceholder = `PENDING_${crypto.randomBytes(16).toString('hex')}`;
    tenant = await prisma.tenant.create({
      data: {
        email,
        name: name || 'New Customer',
        stripeId: stripeId || null,
        botToken: uniquePlaceholder,
        botTokenHash: crypto.randomBytes(16).toString('hex'),
        botUsername: generateBotUsername(),
        status: 'provisioning',
      }
    });

    console.log(`[provision-worker] Created pending tenant: ${tenant.id} (auto-provision failed)`);

    if (ADMIN_BOT_TOKEN && process.env.TELEGRAM_REPORT_CHAT_ID) {
      const message = `⚠️ *New Signup - Manual Bot Needed*\n\n` +
        `Email: ${email}\n` +
        `Name: ${name || 'Not provided'}\n` +
        `Stripe: ${stripeId || 'N/A'}\n\n` +
        `Auto-provision failed: ${provisionError.message}\n` +
        `Run: /provision ${email}`;

      await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_REPORT_CHAT_ID,
          text: message,
          parse_mode: 'Markdown'
        })
      }).catch(console.error);
    }

    return {
      success: true,
      tenantId: tenant.id,
      email,
      status: 'provisioning',
      note: `Auto-provision failed: ${provisionError.message}`,
    };
  }
}

// --- Worker Instance ---
const worker = new Worker(
  QUEUE_NAMES.PROVISION,
  processProvisionJob,
  {
    connection: redisConnection,
    concurrency: 1, // Process one at a time
  }
);

worker.on('completed', (job) => {
  console.log(`[provision-worker] Job ${job.id} completed`);
});

worker.on('failed', (job, error) => {
  console.error(`[provision-worker] Job ${job?.id} failed:`, error.message);
});

worker.on('error', (error) => {
  console.error('[provision-worker] Worker error:', error);
});

// --- Graceful Shutdown ---
const shutdown = async () => {
  console.log('[provision-worker] Shutting down...');
  await worker.close();
  await prisma.$disconnect();
  await redisConnection.quit();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log(`[provision-worker] Tiger Bot Provision Worker started`);
console.log(`[provision-worker] Redis: ${REDIS_URL}`);
console.log(`[provision-worker] Listening on queue: ${QUEUE_NAMES.PROVISION}`);

export { worker };
