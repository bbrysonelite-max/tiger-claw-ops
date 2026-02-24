// Tiger Claw Scout v1.0.0 — Type Definitions
// Enterprise-grade types for the Command Center

// ==================== PROJECT ====================

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon: string;
  settings: ProjectSettings;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectSettings {
  defaultLanguage: Language;
  timezone: string;
  features: string[];
  notificationEmail?: string;
}

export type ProjectStatus = 'active' | 'archived' | 'deleted';

// ==================== CUSTOMER ====================

export interface Customer {
  id: string;
  projectId: string;

  // Identity
  email: string;
  name?: string;
  phone?: string;
  avatarUrl?: string;

  // Subscription
  plan: Plan;
  status: CustomerStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  trialEndsAt?: Date;

  // Bot Connection
  telegramChatId?: string;
  telegramUsername?: string;
  lineUserId?: string;

  // Preferences
  language: Language;
  timezone: string;
  notificationPreferences: NotificationPreferences;

  // Metrics
  metrics: CustomerMetrics;
  lastActiveAt?: Date;

  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export type Plan =
  | 'scout'      // $99/mo
  | 'coach'      // $197/mo
  | 'closer'     // $297/mo
  | 'scout_free' // Comped
  | 'trial';     // 7-day trial

export type CustomerStatus =
  | 'lead'           // Signed up, no payment
  | 'trial'          // In trial period
  | 'pending_setup'  // Paid, bot not connected
  | 'active'         // Fully operational
  | 'paused'         // Temporarily suspended
  | 'cancelled'      // Cancelled subscription
  | 'churned';       // Inactive for 30+ days

export interface CustomerMetrics {
  prospectsFound: number;
  scriptsGenerated: number;
  conversions: number;
  responseRate: number;
  lastProspectAt?: Date;
  lastScriptAt?: Date;
  lastConversionAt?: Date;
}

export interface NotificationPreferences {
  dailyReport: boolean;
  weeklyDigest: boolean;
  newHighScoreProspect: boolean;
  followUpReminders: boolean;
  systemAlerts: boolean;
}

// ==================== MESSAGING ====================

export interface Conversation {
  id: string;
  projectId: string;
  contactId?: string;
  contact?: Contact;
  channel: Channel;
  channelId?: string;
  lastMessageAt?: Date;
  lastMessage?: Message;
  unreadCount: number;
  status: ConversationStatus;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  projectId: string;
  direction: MessageDirection;
  content: string;
  contentType: ContentType;
  senderType: SenderType;
  senderId?: string;
  readAt?: Date;
  deliveredAt?: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface Contact {
  id: string;
  projectId: string;
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  channels: ContactChannel[];
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactChannel {
  channel: Channel;
  channelId: string;
  verified: boolean;
  primary: boolean;
}

export type Channel = 'telegram' | 'line' | 'email' | 'sms' | 'whatsapp' | 'messenger';
export type ConversationStatus = 'open' | 'closed' | 'archived' | 'snoozed';
export type MessageDirection = 'inbound' | 'outbound';
export type ContentType = 'text' | 'image' | 'file' | 'script' | 'template' | 'system';
export type SenderType = 'user' | 'bot' | 'contact' | 'system';

// ==================== BOT ====================

export interface Bot {
  id: string;
  projectId: string;

  // Identity
  name: string;
  slug: string;
  type: BotType;
  description?: string;
  avatarUrl?: string;

  // Platform
  platform: Platform;
  platformId?: string;
  platformToken?: string; // Encrypted at rest
  platformWebhookUrl?: string;

  // Status
  status: BotStatus;
  lastPingAt?: Date;
  lastErrorAt?: Date;
  errorMessage?: string;
  errorCount: number;

  // Configuration
  config: BotConfig;
  features: BotFeature[];

  // Metrics
  metrics: BotMetrics;

  // Audit
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  stoppedAt?: Date;
}

export type BotType =
  | 'scout'      // Prospect reports + scripts
  | 'assistant'  // Personal AI helper
  | 'discovery'  // Agent Zero prospect finding
  | 'support';   // Customer support automation

export type Platform = 'telegram' | 'line' | 'docker' | 'whatsapp' | 'messenger';

export type BotStatus =
  | 'online'    // Running normally
  | 'offline'   // Stopped
  | 'error'     // Error state
  | 'starting'  // Boot sequence
  | 'stopping'  // Shutdown sequence
  | 'maintenance'; // Planned downtime

export interface BotConfig {
  language: Language;
  dailyReportTime?: string; // "07:00" in 24h format
  timezone: string;
  welcomeMessage?: string;
  fallbackMessage?: string;
  maxResponseTime: number; // seconds
  rateLimitPerMinute: number;
}

export type BotFeature =
  | 'daily_report'
  | 'script_generation'
  | 'objection_handling'
  | 'proactive_followup'
  | 'ai_chat'
  | 'script_library'
  | 'pipeline_view'
  | 'analytics'
  | 'multi_language';

export interface BotMetrics {
  messagesToday: number;
  messagesTotal: number;
  activeUsers: number;
  activeUsersToday: number;
  commandsToday: number;
  commandsTotal: number;
  errorsToday: number;
  avgResponseTime: number; // ms
  uptime: number; // percentage
}

export interface BotLog {
  id: string;
  botId: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// ==================== SCRIPT ====================

export interface Script {
  id: string;
  projectId?: string; // null = global library

  // Content
  category: ScriptCategory;
  name: string;
  contentEn: string;
  contentTh?: string;
  contentEs?: string;

  // Metadata
  source: string; // "Max Steingart", "Hive Learning", "Custom"
  author?: string;
  context?: string; // "Facebook Group", "Cold DM", "LinkedIn"
  tags: string[];

  // Performance
  successCount: number;
  usageCount: number;
  conversionRate: number;
  replyRate: number;

  // Status
  status: ScriptStatus;
  featured: boolean;

  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export type ScriptCategory =
  | 'opening'     // Start conversations
  | 'qualifying'  // Determine fit
  | 'transition'  // Move to business intro
  | 'objection'   // Handle pushback
  | 'follow_up'   // Re-engage
  | 'closing';    // Ask for commitment

export type ScriptStatus = 'active' | 'draft' | 'archived' | 'pending_review';

export interface ScriptFeedback {
  id: string;
  scriptId: string;
  customerId?: string;
  prospectId?: string;
  feedback: FeedbackType;
  feedbackAt: Date;
  notes?: string;
  createdAt: Date;
}

export type FeedbackType = 'no_response' | 'got_reply' | 'converted' | 'negative';

// ==================== PROSPECT ====================

export interface Prospect {
  id: string;
  projectId: string;
  customerId?: string; // Which customer found them

  // Identity
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;

  // Source
  source: string; // "LINE OpenChat", "Facebook Group", etc.
  sourceUrl?: string;
  signalText?: string; // What they said

  // Scoring
  aiScore: number; // 0-100
  priority: Priority;

  // Status
  status: ProspectStatus;
  statusHistory: StatusChange[];

  // Activity
  scriptsGenerated: number;
  lastScriptAt?: Date;
  lastContactedAt?: Date;
  nextFollowUpAt?: Date;

  // Notes
  notes?: string;
  tags: string[];

  // Audit
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type ProspectStatus =
  | 'new'        // Just found
  | 'contacted'  // Reached out
  | 'replied'    // Got response
  | 'qualified'  // Good fit confirmed
  | 'converted'  // Became customer
  | 'lost'       // Not interested
  | 'archived';  // Old/stale

export interface StatusChange {
  from: ProspectStatus;
  to: ProspectStatus;
  changedAt: Date;
  changedBy?: string;
  reason?: string;
}

// ==================== ANALYTICS ====================

export interface AnalyticsOverview {
  period: AnalyticsPeriod;
  startDate: Date;
  endDate: Date;

  // Revenue
  mrr: number;
  mrrChange: number; // percentage

  // Customers
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  churnedCustomers: number;
  churnRate: number;

  // Prospects
  totalProspects: number;
  newProspects: number;
  qualifiedProspects: number;
  convertedProspects: number;
  conversionRate: number;

  // Scripts
  totalScripts: number;
  scriptsGenerated: number;
  scriptSuccessRate: number;

  // Bots
  totalBots: number;
  activeBots: number;
  totalMessages: number;
}

export interface TimeSeriesData {
  date: string; // ISO date
  value: number;
  label?: string;
}

export interface TopPerformer {
  id: string;
  name: string;
  value: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export type AnalyticsPeriod =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_year'
  | 'custom';

// ==================== COMMON ====================

export type Language = 'en' | 'th' | 'es';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

export interface AuditLog {
  id: string;
  projectId: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// ==================== API TYPES ====================

export interface CreateProjectRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  settings?: Partial<ProjectSettings>;
}

export interface CreateCustomerRequest {
  email: string;
  name?: string;
  phone?: string;
  plan?: Plan;
  language?: Language;
  timezone?: string;
  telegramChatId?: string;
}

export interface SendMessageRequest {
  content: string;
  contentType?: ContentType;
  metadata?: Record<string, unknown>;
}

export interface CreateBotRequest {
  name: string;
  type: BotType;
  platform: Platform;
  platformToken?: string;
  description?: string;
  config?: Partial<BotConfig>;
  features?: BotFeature[];
}

export interface CreateScriptRequest {
  category: ScriptCategory;
  name: string;
  contentEn: string;
  contentTh?: string;
  contentEs?: string;
  source?: string;
  context?: string;
  tags?: string[];
}

// ==================== WEBSOCKET EVENTS ====================

export type WebSocketEvent =
  | { type: 'message:new'; payload: Message }
  | { type: 'message:read'; payload: { conversationId: string; messageId: string } }
  | { type: 'conversation:update'; payload: Partial<Conversation> & { id: string } }
  | { type: 'bot:status'; payload: { botId: string; status: BotStatus } }
  | { type: 'prospect:new'; payload: Prospect }
  | { type: 'customer:update'; payload: Partial<Customer> & { id: string } }
  | { type: 'notification'; payload: Notification };

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

export type NotificationType =
  | 'new_customer'
  | 'new_prospect'
  | 'high_score_prospect'
  | 'conversion'
  | 'bot_error'
  | 'payment_failed'
  | 'trial_ending'
  | 'system';
