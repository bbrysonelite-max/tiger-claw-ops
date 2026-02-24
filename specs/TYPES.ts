/**
 * Tiger Claw Scout — TypeScript Type Definitions
 * Version: 2.0.0
 * Date: 2026-02-10
 * 
 * Complete type definitions for the Tiger Claw Scout system.
 * Per-customer bot architecture with isolated processes.
 */

// ============================================================================
// ENUMS
// ============================================================================

/** Tenant account status */
export enum TenantStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  CHURNED = "churned",
  PENDING_BOT = "pending_bot"
}

/** Stripe subscription status */
export enum SubscriptionStatus {
  ACTIVE = "active",
  PAST_DUE = "past_due",
  CANCELED = "canceled",
  TRIALING = "trialing",
  INCOMPLETE = "incomplete"
}

/** Bot process status */
export enum BotStatus {
  CREATED = "created",
  STARTING = "starting",
  RUNNING = "running",
  STOPPED = "stopped",
  ERROR = "error"
}

/** Prospect pipeline status */
export enum ProspectStatus {
  NEW = "new",
  DELIVERED = "delivered",
  CONTACTED = "contacted",
  REPLIED = "replied",
  CONVERTED = "converted",
  ARCHIVED = "archived"
}

/** Script outcome after feedback */
export enum ScriptOutcome {
  PENDING = "pending",
  NO_RESPONSE = "no_response",
  REPLIED = "replied",
  CONVERTED = "converted"
}

/** Daily report delivery status */
export enum ReportStatus {
  PENDING = "pending",
  SENT = "sent",
  FAILED = "failed",
  OPENED = "opened"
}

/** Hive pattern types */
export enum PatternType {
  OPENING = "opening",
  VALUE_PROP = "value_prop",
  CTA = "cta",
  OBJECTION_RESPONSE = "objection_response"
}

/** Prospect source platforms */
export enum ProspectSource {
  LINE_OPENCHAT = "line_openchat",
  FACEBOOK = "facebook",
  INSTAGRAM = "instagram",
  TIKTOK = "tiktok",
  MANUAL = "manual"
}

/** Supported languages */
export enum Language {
  THAI = "th",
  ENGLISH = "en"
}

// ============================================================================
// CORE ENTITIES
// ============================================================================

/** Tenant - A paying customer */
export interface Tenant {
  id: string;                          // UUID
  email: string;                       // Unique email
  name: string;                        // Display name
  status: TenantStatus;                // Account status
  timezone: string;                    // e.g., "Asia/Bangkok"
  createdAt: Date;
  updatedAt: Date;
  
  // Stripe integration
  stripeCustomerId: string | null;     // cus_xxx
  stripeSubscriptionId: string | null; // sub_xxx
  subscriptionStatus: SubscriptionStatus | null;
  
  // Provisioning
  provisionedAt: Date | null;          // When bot was set up
  comped: boolean;                     // Free account flag
}

/** Bot - Dedicated Telegram bot for a tenant */
export interface Bot {
  id: string;                          // UUID
  tenantId: string;                    // FK to Tenant
  
  // Telegram configuration
  telegramToken: string;               // Bot token (encrypted)
  telegramUsername: string;            // @TigerClaw_NancyL_bot
  telegramChatId: number | null;       // Customers chat_id after /start
  
  // Runtime state
  status: BotStatus;                   // Current status
  pid: number | null;                  // Process ID when running
  lastHealthCheck: Date | null;
  errorMessage: string | null;         // Last error if status=ERROR
  
  // Delivery tracking
  lastReportAt: Date | null;           // Last daily report sent
  reportsSent: number;                 // Total reports sent
  
  createdAt: Date;
  updatedAt: Date;
}

/** Prospect - A potential recruit/customer */
export interface Prospect {
  id: string;                          // UUID
  tenantId: string;                    // FK to Tenant
  
  // Profile
  name: string;
  source: ProspectSource;
  sourceUrl: string | null;            // Link to profile/post
  profileData: ProspectProfile;        // Flexible profile data
  
  // Scoring
  score: number;                       // 0-100
  scoreBreakdown: ScoreBreakdown;
  signals: string[];                   // Interest signals detected
  
  // Pipeline
  status: ProspectStatus;
  deliveredAt: Date | null;
  contactedAt: Date | null;
  repliedAt: Date | null;
  convertedAt: Date | null;
  
