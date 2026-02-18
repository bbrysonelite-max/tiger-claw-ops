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
  stripeId?: string;       // Stripe customer ID (not present for invite flow)
  email: string;
  name: string;
  inviteTokenId?: string;  // InviteToken.id that triggered this provision
  trialDays?: number;      // 0 = permanent; N = trial period in days
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

// --- TENANT ---

export interface TenantRecord {
  id: string;
  stripeId: string | null;
  email: string;
  botToken: string;       // Encrypted
  botTokenHash: string;   // For webhook routing
  botUsername: string;
  status: 'provisioning' | 'active' | 'suspended' | 'error';
  createdAt: Date;
}

// --- PROSPECT ---

export interface ProspectRecord {
  id: string;
  tenantId: string;
  name: string;
  summary: string | null;
  status: 'new' | 'contacted' | 'interested' | 'not_interested' | 'converted';
  score: number;
}

// --- DAILY REPORT ---

export interface DailyReportRecord {
  id: string;
  tenantId: string;
  date: Date;
  status: string;
  prospectCount: number;
}

// --- TELEGRAM UPDATE TYPES ---

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  entities?: Array<{
    type: string;
    offset: number;
    length: number;
  }>;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: {
    id: string;
    from: TelegramUser;
    message?: TelegramMessage;
    data?: string;
  };
}

// --- QUEUE NAMES ---

export const QUEUE_NAMES = {
  INBOUND: 'inbound',
  PROVISION: 'provision',
  ENRICHMENT: 'enrichment',
  REPORTS: 'reports',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];
