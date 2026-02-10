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
const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0', 10);
const API_HASH = process.env.TELEGRAM_API_HASH || '';

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
    console.log('To get these credentials:');
    console.log('1. Go to https://my.telegram.org');
    console.log('2. Log in with your phone number');
    console.log('3. Go to "API development tools"');
    console.log('4. Create an application if you haven\'t already');
    console.log('5. Copy the api_id and api_hash\n');
    console.log('Add to your .env file:');
    console.log('  TELEGRAM_API_ID=your_api_id');
    console.log('  TELEGRAM_API_HASH=your_api_hash\n');
    process.exit(1);
  }
  
  console.log('✓ API credentials found\n');
  console.log('This script will generate a session string for your Telegram account.');
  console.log('The session string allows the provisioner to create bots via BotFather.\n');
  console.log('⚠️  IMPORTANT: Use a dedicated Telegram account for bot provisioning,');
  console.log('   not your personal account!\n');
  
  // Create empty session (will be filled during authentication)
  const stringSession = new StringSession('');
  
  const client = new TelegramClient(stringSession, API_ID, API_HASH, {
    connectionRetries: 5,
  });
  
  try {
    console.log('Connecting to Telegram...\n');
    
    await client.start({
      phoneNumber: async () => {
        return await prompt('📱 Enter your phone number (with country code, e.g., +1234567890): ');
      },
      password: async () => {
        return await prompt('🔐 Enter your 2FA password (if enabled, or press Enter to skip): ');
      },
      phoneCode: async () => {
        return await prompt('📨 Enter the code sent to your Telegram: ');
      },
      onError: (err) => {
        console.error('\n❌ Error during authentication:', err.message);
      },
    });
    
    console.log('\n✅ Successfully authenticated!\n');
    
    // Get the session string
    const sessionString = client.session.save() as unknown as string;
    
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    YOUR SESSION STRING                       ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    console.log('Copy this entire string and add it to your .env file:\n');
    console.log('─'.repeat(70));
    console.log(`TELEGRAM_SESSION_STRING=${sessionString}`);
    console.log('─'.repeat(70));
    
    console.log('\n⚠️  SECURITY NOTES:');
    console.log('• Keep this session string SECRET - it provides full account access');
    console.log('• Never commit it to git or share it publicly');
    console.log('• Store it only in .env files or secure environment variables');
    console.log('• If compromised, go to Telegram Settings > Privacy & Security');
    console.log('  > Active Sessions and terminate the session\n');
    
    // Verify the session works
    const me = await client.getMe();
    console.log(`✓ Session verified for: ${(me as any).firstName || 'User'} (@${(me as any).username || 'no username'})\n`);
    
  } catch (error) {
    console.error('\n❌ Failed to generate session:', error);
    process.exit(1);
  } finally {
    await client.disconnect();
    rl.close();
  }
  
  console.log('Done! You can now use the provisioner to create bots automatically.\n');
  process.exit(0);
}

// Run the main function
main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