  // Localization
  language: Language;
  
  createdAt: Date;
  updatedAt: Date;
}

/** Script - Generated approach script */
export interface Script {
  id: string;                          // UUID
  tenantId: string;                    // FK to Tenant
  prospectId: string;                  // FK to Prospect
  
  // Content
  opening: string;                     // Opening message
  valueProp: string;                   // Value proposition
  cta: string;                         // Call to action
  objections: ObjectionResponses;      // Objection handling
  fullScript: string;                  // Complete formatted script
  
  // Generation metadata
  aiModel: string;                     // e.g., "gpt-4-turbo"
  promptVersion: string;               // For tracking iterations
  tokensUsed: number;
  
  // Feedback
  outcome: ScriptOutcome;
  feedbackAt: Date | null;
  rating: number | null;               // 1-5 stars
  notes: string | null;                // Customer notes
  
  createdAt: Date;
}

/** Daily Report - Log of sent reports */
export interface DailyReport {
  id: string;                          // UUID
  tenantId: string;                    // FK to Tenant
  botId: string;                       // FK to Bot
  
  // Report content
  reportDate: string;                  // YYYY-MM-DD
  prospectsCount: number;
  prospectIds: string[];               // UUIDs of included prospects
  messageId: number | null;            // Telegram message_id
  
  // Delivery status
  status: ReportStatus;
  sentAt: Date | null;
  openedAt: Date | null;
  error: string | null;
  
  createdAt: Date;
}

/** Hive Pattern - Shared successful patterns */
export interface HivePattern {
  id: string;                          // UUID
  
  // Pattern details
  patternType: PatternType;
  context: PatternContext;             // When to use this pattern
  template: string;                    // The pattern template
  
  // Effectiveness
  uses: number;
  successes: number;
  successRate: number;                 // 0.00 - 100.00
  
  // Source
  sourceScriptId: string | null;
  sourceTenantId: string | null;
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

/** Flexible prospect profile data */
export interface ProspectProfile {
  bio?: string;
  location?: string;
  occupation?: string;
  interests?: string[];
  socialProfiles?: SocialProfile[];
  customFields?: Record<string, string>;
}

/** Social media profile link */
export interface SocialProfile {
  platform: string;
  url: string;
  username?: string;
}

/** Score breakdown by category */
export interface ScoreBreakdown {
  interest: number;                    // 0-40 points
  engagement: number;                  // 0-30 points
  fit: number;                         // 0-20 points
  timing: number;                      // 0-10 points
}

/** Objection responses map */
export interface ObjectionResponses {
  tooExpensive?: string;
  noTime?: string;
  notInterested?: string;
  needToThink?: string;
  [key: string]: string | undefined;   // Custom objections
}

/** Pattern context for matching */
export interface PatternContext {
  prospectSignals?: string[];
  prospectSource?: ProspectSource;
  language?: Language;
  industry?: string;
  [key: string]: unknown;
}


// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/** Create tenant request */
export interface CreateTenantRequest {
  email: string;
  name: string;
  timezone?: string;
  comped?: boolean;
  botToken?: string;                   // If bot already created
  botUsername?: string;
}

/** Create tenant response */
export interface CreateTenantResponse {
  success: boolean;
  tenant: Tenant;
  bot?: Bot;
  message: string;
}

/** Provision bot request */
export interface ProvisionBotRequest {
  tenantId: string;
  telegramToken: string;
  telegramUsername: string;
}

/** Bot action response */
export interface BotActionResponse {
  success: boolean;
  botId: string;
  status: BotStatus;
  message: string;
}

/** Fleet status response */
export interface FleetStatusResponse {
  totalBots: number;
  running: number;
  stopped: number;
  error: number;
  bots: BotStatusSummary[];
}

/** Bot status summary for fleet view */
export interface BotStatusSummary {
  id: string;
  tenantId: string;
  tenantName: string;
  username: string;
  status: BotStatus;
  lastHealthCheck: Date | null;
  lastReportAt: Date | null;
  errorMessage: string | null;
}

/** Generate script request */
export interface GenerateScriptRequest {
  prospectId: string;
  tenantId: string;
  includeHivePatterns?: boolean;
}

/** Generate script response */
export interface GenerateScriptResponse {
  success: boolean;
  script: Script;
  tokensUsed: number;
  generationTimeMs: number;
}

/** Submit feedback request */
export interface SubmitFeedbackRequest {
  scriptId: string;
  outcome: ScriptOutcome;
  rating?: number;
  notes?: string;
}

/** Stripe webhook payload (simplified) */
export interface StripeWebhookPayload {
  id: string;
  type: string;
  data: {
    object: StripeSubscription | StripeInvoice;
  };
}

/** Stripe subscription object (relevant fields) */
export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  metadata: {
    email?: string;
    name?: string;
  };
}

