/**
 * Send Welcome Emails to Existing Customers
 * For customers who already have bots provisioned
 *
 * Required env vars:
 *   BREVO_API_KEY        - Brevo (Sendinblue) transactional email key
 *   ONBOARDING_SITE_URL  - Base URL of the onboarding site (default: https://tigerclaw.io)
 */

require('dotenv').config();
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

const SENDER = { email: 'noreply@botcraftwrks.ai', name: 'Tiger Claw Scout' };
const ONBOARDING_SITE_URL = process.env.ONBOARDING_SITE_URL || 'https://tigerclaw.io';

// ── Helpers ─────────────────────────────────────────────────────────────────

function loadEmailTemplate() {
  const templatePath = path.join(__dirname, 'templates', 'welcome-email.html');
  return fs.readFileSync(templatePath, 'utf-8');
}

function buildWelcomeEmail(template, customerName, botUsername) {
  const telegramUrl = `https://t.me/${botUsername}`;
  const onboardingUrl = `${ONBOARDING_SITE_URL}/?bot=${botUsername}&name=${encodeURIComponent(customerName)}`;

  return template
    .replace(/\{\{CUSTOMER_NAME\}\}/g, customerName)
    .replace(/\{\{TELEGRAM_URL\}\}/g, telegramUrl)
    .replace(/\{\{ONBOARDING_URL\}\}/g, onboardingUrl);
}

// ── Brevo Email ─────────────────────────────────────────────────────────────

async function sendWelcomeEmail(brevoApiKey, customerName, customerEmail, botUsername) {
  const template = loadEmailTemplate();
  const htmlContent = buildWelcomeEmail(template, customerName, botUsername);

  const payload = {
    sender: SENDER,
    to: [{ email: customerEmail, name: customerName }],
    subject: `${customerName}, your Tiger Claw is ready — open Telegram to start`,
    htmlContent,
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': brevoApiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo API error ${response.status}: ${errorText}`);
  }

  return await response.json();
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('TIGER CLAW SCOUT — Send Welcome Emails');
  console.log('='.repeat(60));
  console.log(`Customers: ${CUSTOMERS.length}`);
  console.log(`Onboarding Site: ${ONBOARDING_SITE_URL}`);
  console.log('='.repeat(60));

  const brevoApiKey = process.env.BREVO_API_KEY;

  if (!brevoApiKey) {
    console.error('ERROR: BREVO_API_KEY not set');
    process.exit(1);
  }

  const results = [];

  for (const customer of CUSTOMERS) {
    console.log(`\n→ Sending email to ${customer.name} (${customer.email})...`);
    console.log(`  Bot: @${customer.bot}`);

    try {
      await sendWelcomeEmail(brevoApiKey, customer.name, customer.email, customer.bot);
      console.log(`  ✓ Email sent!`);
      results.push({ ...customer, status: 'sent' });
    } catch (error) {
      console.error(`  ✗ Failed: ${error.message}`);
      results.push({ ...customer, status: 'failed', error: error.message });
    }

    // Small delay between emails
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  const sent = results.filter(r => r.status === 'sent').length;
  const failed = results.filter(r => r.status === 'failed').length;

  console.log(`Sent: ${sent}/${CUSTOMERS.length}`);
  console.log(`Failed: ${failed}/${CUSTOMERS.length}`);

  if (failed > 0) {
    console.log('\nFailed emails:');
    results.filter(r => r.status === 'failed').forEach(r => {
      console.log(`  - ${r.name} (${r.email}): ${r.error}`);
    });
  }

  console.log('\nDone!');
}

main().catch(console.error);
