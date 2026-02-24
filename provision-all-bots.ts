/**
 * Tiger Claw Scout - Provision Remaining Customer Bots
 * Creates dedicated Telegram bots for 7 remaining customers
 * 
 * RATE LIMIT FIX: 30 second delays between bots to avoid Telegram throttling
 * 
 * Already created:
 * - Nancy Lim: @Tiger_5g6swcaw_bot
 * - Chana Lohasaptawee: @Tiger_urkz4hwl_bot
 */

import 'dotenv/config';
import { provisionNewBot, ProvisionResult } from './src/provisioner/userbot.js';

const CUSTOMERS = [
  { name: 'Phaitoon S.', email: 'phaitoon2010@gmail.com' },
  { name: 'Tarida Sukavanich', email: 'taridadew@gmail.com' },
  { name: 'Lily Vergara', email: 'lily.vergara@gmail.com' },
  { name: 'Theera Phetmalaigul', email: 'phetmalaigul@gmail.com' },
  { name: 'John & Noon', email: 'vijohn@hotmail.com' },
  { name: 'Debbie Cameron', email: 'justagreatdirector@outlook.com' },
  { name: 'Brent Bryson', email: 'brent@botcraftwrks.ai' },
];

// RATE LIMIT FIX: 30 seconds between bot creations
const DELAY_SECONDS = 30;

function sleep(seconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function main() {
  console.log('='.repeat(60));
  console.log('Tiger Claw Scout - Provisioning Remaining Customer Bots');
  console.log('='.repeat(60));
  console.log(`Customers to process: ${CUSTOMERS.length}`);
  console.log(`Delay between bots: ${DELAY_SECONDS} seconds`);
  console.log('='.repeat(60));
  
  const results: Array<{ customer: typeof CUSTOMERS[0]; result?: ProvisionResult; error?: string }> = [];
  
  for (let i = 0; i < CUSTOMERS.length; i++) {
    const customer = CUSTOMERS[i];
    console.log(`\n[${i + 1}/${CUSTOMERS.length}] ${customer.name}`);
    console.log(`Email: ${customer.email}`);
    
    try {
      const result = await provisionNewBot(customer.name, customer.email);
      results.push({ customer, result });
      console.log(`SUCCESS: @${result.username}`);
      console.log(`Token: ${result.token.substring(0, 20)}...`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.push({ customer, error: errorMsg });
      console.error(`FAILED: ${errorMsg}`);
    }
    
    // Wait 30 seconds before next bot (except after last one)
    if (i < CUSTOMERS.length - 1) {
      console.log(`\nWaiting ${DELAY_SECONDS} seconds...`);
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
    console.log(`  ${s.customer.name}: @${s.result!.username}`);
  }
  
  if (failures.length > 0) {
    console.log(`\nFailed: ${failures.length}`);
    for (const f of failures) {
      console.log(`  ${f.customer.name}: ${f.error}`);
    }
  }
}

main().catch(console.error);