/** Stripe invoice object (relevant fields) */
export interface StripeInvoice {
  id: string;
  customer: string;
  subscription: string;
  status: string;
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

/** Bot Manager - Fleet management service */
export interface IBotManager {
  /** Start all active tenant bots */
  startFleet(): Promise<void>;
  
  /** Stop all bots gracefully */
  stopFleet(): Promise<void>;
  
  /** Start a specific tenant bot */
  startBot(tenantId: string): Promise<BotActionResponse>;
  
  /** Stop a specific tenant bot */
  stopBot(tenantId: string): Promise<BotActionResponse>;
  
  /** Restart a specific tenant bot */
  restartBot(tenantId: string): Promise<BotActionResponse>;
  
  /** Health check all bots */
  healthCheck(): Promise<FleetStatusResponse>;
  
  /** Get status of specific bot */
  getBotStatus(tenantId: string): Promise<BotStatusSummary>;
}

/** Provisioning Service */
export interface IProvisioningService {
  /** Create new tenant from Stripe webhook */
  createTenantFromStripe(payload: StripeWebhookPayload): Promise<Tenant>;
  
  /** Create tenant manually (comped) */
  createTenantManual(request: CreateTenantRequest): Promise<CreateTenantResponse>;
  
  /** Add bot to existing tenant */
  provisionBot(request: ProvisionBotRequest): Promise<Bot>;
  
  /** Deactivate tenant on churn */
  deactivateTenant(tenantId: string): Promise<void>;
}

/** Report Service */
export interface IReportService {
  /** Generate and send daily report for tenant */
  generateDailyReport(tenantId: string): Promise<DailyReport>;
  
  /** Generate reports for all active tenants */
  generateAllDailyReports(): Promise<DailyReport[]>;
  
  /** Get report history for tenant */
  getReportHistory(tenantId: string, limit?: number): Promise<DailyReport[]>;
}

/** Script Generation Service */
export interface IScriptService {
  /** Generate script for prospect */
  generateScript(request: GenerateScriptRequest): Promise<Script>;
  
  /** Submit feedback for script */
  submitFeedback(request: SubmitFeedbackRequest): Promise<Script>;
  
  /** Get scripts for prospect */
  getScriptsForProspect(prospectId: string): Promise<Script[]>;
}

/** Hive Learning Service */
export interface IHiveService {
  /** Extract patterns from successful script */
  extractPatterns(scriptId: string): Promise<HivePattern[]>;
  
  /** Get matching patterns for prospect */
  getMatchingPatterns(prospect: Prospect): Promise<HivePattern[]>;
  
  /** Update pattern success rate */
  recordPatternUsage(patternId: string, success: boolean): Promise<void>;
}

// ============================================================================
// BOT COMMAND TYPES
// ============================================================================

/** Telegram message context */
export interface TelegramContext {
  chatId: number;
  messageId: number;
  userId: number;
  username?: string;
  text: string;
}

/** Bot command handler */
export type CommandHandler = (
  ctx: TelegramContext,
  tenantId: string
) => Promise<void>;

/** Bot command definition */
export interface BotCommand {
  command: string;                     // e.g., "start", "report"
  description: string;
  handler: CommandHandler;
}

/** Inline keyboard button */
export interface InlineButton {
  text: string;
  callbackData: string;
}

/** Report message with inline keyboard */
export interface ReportMessage {
  text: string;
  parseMode: "HTML" | "Markdown";
  inlineKeyboard: InlineButton[][];
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/** Application configuration */
export interface AppConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  telegram: TelegramConfig;
  stripe: StripeConfig;
  openai: OpenAIConfig;
  encryption: EncryptionConfig;
}

/** Server configuration */
export interface ServerConfig {
  port: number;
  host: string;
  adminApiKey: string;
}

/** Database configuration */
export interface DatabaseConfig {
  url: string;
  maxConnections?: number;
}

/** Telegram configuration */
export interface TelegramConfig {
  // No global token - each bot has its own
  pollingInterval?: number;
  webhookUrl?: string;
}

/** Stripe configuration */
export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
}

