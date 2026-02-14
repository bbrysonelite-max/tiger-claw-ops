// migrate-existing-customers.ts
// One-time script to backfill keyConfig for the 9 existing customers.
// Resets all to IDLE state with a fresh 72-hour trial so they can re-onboard.
// Run once: node --loader ts-node/esm src/keys/migrate-existing-customers.ts
import { createInitialKeyConfig } from './key-manager';

// These functions must be implemented by the gateway's data layer:
declare function getAllCustomers(): Promise<any[]>;
declare function saveCustomer(customer: any): Promise<void>;

async function migrateExistingCustomers() {
  const customers = await getAllCustomers();
  
  for (const customer of customers) {
    if (!customer.keyConfig) {
      customer.keyConfig = createInitialKeyConfig();
      customer.state = 'IDLE';  // Reset to IDLE so they can re-onboard
      await saveCustomer(customer);
      console.log(`Migrated ${customer.id}: state=IDLE, trial starts now`);
    }
  }
  
  console.log(`Migration complete. ${customers.length} customers processed.`);
}

migrateExistingCustomers()
  .then(() => process.exit(0))
  .catch((err) => { console.error('Migration failed:', err); process.exit(1); });
