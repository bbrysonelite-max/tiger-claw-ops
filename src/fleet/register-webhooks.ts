/**
 * Tiger Claw Scout — Webhook Registration Script (Step 5)
 *
 * Registers https://api.botcraftwrks.ai/webhooks/{hash} with Telegram
 * for every active tenant bot.
 *
 * Usage:
 *   npx tsx src/fleet/register-webhooks.ts            # dry run
 *   npx tsx src/fleet/register-webhooks.ts --apply    # actually register
 *   npx tsx src/fleet/register-webhooks.ts --apply --stop-poller
 *
 * The --stop-poller flag is Stage 2: only use after verifying webhooks
 * are delivering messages correctly in staging.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { decrypt } from '../shared/crypto.js';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

const WEBHOOK_BASE =
  process.env.WEBHOOK_BASE_URL ?? 'https://api.botcraftwrks.ai/webhooks';

const APPLY = process.argv.includes('--apply');
const STOP_POLLER = process.argv.includes('--stop-poller');

async function registerWebhook(
  token: string,
  hash: string
): Promise<{ ok: boolean; description?: string }> {
  const url = `https://api.telegram.org/bot${token}/setWebhook`;
  const webhookUrl = `${WEBHOOK_BASE}/${hash}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: false,
    }),
  });

  return res.json() as Promise<{ ok: boolean; description?: string }>;
}

async function getWebhookInfo(
  token: string
): Promise<{ url: string; pending_update_count: number }> {
  const res = await fetch(
    `https://api.telegram.org/bot${token}/getWebhookInfo`
  );
  const data = (await res.json()) as { result: { url: string; pending_update_count: number } };
  return data.result;
}

async function main() {
  console.log(`\n🐯 Tiger Claw Webhook Registrar`);
  console.log(`   Base URL: ${WEBHOOK_BASE}`);
  console.log(`   Mode:     ${APPLY ? 'APPLY (live)' : 'DRY RUN'}`);
  console.log(`   Stop poller: ${STOP_POLLER}\n`);

  const tenants = await prisma.tenant.findMany({
    where: { status: 'active' },
    select: { id: true, botToken: true, botTokenHash: true, botUsername: true, email: true },
  });

  console.log(`Found ${tenants.length} active tenants\n`);

  let registered = 0;
  let alreadySet = 0;
  let failed = 0;

  for (const tenant of tenants) {
    let token: string;
    try {
      token = decrypt(tenant.botToken);
    } catch {
      console.error(`  ❌ ${tenant.email} — decrypt failed`);
      failed++;
      continue;
    }

    const expected = `${WEBHOOK_BASE}/${tenant.botTokenHash}`;

    if (!APPLY) {
      // Dry run: just show current state
      try {
        const info = await getWebhookInfo(token);
        const status = info.url === expected ? '✅ already set' : `⚠️  currently: ${info.url || 'none'}`;
        console.log(`  ${tenant.botUsername} (${tenant.email}) — ${status}`);
      } catch {
        console.log(`  ${tenant.botUsername} (${tenant.email}) — could not check`);
      }
      continue;
    }

    // Apply mode: register the webhook
    try {
      const result = await registerWebhook(token, tenant.botTokenHash);
      if (result.ok) {
        console.log(`  ✅ ${tenant.botUsername} (${tenant.email}) — registered`);
        registered++;
      } else {
        console.error(`  ❌ ${tenant.botUsername} — ${result.description}`);
        failed++;
      }
    } catch (err) {
      console.error(`  ❌ ${tenant.botUsername} — ${err}`);
      failed++;
    }

    // Rate limit: Telegram allows ~30 req/sec
    await new Promise((r) => setTimeout(r, 50));
  }

  if (APPLY) {
    console.log(`\nResults: ${registered} registered, ${alreadySet} unchanged, ${failed} failed`);

    if (STOP_POLLER && failed === 0) {
      console.log('\nStopping tiger-poller...');
      try {
        execSync('pm2 stop tiger-poller', { stdio: 'inherit' });
        execSync('pm2 save', { stdio: 'inherit' });
        console.log('tiger-poller stopped. Webhooks are now the sole message source.');
      } catch (err) {
        console.error('Failed to stop poller:', err);
      }
    } else if (STOP_POLLER && failed > 0) {
      console.log(`\n⚠️  Not stopping poller — ${failed} registrations failed.`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
