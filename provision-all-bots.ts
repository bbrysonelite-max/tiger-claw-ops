/**
 * Tiger Bot Scout - Provision All Customer Bots
 * Creates dedicated Telegram bots for all 9 customers
 */

import 'dotenv/config';
import { provisionNewBot, ProvisionResult } from './src/provisioner/userbot.js';

// All 9 customers awaiting bots
const CUSTOMERS = [
  { name: 'Nancy Lim', email: 'nancylimsk@gmail.com' },
  { name: 'Chana Lohasaptawee', email: 'chana.loh@gmail.com' },
  { name: 'Phaitoon S.', email: 'phaitoon2010@gmail.com' },
  { name: 'Tarida Sukavanich', email: 'taridadew@gmail.com' },
  { name: 'Lily Vergara', email: 'lily.vergara@gmail.com' },
  { name: 'Theera Phetmalaigul', email: 'phetmalaigul@gmail.com' },
  { name: 'John & Noon', email: 'vijohn@hotmail.com' },
  { name: 'Debbie Cameron', email: 'justagreatdirector@outlook.com' },
  { name: 'Brent Bryson', email: 'brent@botcraftwrks.ai' },
];

// Delay between bot creations to avoid rate limiting
const DELAY_MS = 5000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('='.repeat(60));
  console.log('Tiger Bot Scout - Provisioning All Customer Bots');
  console.log('='.repeat(60));
  console.log(`\nTotal customers: ${CUSTOMERS.length}`);
  console.log(`Delay between bots: ${DELAY_MS}ms\n`);
  
  const results: Array<{ customer: typeof CUSTOMERS[0]; result?: ProvisionResult; error?: string }> = [];
  
  for (let i = 0; i < CUSTOMERS.length; i++) {
    const customer = CUSTOMERS[i];
    console.log(`\n[${i + 1}/${CUSTOMERS.length}] Processing: ${customer.name} (${customer.email})`);
    console.log('-'.repeat(50));
    
    try {
      const result = await provisionNewBot(customer.name, customer.email);
      results.push({ customer, result });
      console.log(`✅ SUCCESS: @${result.username}`);
      console.log(`   Token: ${result.token.substring(0, 20)}...`);
      console.log(`   Webhook: ${result.webhookUrl}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.push({ customer, error: errorMsg });
      console.error(`❌ FAILED: ${errorMsg}`);
    }
    
    // Wait between bots to avoid rate limiting
    if (i < CUSTOMERS.length - 1) {
      console.log(`\nWaiting ${DELAY_MS}ms before next bot...`);
      await sleep(DELAY_MS);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('PROVISIONING COMPLETE - SUMMARY');
  console.log('='.repeat(60));
  
  const successes = results.filter(r => r.result);
  const failures = results.filter(r => r.error);
  
  console.log(`\n✅ Successful: ${successes.length}`);
  for (const s of successes) {
    console.log(`   - ${s.customer.name}: @${s.result!.username}`);
  }
  
  if (failures.length > 0) {
    console.log(`\n❌ Failed: ${failures.length}`);
    for (const f of failures) {
      console.log(`   - ${f.customer.name}: ${f.error}`);
    }
  }
  
  // Output for .env file
  console.log('\n' + '='.repeat(60));
  console.log('BOT TOKENS FOR DATABASE');
  console.log('='.repeat(60));
  for (const s of successes) {
    console.log(`\n# ${s.customer.name} (${s.customer.email})`);
    console.log(`BOT_TOKEN_${s.customer.email.split('@')[0].toUpperCase()}=${s.result!.token}`);
  }
}

main().catch(console.error);
