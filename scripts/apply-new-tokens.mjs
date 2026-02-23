/**
 * Apply new bot tokens to production database.
 *
 * Usage:
 *   1. Copy /tmp/new-bot-tokens.json from local Mac to server
 *   2. Run: DATABASE_URL=<...> ENCRYPTION_KEY=<...> node apply-new-tokens.mjs
 *
 * Or run locally if DATABASE_URL points to production (via SSH tunnel).
 */

import fs from 'fs';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const TOKEN_FILE = process.env.TOKEN_FILE || '/tmp/new-bot-tokens.json';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'd12231134357ba94a7abfbf546ffef4142d46a1f0dcdf45f168ec225e6b17ee8';

if (!fs.existsSync(TOKEN_FILE)) {
  console.error(`Token file not found: ${TOKEN_FILE}`);
  process.exit(1);
}

const tokens = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
console.log(`Applying ${tokens.length} bot tokens...`);

const prisma = new PrismaClient();

for (const t of tokens) {
  console.log(`\nProcessing: ${t.name}`);

  const existing = await prisma.tenant.findFirst({
    where: { name: t.name },
  });

  if (!existing) {
    console.log(`  NOT FOUND in DB: ${t.name} — skipping`);
    continue;
  }

  await prisma.tenant.update({
    where: { id: existing.id },
    data: {
      botToken: t.encrypted,
      botTokenHash: t.hash,
      botUsername: t.username,
      status: 'active',
    },
  });

  console.log(`  UPDATED: ${t.name} → @${t.username} (hash: ${t.hash})`);
}

await prisma.$disconnect();
console.log('\nDone. Restart tiger-poller on the server to pick up new tokens:');
console.log('  pm2 reload tiger-poller');
