/**
 * Tiger Claw Scout - Provision Customer Bots + Send Welcome Email
 * Pure CommonJS script - runs with node directly
 *
 * Flow per customer:
 *   1. Create Telegram bot via BotFather
 *   2. Send welcome email with Telegram deep-link + onboarding guide link
 *   3. Log result
 *
 * 30-second delays between bots to avoid Telegram rate limiting
 *
 * Required env vars:
 *   TELEGRAM_SESSION_STRING  - Telegram userbot session
 *   BREVO_API_KEY            - Brevo (Sendinblue) transactional email key
 *   ONBOARDING_SITE_URL      - Base URL of the onboarding site (no trailing slash)
 */

require('dotenv').config();
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────────────────────

const CUSTOMERS = [
  { name: 'Nancy Lim', email: 'nancynutcha@gmail.com', bot: 'Claw_5g6swcaw' },
  { name: 'Phaitoon S.', email: 'phaitoon2010@gmail.com', bot: 'Claw_urkz4hwl' },
  { name: 'Tarida', email: 'taridadew@gmail.com', bot: 'Claw_d8a671af' },
  { name: 'Lily Vergara', email: 'lilyrosev@gmail.com', bot: 'Claw_d0aa5717' },
  { name: 'Theera', email: 'theeraphet@gmail.com', bot: 'Claw_Theera' },
  { name: 'Chana', email: 'chanaloha7777@gmail.com', bot: 'Claw_ga2jqc3a' },
  { name: 'John & Noon', email: 'johnnoon.biz@gmail.com', bot: 'Claw_vqp62i4p' },
  { name: 'Debbie Cameron', email: 'justagreatdirector@outlook.com', bot: 'Claw_Debbie' },
  { name: 'Pat Sullivan', email: 'pat@contatta.com', bot: 'Claw_17rmwyej' },
  { name: 'Brent Bryson', email: 'bbrysonelite@gmail.com', bot: 'Claw_Brent' },
];

const DELAY_SECONDS = 30;
const GATEWAY_URL = 'https://api.botcraftwrks.ai';
const SENDER = { email: 'noreply@botcraftwrks.ai', name: 'Tiger Claw Scout' };

// ── Helpers ─────────────────────────────────────────────────────────────────

function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

function generateBotName() {
  const suffix = crypto.randomBytes(4).toString('hex');
  return `Tiger_${suffix}`;
}

function loadEmailTemplate() {
  const templatePath = path.join(__dirname, 'templates', 'welcome-email.html');
  return fs.readFileSync(templatePath, 'utf-8');
}

function buildWelcomeEmail(template, customerName, botUsername, onboardingSiteUrl) {
  const telegramUrl = `https://t.me/${botUsername}`;
  const onboardingUrl = `${onboardingSiteUrl}/?bot=${botUsername}&name=${encodeURIComponent(customerName)}`;

  return template
    .replace(/\{\{CUSTOMER_NAME\}\}/g, customerName)
    .replace(/\{\{TELEGRAM_URL\}\}/g, telegramUrl)
    .replace(/\{\{ONBOARDING_URL\}\}/g, onboardingUrl);
}

// ── Brevo Email ─────────────────────────────────────────────────────────────

async function sendWelcomeEmail(brevoApiKey, customerName, customerEmail, botUsername, onboardingSiteUrl) {
  const template = loadEmailTemplate();
  const htmlContent = buildWelcomeEmail(template, customerName, botUsername, onboardingSiteUrl);
  const telegramUrl = `https://t.me/${botUsername}`;

  const payload = {
    sender: SENDER,
    to: [{ email: customerEmail, name: customerName }],
    subject: `${customerName}, your Tiger Claw is ready — open Telegram to start`,
    htmlContent,
    textContent: [
      `Hi ${customerName},`,
      '',
      'Your Tiger Claw is ready!',
      '',
      `Open it in Telegram: ${telegramUrl}`,
      '',
      'What happens next:',
      '1. Bot says hello (instant)',
      '2. Quick chat about you (~2 min)',
      '3. Describe your ideal customer (~3 min)',
      '',
      'Total setup: under 5 minutes. Everything happens inside Telegram.',
      '',
      '— Tiger Claw Scout',
    ].join('\n'),
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': brevoApiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Brevo API ${response.status}: ${JSON.stringify(error)}`);
  }

  return response.json();
}

// ── Bot Creation ────────────────────────────────────────────────────────────

