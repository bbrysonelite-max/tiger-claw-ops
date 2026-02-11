/**
 * Tiger Bot Scout - Provision Remaining Customer Bots
 * Pure CommonJS script - runs with node directly
 * 
 * 30-second delays between bots to avoid Telegram rate limiting
 */

require('dotenv').config();
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { Api } = require('telegram/tl');
const crypto = require('crypto');

// Customers still needing bots (Nancy and Chana already done)
const CUSTOMERS = [
  { name: 'Phaitoon S.', email: 'phaitoon2010@gmail.com' },
  { name: 'Tarida Sukavanich', email: 'taridadew@gmail.com' },
  { name: 'Lily Vergara', email: 'lily.vergara@gmail.com' },
  { name: 'Theera Phetmalaigul', email: 'phetmalaigul@gmail.com' },
  { name: 'John & Noon', email: 'vijohn@hotmail.com' },
  { name: 'Debbie Cameron', email: 'justagreatdirector@outlook.com' },
  { name: 'Brent Bryson', email: 'brent@botcraftwrks.ai' },
];

const DELAY_SECONDS = 30;
const GATEWAY_URL = 'https://api.botcraftwrks.ai';

function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

function generateBotName(customerName) {
  const suffix = crypto.randomBytes(4).toString('hex');
  return `Tiger_${suffix}`;
}

async function createBot(client, customerName, customerEmail) {
  const botName = generateBotName(customerName);
  const botUsername = `${botName}_bot`;
  
  console.log(`  Creating bot: @${botUsername}`);
  
  // Start conversation with BotFather
  await client.sendMessage('BotFather', { message: '/newbot' });
  await sleep(2);
  
  // Send bot display name
  const displayName = `TigerBot for ${customerName}`;
  await client.sendMessage('BotFather', { message: displayName });
  await sleep(2);
  
  // Send username
  await client.sendMessage('BotFather', { message: botUsername });
  await sleep(3);
  
  // Get response with token
  const messages = await client.getMessages('BotFather', { limit: 5 });
  
  for (const msg of messages) {
    const text = msg.text || '';
    const tokenMatch = text.match(/(\d+:[A-Za-z0-9_-]+)/);
    if (tokenMatch) {
      const token = tokenMatch[1];
      const hash = crypto.createHash('sha256').update(token.split(':')[0]).digest('hex').substring(0, 16);
      const webhookUrl = `${GATEWAY_URL}/webhooks/${hash}`;
      
      return {
        username: botUsername,
        token: token,
        webhookUrl: webhookUrl
      };
    }
  }
  
  throw new Error('Could not extract bot token from BotFather response');
}

async function main() {
  console.log('='.repeat(60));
  console.log('Tiger Bot Scout - Provisioning Customer Bots');
  console.log('='.repeat(60));
  console.log(`Customers: ${CUSTOMERS.length}`);
  console.log(`Delay: ${DELAY_SECONDS} seconds between bots`);
  console.log('='.repeat(60));
  
  const sessionString = process.env.TELEGRAM_SESSION_STRING;
  if (!sessionString) {
    console.error('ERROR: TELEGRAM_SESSION_STRING not set in .env');
    process.exit(1);
  }
  
  // Use official Telegram Desktop credentials (skeleton key)
  const API_ID = 2040;
  const API_HASH = 'b18441a1ff607e10a989891a5462e627';
  
  const client = new TelegramClient(
    new StringSession(sessionString),
    API_ID,
    API_HASH,
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
      const result = await createBot(client, customer.name, customer.email);
      results.push({ customer, result });
      console.log(`  SUCCESS: @${result.username}`);
      console.log(`  Token: ${result.token.substring(0, 20)}...`);
    } catch (error) {
      results.push({ customer, error: error.message });
      console.error(`  FAILED: ${error.message}`);
    }
    
    if (i < CUSTOMERS.length - 1) {
      console.log(`\n  Waiting ${DELAY_SECONDS} seconds...\n`);
      await sleep(DELAY_SECONDS);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  const successes = results.filter(r => r.result);
  const failures = results.filter(r => r.error);
  
  console.log(`\nSuccessful: ${successes.length}`);
  for (const s of successes) {
    console.log(`  ${s.customer.name}: @${s.result.username}`);
    console.log(`    Token: ${s.result.token}`);
  }
  
  if (failures.length > 0) {
    console.log(`\nFailed: ${failures.length}`);
    for (const f of failures) {
      console.log(`  ${f.customer.name}: ${f.error}`);
    }
  }
  
  await client.disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
