#!/usr/bin/env npx tsx
/**
 * Tiger Bot Scout - Telegram Session Generator
 * CLI script to generate MTProto session string for BotFather automation
 *
 * Usage: npm run generate-session
 */

import 'dotenv/config';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import * as readline from 'readline';

// --- Configuration ---
const API_ID = 30733538;  // HARDCODED FOR TESTING
const API_HASH = 'a99b03e178e6d3e8f9ea6e3ce3a77d4e';  // HARDCODED FOR TESTING

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main(): Promise<void> {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     TIGER BOT SCOUT - TELEGRAM SESSION GENERATOR            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  // Check for API credentials
  if (!API_ID || !API_HASH) {
    console.log('❌ Error: TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in .env\n');
    process.exit(1);
  }
  
  console.log('✓ API credentials found\n');
  console.log('This script will generate a session string for your Telegram account.\n');
  
  // Create empty session (will be filled during authentication)
  const stringSession = new StringSession('');
  
  // Use WebSocket connection instead of TCP (more reliable through firewalls)
  const client = new TelegramClient(stringSession, API_ID, API_HASH, {
    connectionRetries: 5,
    useWSS: true,  // Use WebSocket over HTTPS (port 443) instead of TCP
    timeout: 30,   // 30 second timeout
  });
  
  try {
    console.log('Connecting to Telegram via WebSocket...\n');
    
    await client.start({
      phoneNumber: async () => {
        return await prompt('📱 Enter your phone number (e.g., +18013695488): ');
      },
      password: async () => {
        return await prompt('🔐 Enter 2FA password (or press Enter to skip): ');
      },
      phoneCode: async () => {
        return await prompt('📨 Enter the code sent to your Telegram: ');
      },
      onError: (err) => {
        console.error('\n❌ Error:', err.message);
      },
    });
    
    console.log('\n✅ Successfully authenticated!\n');
    
    // Get the session string
    const sessionString = client.session.save() as unknown as string;
    
    console.log('═'.repeat(70));
    console.log('YOUR SESSION STRING (copy everything after the = sign):');
    console.log('═'.repeat(70));
    console.log(`\nTELEGRAM_SESSION_STRING=${sessionString}\n`);
    console.log('═'.repeat(70));
    
    // Verify the session works
    const me = await client.getMe();
    console.log(`\n✓ Verified for: ${(me as any).firstName || 'User'} (@${(me as any).username || 'no username'})\n`);
    
  } catch (error) {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  } finally {
    await client.disconnect();
    rl.close();
  }
  
  process.exit(0);
}

main().catch(console.error);