/** OpenAI configuration */
export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
}

/** Encryption configuration */
export interface EncryptionConfig {
  algorithm: string;
  key: string;                         // 32-byte hex
}

// ============================================================================
// PM2 ECOSYSTEM TYPES
// ============================================================================

/** PM2 app configuration */
export interface PM2AppConfig {
  name: string;
  script: string;
  args?: string;
  instances?: number;
  autorestart?: boolean;
  watch?: boolean;
  env?: Record<string, string>;
}

/** PM2 ecosystem configuration */
export interface PM2EcosystemConfig {
  apps: PM2AppConfig[];
}

/** Bot process info for PM2 */
export interface BotProcessInfo {
  name: string;                        // e.g., "bot-nancy"
  tenantId: string;
  pid: number;
  status: "online" | "stopping" | "stopped" | "errored";
  memory: number;
  cpu: number;
  uptime: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/** Pagination parameters */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/** Paginated response */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** API error response */
export interface ApiError {
  success: false;
  error: string;
  code: string;
  details?: unknown;
}

/** Result type for operations that can fail */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/** Async result type */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/** Date range filter */
export interface DateRange {
  from: Date;
  to: Date;
}

/** Health check response */
export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  uptime: number;
  database: boolean;
  botsRunning: number;
  botsTotal: number;
  lastReportTime: Date | null;
}

// ============================================================================
// DATABASE QUERY TYPES (for Prisma/raw queries)
// ============================================================================

/** Tenant with bot info */
export interface TenantWithBot extends Tenant {
  bot: Bot | null;
}

/** Prospect with scripts */
export interface ProspectWithScripts extends Prospect {
  scripts: Script[];
}

/** Tenant filter options */
export interface TenantFilter {
  status?: TenantStatus;
  subscriptionStatus?: SubscriptionStatus;
  comped?: boolean;
  search?: string;
}

/** Prospect filter options */
export interface ProspectFilter {
  tenantId: string;
  status?: ProspectStatus;
  minScore?: number;
  source?: ProspectSource;
  language?: Language;
}

/** Bot filter options */
export interface BotFilter {
  status?: BotStatus;
  hasError?: boolean;
}

// ============================================================================
// EVENT TYPES (for internal pub/sub)
// ============================================================================

/** Base event type */
export interface BaseEvent {
  type: string;
  timestamp: Date;
  tenantId?: string;
}

/** Bot started event */
export interface BotStartedEvent extends BaseEvent {
  type: "bot.started";
  tenantId: string;
  botId: string;
  pid: number;
}

/** Bot stopped event */
export interface BotStoppedEvent extends BaseEvent {
  type: "bot.stopped";
  tenantId: string;
  botId: string;
  reason: "manual" | "error" | "shutdown";
}

/** Report sent event */
export interface ReportSentEvent extends BaseEvent {
  type: "report.sent";
  tenantId: string;
  reportId: string;
  prospectsCount: number;
}

/** Script generated event */
export interface ScriptGeneratedEvent extends BaseEvent {
  type: "script.generated";
  tenantId: string;
  scriptId: string;
  prospectId: string;
}

/** Feedback received event */
export interface FeedbackReceivedEvent extends BaseEvent {
  type: "feedback.received";
  tenantId: string;
  scriptId: string;
  outcome: ScriptOutcome;
}

/** Union of all events */
export type AppEvent =
  | BotStartedEvent
  | BotStoppedEvent
  | ReportSentEvent
  | ScriptGeneratedEvent
  | FeedbackReceivedEvent;

// ============================================================================
// CONSTANTS
// ============================================================================

/** Minimum score for prospect to be included in report */
export const MIN_REPORT_SCORE = 70;

/** Maximum prospects per daily report */
export const MAX_PROSPECTS_PER_REPORT = 5;

/** Health check interval in milliseconds */
export const HEALTH_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/** Default timezone */
export const DEFAULT_TIMEZONE = "Asia/Bangkok";

/** Report delivery hour (24h format) */
export const REPORT_DELIVERY_HOUR = 7;

/** OpenAI model for script generation */
export const DEFAULT_AI_MODEL = "gpt-4-turbo";

/** Max tokens for script generation */
export const MAX_SCRIPT_TOKENS = 1000;
