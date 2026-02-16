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

// --- Configuration ---
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'tiger-bot-scout-encryption-key!!';
const ADMIN_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

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
 * Process a provision job
 */
async function processProvisionJob(job: Job<ProvisionJobData>): Promise<any> {
  const { email, name, stripeId } = job.data;

  console.log(`[provision-worker] Processing provision for: ${email}`);

  // Check if tenant already exists
  const existing = await prisma.tenant.findUnique({
    where: { email }
  });

  if (existing) {
    console.log(`[provision-worker] Tenant already exists: ${email}`);
    return { success: true, existing: true, tenantId: existing.id };
  }

  // For now, we can't auto-create bots without BotFather interaction
  // This would require the gramjs session to create bots programmatically
  // Instead, we'll create a pending tenant record

  const botUsername = generateBotUsername();

  // Create a placeholder tenant that needs manual bot creation
  const tenant = await prisma.tenant.create({
    data: {
      email,
      name: name || 'New Customer',
      stripeId: stripeId || null,
      botToken: 'PENDING', // Placeholder
      botTokenHash: crypto.randomBytes(16).toString('hex'),
      botUsername,
      status: 'provisioning', // Not active until bot is created
    }
  });

  console.log(`[provision-worker] Created pending tenant: ${tenant.id} for ${email}`);

  // Send notification to admin about new customer needing bot setup
  if (ADMIN_BOT_TOKEN && process.env.TELEGRAM_REPORT_CHAT_ID) {
    const message = `🆕 *New Customer Signup!*\n\n` +
      `Email: ${email}\n` +
      `Name: ${name || 'Not provided'}\n` +
      `Stripe: ${stripeId || 'N/A'}\n\n` +
      `⚠️ Bot needs manual creation.\n` +
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
    note: 'Bot needs manual creation via BotFather'
  };
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
