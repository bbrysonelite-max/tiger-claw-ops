/**
 * Manual auth flow:
 * 1. Sends Telegram auth code request to a MySudo number
 * 2. Waits for /tmp/telegram-code.txt to appear (you drop the code there)
 * 3. Signs in, saves session, then provisions 4 bots
 */

import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import CryptoJS from 'crypto-js';
import crypto from 'crypto';
import fs from 'fs';

const LOG = '/tmp/manual-auth.log';
function log(msg) {
  const line = new Date().toISOString() + ' ' + msg;
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
}

const API_ID = 2040;
const API_HASH = 'b18441a1ff607e10a989891a5462e627';
const ENCRYPTION_KEY = 'd12231134357ba94a7abfbf546ffef4142d46a1f0dcdf45f168ec225e6b17ee8';
const CODE_FILE = '/tmp/telegram-code.txt';

// Use the number the user will check
const PHONE_NUMBER = process.argv[2] || '+19282755820';

const CUSTOMERS = [
  { name: 'John & Noon',    dbName: 'John & Noon' },
  { name: 'Lily Vergara',   dbName: 'Lily Vergara' },
  { name: 'Pat Sullivan',   dbName: 'Pat Sullivan' },
  { name: 'Rebecca Bryson', dbName: 'Rebecca Bryson' },
];

const RATE_LIMIT_MS = 6 * 60 * 1000;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForCode() {
  log(`Waiting for code in ${CODE_FILE} ...`);
  const deadline = Date.now() + 3 * 60 * 1000; // 3 minutes
  while (Date.now() < deadline) {
    if (fs.existsSync(CODE_FILE)) {
      const code = fs.readFileSync(CODE_FILE, 'utf8').trim().replace(/\D/g, '');
      if (code.length === 5) {
        log(`Got code: ${code}`);
        return code;
      }
    }
    await sleep(2000);
  }
  return null;
}

// Remove any leftover code file
if (fs.existsSync(CODE_FILE)) fs.unlinkSync(CODE_FILE);

log(`=== Manual Auth Starting for ${PHONE_NUMBER} ===`);

const client = new TelegramClient(
  new StringSession(''),
  API_ID,
  API_HASH,
  { connectionRetries: 5 }
);

await client.connect();

let codeResult;
try {
  codeResult = await client.sendCode(
    { apiId: API_ID, apiHash: API_HASH },
    PHONE_NUMBER
  );
  log(`CODE SENT to ${PHONE_NUMBER}`);
  log(`Full codeResult: ${JSON.stringify(codeResult, null, 2).substring(0, 500)}`);
  log(`phoneCodeHash: ${codeResult.phoneCodeHash.substring(0, 10)}...`);
} catch (err) {
  log(`sendCode error: ${err.message}`);
  await client.disconnect();
  process.exit(1);
}

const code = await waitForCode();

if (!code) {
  log('TIMEOUT — no code provided within 3 minutes');
  await client.disconnect();
  process.exit(1);
}

try {
  await client.invoke(new Api.auth.SignIn({
    phoneNumber: PHONE_NUMBER,
    phoneCodeHash: codeResult.phoneCodeHash,
    phoneCode: code,
  }));
  log('Signed in successfully!');
} catch (err) {
  if (err.message.includes('SESSION_PASSWORD_NEEDED')) {
    log('2FA required — cannot proceed');
    await client.disconnect();
    process.exit(1);
  }
  log(`SignIn error: ${err.message}`);
  await client.disconnect();
  process.exit(1);
}

const sessionString = client.session.save();
fs.writeFileSync('/tmp/mysudo-session.txt', `TELEGRAM_SESSION_STRING=${sessionString}\n`);
log(`Session saved to /tmp/mysudo-session.txt`);

// Now provision the 4 bots
log('--- Starting bot provisioning ---');

const bf = await client.getEntity('BotFather');

async function getLastId() {
  return (await client.getMessages(bf, { limit: 1 }))[0]?.id || 0;
}
async function sendToBotFather(message, waitMs) {
  const w = waitMs || 10000;
  const before = await getLastId();
  await client.sendMessage(bf, { message });
  await sleep(w);
  const msgs = await client.getMessages(bf, { limit: 3 });
  return (msgs.find(m => m.id > before)?.message) || '';
}
function encrypt(text) {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

const results = [];

for (let i = 0; i < CUSTOMERS.length; i++) {
  const c = CUSTOMERS[i];
  log(`--- Provisioning ${c.name} (${i+1}/${CUSTOMERS.length}) ---`);

  try {
    await sendToBotFather('/cancel', 3000);
    const newbotResp = await sendToBotFather('/newbot', 10000);
    log(`/newbot: ${newbotResp.substring(0, 120)}`);

    if (newbotResp.toLowerCase().includes('sorry')) {
      log(`RATE LIMIT or ERROR: ${newbotResp.substring(0, 200)}`);
      break;
    }
    if (!newbotResp.toLowerCase().includes('name') && !newbotResp.toLowerCase().includes('alright')) {
      log(`Unexpected response, skipping ${c.name}`);
      continue;
    }

    await sendToBotFather(`Tiger Claw - ${c.name}`, 8000);

    const uid = crypto.randomBytes(4).toString('hex');
    const username = `Tiger_${uid}_bot`;
    log(`Trying username: @${username}`);
    const tokenResp = await sendToBotFather(username, 12000);
    log(`Token resp: ${tokenResp.substring(0, 120)}`);

    const tokenMatch = tokenResp.match(/\d+:[A-Za-z0-9_-]+/);
    if (!tokenMatch) {
      log(`ERROR: No token for ${c.name}`);
      continue;
    }

    const token = tokenMatch[0];
    await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, { method: 'POST' });

    const hash = crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
    const encrypted = encrypt(token);

    results.push({ name: c.dbName, token, encrypted, hash, username });
    log(`Bot created for ${c.name}: @${username} hash:${hash}`);

  } catch (err) {
    log(`ERROR for ${c.name}: ${err.message}`);
  }

  if (i < CUSTOMERS.length - 1) {
    log(`Waiting 6 minutes before next bot...`);
    await sleep(RATE_LIMIT_MS);
  }
}

await client.disconnect();

const outFile = '/tmp/new-bot-tokens.json';
fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
log(`Results written to ${outFile}`);
log(`=== Done: ${results.length} bots provisioned ===`);
