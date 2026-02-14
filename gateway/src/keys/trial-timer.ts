// trial-timer.ts
// Run via cron every hour: 0 * * * * cd /path/to/gateway && node --loader ts-node/esm src/keys/trial-timer.ts
// Checks all customers in trial, sends reminders at 48h/64h, pauses at 72h.
import { checkTrialReminder, isTrialExpired } from './key-manager';

// These functions must be implemented by the gateway's data layer:
// - getAllCustomersInTrial(): returns customers whose trial.expired === false
// - sendTelegramMessage(chatId, message): sends a Telegram message
// - saveCustomer(customer): persists customer state

declare function getAllCustomersInTrial(): Promise<any[]>;
declare function sendTelegramMessage(chatId: string, message: string): Promise<void>;
declare function saveCustomer(customer: any): Promise<void>;

async function runTrialChecks() {
  const customers = await getAllCustomersInTrial();
  
  for (const customer of customers) {
    // Check for reminders
    const reminder = checkTrialReminder(customer.keyConfig);
    if (reminder?.shouldSend) {
      await sendTelegramMessage(customer.chat_id, reminder.message);
      customer.keyConfig.trial.reminders_sent.push(reminder.hour);
      await saveCustomer(customer);
    }
    
    // Check for expiry
    if (isTrialExpired(customer.keyConfig) && customer.state === 'ACTIVE') {
      customer.state = 'KEY_PENDING';
      customer.keyConfig.trial.expired = true;
      await saveCustomer(customer);
      // The 72-hour message is sent by checkTrialReminder above
    }
  }
}

runTrialChecks()
  .then(() => { console.log('Trial checks complete'); process.exit(0); })
  .catch((err) => { console.error('Trial check failed:', err); process.exit(1); });
