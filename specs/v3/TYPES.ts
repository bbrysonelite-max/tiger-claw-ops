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

// --- FAILSAFE FEEDBACK LOOP (F-05) ---

export interface EscalationTrigger {
  phrases: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export const ESCALATION_TRIGGERS: EscalationTrigger[] = [
  { phrases: ['report to hq', 'report to headquarters', 'contact headquarters'], priority: 'high' },
  { phrases: ['i need help', 'help me', 'need assistance'], priority: 'normal' },
  { phrases: ['contact support', 'talk to support'], priority: 'normal' },
  { phrases: ['talk to a human', 'speak to someone', 'real person'], priority: 'high' },
  { phrases: ['urgent', 'emergency', 'critical issue'], priority: 'urgent' },
];

export interface SupportTicketData {
  tenantId: string;
  issue: string;
  conversationLog: ConversationMessage[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface ConversationMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export interface EscalationNotification {
  channel: 'email' | 'telegram' | 'dashboard';
  recipient: string;
  ticketId: string;
  customerName: string;
  issue: string;
  priority: string;
}

// Support Contact Info (User-Facing)
export const SUPPORT_CONTACTS = {
  hotline: '+1-801-369-5488',
  email: 'support@botcraftwrks.ai',
  helpDocs: 'https://help.botcraftwrks.ai',
  adminBot: '@TigerClawHQ_bot',
} as const;

// --- OPENCLAW UPDATE TRACKING (F-06) ---

export interface SystemUpdateData {
  component: 'openclaw' | 'gateway' | 'worker';
  fromVersion: string;
  toVersion: string;
  triggeredBy?: string;
}

export interface VersionCheck {
  component: string;
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  updateType: 'major' | 'minor' | 'patch' | 'none';
}

export interface UpdatePolicy {
  component: string;
  autoUpdate: boolean;
  requiresApproval: 'major' | 'minor' | 'none';
  maintenanceWindow: { start: number; end: number }; // Hours in UTC
}

export const DEFAULT_UPDATE_POLICIES: UpdatePolicy[] = [
  {
    component: 'openclaw',
    autoUpdate: true,
    requiresApproval: 'major',
    maintenanceWindow: { start: 9, end: 11 }, // 2-4 AM MST = 9-11 UTC
  },
  {
    component: 'gateway',
    autoUpdate: false,
    requiresApproval: 'minor',
    maintenanceWindow: { start: 9, end: 11 },
  },
  {
    component: 'worker',
    autoUpdate: false,
    requiresApproval: 'minor',
    maintenanceWindow: { start: 9, end: 11 },
  },
];