async function createBot(client, customerName) {
  const botName = generateBotName();
  const botUsername = `${botName}_bot`;

  console.log(`  Creating bot: @${botUsername}`);

  await client.sendMessage('BotFather', { message: '/newbot' });
  await sleep(2);

  const displayName = `TigerClaw for ${customerName}`;
  await client.sendMessage('BotFather', { message: displayName });
  await sleep(2);

  await client.sendMessage('BotFather', { message: botUsername });
  await sleep(3);

  const messages = await client.getMessages('BotFather', { limit: 5 });

  for (const msg of messages) {
    const text = msg.text || '';
    const tokenMatch = text.match(/(\d+:[A-Za-z0-9_-]+)/);
    if (tokenMatch) {
      const token = tokenMatch[1];
      const hash = crypto.createHash('sha256').update(token.split(':')[0]).digest('hex').substring(0, 16);
      const webhookUrl = `${GATEWAY_URL}/webhooks/${hash}`;

      return { username: botUsername, token, webhookUrl };
    }
  }

  throw new Error('Could not extract bot token from BotFather response');
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('Tiger Claw Scout - Provision + Welcome Email');
  console.log('='.repeat(60));
  console.log(`Customers: ${CUSTOMERS.length}`);
  console.log(`Delay: ${DELAY_SECONDS}s between bots`);
  console.log('='.repeat(60));

  // Validate env
  const sessionString = process.env.TELEGRAM_SESSION_STRING;
  const brevoApiKey = process.env.BREVO_API_KEY;
  const onboardingSiteUrl = process.env.ONBOARDING_SITE_URL || 'https://tiger-claw-flywheel.manus.space';

  if (!sessionString) {
    console.error('ERROR: TELEGRAM_SESSION_STRING not set');
    process.exit(1);
  }
  if (!brevoApiKey) {
    console.error('ERROR: BREVO_API_KEY not set — emails will be skipped');
  }

  // Telegram connection
  const API_ID = 2040;
  const API_HASH = 'b18441a1ff607e10a989891a5462e627';

  const client = new TelegramClient(
    new StringSession(sessionString),
    API_ID, API_HASH,
    { connectionRetries: 5, useWSS: true }
  );

  console.log('\nConnecting to Telegram...');
  await client.connect();
  console.log('Connected!\n');

  const results = [];

  for (let i = 0; i < CUSTOMERS.length; i++) {
    const customer = CUSTOMERS[i];
    console.log(`[${i + 1}/${CUSTOMERS.length}] ${customer.name} (${customer.email})`);

    try {
      // Step 1: Create bot
      const result = await createBot(client, customer.name);
      console.log(`  ✅ Bot created: @${result.username}`);
      console.log(`  Token: ${result.token.substring(0, 20)}...`);

      // Step 2: Send welcome email
      if (brevoApiKey) {
        try {
          await sendWelcomeEmail(brevoApiKey, customer.name, customer.email, result.username, onboardingSiteUrl);
          console.log(`  📧 Welcome email sent to ${customer.email}`);
          results.push({ customer, result, emailSent: true });
        } catch (emailErr) {
          console.error(`  ⚠️  Email failed: ${emailErr.message}`);
          results.push({ customer, result, emailSent: false, emailError: emailErr.message });
        }
      } else {
        console.log(`  ⏭️  Email skipped (no BREVO_API_KEY)`);
        results.push({ customer, result, emailSent: false });
      }
    } catch (error) {
      results.push({ customer, error: error.message });
      console.error(`  ❌ FAILED: ${error.message}`);
    }

    if (i < CUSTOMERS.length - 1) {
      console.log(`\n  Waiting ${DELAY_SECONDS}s...\n`);
      await sleep(DELAY_SECONDS);
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  const successes = results.filter(r => r.result);
  const failures = results.filter(r => r.error);
  const emailsSent = results.filter(r => r.emailSent).length;

  console.log(`\nBots created: ${successes.length}/${CUSTOMERS.length}`);
  console.log(`Emails sent:  ${emailsSent}/${successes.length}`);

  for (const s of successes) {
    const emailStatus = s.emailSent ? '📧' : '⚠️';
    console.log(`  ${emailStatus} ${s.customer.name}: @${s.result.username}`);
    console.log(`     Token: ${s.result.token}`);
    console.log(`     Telegram: https://t.me/${s.result.username}`);
  }

  if (failures.length > 0) {
    console.log(`\nFailed: ${failures.length}`);
    for (const f of failures) {
      console.log(`  ❌ ${f.customer.name}: ${f.error}`);
    }
  }

  await client.disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
