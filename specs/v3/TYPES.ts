/**
 * TIGER BOT SCOUT — TYPE DEFINITIONS
 * Source of Truth for Swarm v3.1.0
 */

// --- QUEUE JOBS (Redis/BullMQ) ---

export type JobType = 
  | 'inbound_webhook'   // Message from User
  | 'provision_bot'     // New Customer Setup
  | 'generate_report'   // 7AM Cron Task
  | 'enrich_prospect';  // Scraping Task

export interface InboundJobData {
  hash: string;      // The Public Webhook Hash
  update: any;       // The Telegram Update Object
}

export interface ProvisionJobData {
  stripeId: string;
  email: string;
  name: string;
}

export interface EnrichmentJobData {
  prospectId: string;
  name: string;
  context?: string;
}

// --- VIRTUAL BOT ---

export interface VirtualBotContext {
  tenantId: string;
  token: string;      // Decrypted Real Token
  bot: any;           // TelegramBot Instance
}

// --- DATABASE / HIVE ---

export interface ScrapeResult {
  title: string;
  content: string;    // Chunked Text
  url: string;
}

export interface PatternMatch {
  id: string;
  content: string;
  similarity: number; // 0 to 1
}
