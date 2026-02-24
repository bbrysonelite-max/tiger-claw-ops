/**
 * Tiger Claw Scout — Prospect Scheduler
 *
 * Runs a prospect hunt for every active tenant daily at 5 AM Bangkok time
 * (before the 7 AM daily report, so customers always have fresh leads).
 *
 * Uses Reddit public API (no key needed) + Anthropic Claude for extraction.
 * Falls back to network_marketer ICP when interview data is absent.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import { decrypt } from '../shared/crypto.js';
import { huntProspects } from './web-search.js';
import cron from 'node-cron';

// Lead source config for network marketers (default for all current customers)
const NETWORK_MARKETER_CONFIG = {
  role: 'network_marketer',
  icpDescription: 'People open to extra income, wellness, or business opportunity — nurses, teachers, stay-at-home parents, small business owners, side hustlers',
  icpPainPoints: 'wants more income, looking for flexibility, interested in health, tired of 9-5, wants to work from home',
  icpKeywords: 'extra income, side hustle, work from home, passive income, network marketing, wellness business',
  sources: {
    sources: ['Reddit', 'LinkedIn'],
    subreddits: ['r/sidehustle', 'r/workfromhome', 'r/antiMLM', 'r/entrepreneur', 'r/financialindependence'],
    groups: [],
  },
  maxResults: 8,
};

const prisma = new PrismaClient();

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Anthropic Claude wrapper that huntProspects() expects
async function generateAI(prompt: string): Promise<string> {
  if (!anthropic) throw new Error('ANTHROPIC_API_KEY not configured');
  const message = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });
  return message.content[0].type === 'text' ? message.content[0].text : '';
}

async function sendTelegramMessage(token: string, chatId: string, text: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });
}

async function runHuntForTenant(tenant: any): Promise<number> {
  const label = `[scheduler:${tenant.name}]`;

  // Decrypt bot token
  let token: string;
  try {
    token = decrypt(tenant.botToken);
    if (!token || !token.includes(':')) {
      console.log(`${label} Skipping — token is PENDING or invalid`);
      return 0;
    }
  } catch {
    console.log(`${label} Skipping — token decrypt failed`);
    return 0;
  }

  // Build hunt config — use interview data if available, else default
  const interview = tenant.interview_data || {};
  const i1 = interview.interview1;
  const i2 = interview.interview2;

  const config = (i1 && i2)
    ? {
        role: i1.extracted_role || 'network_marketer',
        icpDescription: i2.icp_description || NETWORK_MARKETER_CONFIG.icpDescription,
        icpPainPoints: i2.icp_pain_points,
        icpKeywords: i2.icp_keywords,
        sources: NETWORK_MARKETER_CONFIG.sources,
        maxResults: 8,
      }
    : NETWORK_MARKETER_CONFIG;

  console.log(`${label} Hunting with role="${config.role}" icp="${config.icpDescription.slice(0, 60)}..."`);

  let prospects;
  try {
    prospects = await huntProspects(config, generateAI);
  } catch (err: any) {
    console.error(`${label} Hunt failed:`, err.message);
    return 0;
  }

  if (prospects.length === 0) {
    console.log(`${label} No prospects found this run`);
    return 0;
  }

  // Save new prospects — skip if a prospect with same name+tenantId already exists today
  let saved = 0;
  for (const p of prospects) {
    try {
      const existing = await prisma.prospect.findFirst({
        where: {
          tenantId: tenant.id,
          name: p.name,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // not seen in last 7 days
        },
      });

      if (existing) continue;

      await prisma.prospect.create({
        data: {
          tenantId: tenant.id,
          name: p.name,
          source: p.source,
          sourceUrl: p.sourceUrl,
          summary: p.summary,
          interests: p.interests,
          painPoints: p.painPoints,
          score: p.score,
          status: 'new',
        },
      });
      saved++;
    } catch (err: any) {
      console.error(`${label} Failed to save prospect "${p.name}":`, err.message);
    }
  }

  console.log(`${label} Saved ${saved} new prospects`);

  // Notify customer via their bot if they have a chat_id
  if (saved > 0 && tenant.chat_id) {
    try {
      const top = prospects.slice(0, 3);
      let msg = `🐯 *I found ${saved} new prospect${saved > 1 ? 's' : ''} for you!*\n\n`;
      top.forEach((p, i) => {
        const stars = '⭐'.repeat(Math.min(Math.floor(p.score / 20), 5));
        msg += `*${i + 1}. ${p.name}* ${stars}\n`;
        if (p.summary) msg += `${p.summary}\n`;
        msg += '\n';
      });
      msg += `_Use /today to see all your prospects_`;
      await sendTelegramMessage(token, tenant.chat_id, msg);
    } catch (err: any) {
      console.error(`${label} Failed to notify customer:`, err.message);
    }
  }

  return saved;
}

async function runAllHunts(): Promise<void> {
  console.log(`[scheduler] Starting daily prospect hunt — ${new Date().toISOString()}`);

  const tenants = await prisma.tenant.findMany({
    where: { status: 'active' },
  });

  console.log(`[scheduler] Hunting for ${tenants.length} active tenants`);

  let totalSaved = 0;
  for (const tenant of tenants) {
    totalSaved += await runHuntForTenant(tenant);
    // Small delay between tenants to avoid rate-limiting Reddit
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`[scheduler] Hunt complete — ${totalSaved} total new prospects saved`);
}

// Run at 5:00 AM Bangkok time (22:00 UTC) — 2 hours before daily report
cron.schedule('0 22 * * *', () => {
  runAllHunts().catch(err => console.error('[scheduler] Hunt run failed:', err));
}, { timezone: 'UTC' });

console.log('[scheduler] Prospect Scheduler started — hunting daily at 5:00 AM Bangkok (22:00 UTC)');

// Also run immediately on startup (catches up if the process was down)
runAllHunts().catch(err => console.error('[scheduler] Startup hunt failed:', err));

// Graceful shutdown
async function shutdown() {
  console.log('[scheduler] Shutting down');
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
