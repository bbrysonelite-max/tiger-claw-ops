# Tiger Bot Scout — Technical Blueprint

**Version:** 4.0.0
**Date:** 2026-02-19
**Branch:** feat/script-engine-language-support
**Status:** In Development

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 System Diagram

```
 ┌────────────────────────────────────────────────────────────┐
 │                       CLIENT CHANNELS                      │
 │   Telegram Webhook │ Stripe Webhook │ SMS (Twilio) │ Web   │
 └──────────────────────────┬─────────────────────────────────┘
                            │
                 ┌──────────▼──────────┐
                 │   Gateway API        │
                 │   Express.js :4001   │
                 │   (router.ts)        │
                 └──────────┬──────────┘
                            │ Enqueue Jobs
              ┌─────────────▼──────────────┐
              │      Redis + BullMQ         │
              │  ┌──────────────────────┐  │
              │  │ Queue: inbound       │  │
              │  │ Queue: provision     │  │
              │  │ Queue: reports       │  │
              │  │ Queue: enrichment    │  │
              │  └──────────────────────┘  │
              └──────────────┬─────────────┘
                             │ Process Jobs
        ┌────────────────────┼──────────────────────┐
        │                    │                      │
┌───────▼───────┐  ┌─────────▼──────┐  ┌───────────▼───────┐
│ Fleet Worker  │  │Provision Worker│  │ Report Scheduler  │
│ (worker.ts)   │  │(provision-     │  │(prospect-         │
│ Concurrency:10│  │ worker.ts)     │  │ scheduler.ts)     │
└───────┬───────┘  └────────────────┘  └───────────────────┘
        │
        │ Uses
┌───────▼────────────────────────────────────────────┐
│                  SHARED SERVICES                    │
│  Conversation Engine │ Agent Brain │ Script Engine  │
│  Web Search          │ Enrichment  │ Hive Learning  │
└───────────────────────┬────────────────────────────┘
                        │
               ┌────────▼────────┐
               │   PostgreSQL     │
               │   (via Prisma)  │
               └─────────────────┘
```

### 1.2 Key Design Principles

1. **Queue-First** — All work goes through BullMQ. No direct synchronous processing of webhooks.
2. **Virtual Bot Pattern** — Bots are instantiated on-demand from a short-lived cache (60s TTL), not persistent processes.
3. **Hash-Based Routing** — Telegram webhooks routed by SHA-256 hash of bot token. Token never appears in URL.
4. **Proactive by Default** — Agent Brain starts hunting immediately on ACTIVE state. No user prompt required.
5. **Language-Aware** — Script Engine detects language and adapts output throughout the pipeline.
6. **Graceful Degradation** — Auto-provisioning failure creates pending record + admin alert. Nothing is lost.

---

## 2. TECHNOLOGY STACK

### 2.1 Runtime

| Layer | Technology | Version |
|-------|-----------|--------|
| Runtime | Node.js | 20.x LTS |
| Language | TypeScript | 5.x |
| Package Manager | npm | 10.x |
| Process Manager | PM2 (API + workers only) | 5.x |

### 2.2 Backend Services

| Component | Technology | Purpose |
|-----------|-----------|--------|
| API Gateway | Express.js | Webhook ingestion, admin routes |
| Job Queue | BullMQ | Async message processing |
| Cache/Queue Broker | Redis (ioredis) | BullMQ backend |
| Database | PostgreSQL | Primary data store |
| ORM | Prisma | Type-safe DB access |
| Telegram | node-telegram-bot-api | Virtual bot instances |
| Provisioning | gramjs (MTProto) | Auto-create bots via BotFather |
| Scheduler | node-cron | Daily report cron |
| AI (Conversations) | Google Gemini 2.0 Flash | Cheap, fast conversation AI |
| AI (Scripts) | OpenAI GPT-4 | High-quality script generation |
| Web Search | Serper.dev API | Google search with key rotation |
| SMS | Twilio | Inbound/outbound SMS channel |
| Email | Brevo (SendinBlue) | Transactional emails |
| Encryption | CryptoJS (AES-256) | Bot token encryption at rest |

### 2.3 Infrastructure

| Component | Technology | Details |
|-----------|-----------|--------|
| Server | Ubuntu 22.04 | AWS EC2 t3.medium |
| SSL | Let's Encrypt | Via nginx |
| Reverse Proxy | nginx | → :4001 |
| DNS | Route53 | api.botcraftwrks.ai |

---

## 3. DATABASE SCHEMA

### 3.1 Tables Overview

| Table | Purpose |
|-------|--------|
| `tenants` | Customer records with bot config and state |
| `prospects` | Prospects hunted per tenant |
| `scripts` | Generated approach scripts with outcomes |
| `daily_reports` | Log of delivered reports |
| `hive_patterns` | Shared successful script patterns |
| `invite_tokens` | Invite-based provisioning tokens |

### 3.2 tenants Table

```prisma
model Tenant {
  id              String    @id @default(uuid())
  email           String    @unique
  name            String
  stripeId        String?
  botToken        String    // AES-256 encrypted
  botTokenHash    String    @unique // SHA-256 for webhook routing
  botUsername     String
  chat_id         String?   // Telegram chat_id (set after /start)
  status          String    @default("provisioning")
  // status: provisioning | active | suspended | error
  state           String    @default("IDLE")
  // state: IDLE | WELCOME | INTERVIEW_1 | INTERVIEW_2 | ACTIVE | ERROR_RECOVERY
  interview_data  Json?     // Structured interview results
  inviteTokenId   String?
  trialEndsAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  prospects       Prospect[]
  scripts         Script[]
  dailyReports    DailyReport[]
}
```

**status vs state distinction:**
- `status` = account health (active/suspended/provisioning/error)
- `state` = onboarding progress (IDLE → ACTIVE conversation state machine)

### 3.3 prospects Table

```prisma
model Prospect {
  id          String    @id @default(uuid())
  tenantId    String
  tenant      Tenant    @relation(fields: [tenantId], references: [id])
  name        String
  source      String    // "reddit", "linkedin", "google", "sms", etc.
  sourceUrl   String?
  summary     String?   // AI-generated summary from enrichment
  interests   String[]
  painPoints  String[]
  score       Integer   // 0-100 ICP match score
  status      String    @default("new")
  // status: new | contacted | replied | converted | not_relevant
  language    String    @default("auto")
  // language: th | en | th-en | auto
  profileData Json?     // Raw enriched data
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  scripts     Script[]
}
```

### 3.4 scripts Table

```prisma
model Script {
  id              String    @id @default(uuid())
  tenantId        String
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  prospectId      String
  prospect        Prospect  @relation(fields: [prospectId], references: [id])
  language        String    // th | en | th-en
  opening         String
  valueProp       String?
  cta             String?
  objections      Json?     // { "too_expensive": "...", "no_time": "..." }
  followUp        String?
  fullScript      String    // Assembled final script
  aiModel         String    // "gemini-2.0-flash" | "gpt-4-turbo"
  promptVersion   String
  outcome         String?
  // outcome: null | no_response | replied | converted
  feedbackAt      DateTime?
  sentAt          DateTime?
  createdAt       DateTime  @default(now())
}
```

### 3.5 hive_patterns Table

```prisma
model HivePattern {
  id             String   @id @default(uuid())
  language       String   // th | en | th-en
  patternType    String   // opening | value_prop | cta | objection | follow_up
  context        Json     // role, icp_type, pain_point_category
  template       String   // The successful script fragment
  uses           Int      @default(0)
  successes      Int      @default(0)
  successRate    Decimal  @default(0)
  sourceTenantId String?
  sourceScriptId String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

### 3.6 invite_tokens Table

```prisma
model InviteToken {
  id         String    @id @default(uuid())
  token      String    @unique
  trialDays  Int       @default(0)  // 0 = permanent
  createdBy  String    // admin email or system
  claimedBy  String?
  claimedAt  DateTime?
  tenantId   String?
  expiresAt  DateTime? // Token expiry (not trial expiry)
  createdAt  DateTime  @default(now())
}
```

---

## 4. VIRTUAL BOT PATTERN

### 4.1 How It Works

In v3, each customer had a dedicated long-running Node.js process managed by PM2. In v4, bots are **virtual** — created on-demand when a message arrives.

```
Telegram sends update to: POST /webhook/:hash
                           ↓
Gateway validates hash, enqueues job with { hash, update }
                           ↓
Fleet Worker picks up job
                           ↓
Worker looks up tenant by botTokenHash
                           ↓
Worker decrypts botToken
                           ↓
getOrCreateBot(token, tenantId) → short-lived cache (60s TTL)
                           ↓
TelegramBot instance created with { polling: false }
                           ↓
Message handled, response sent
                           ↓
Bot instance returned to cache (reused for next 60s)
```

### 4.2 Bot Cache

```typescript
// Short-lived cache to avoid re-creating bots for rapid sequential messages
const botCache = new Map<string, { bot: TelegramBot; timestamp: number }>();
const BOT_CACHE_TTL = 60000; // 1 minute

// Cache cleaned every 5 minutes
setInterval(cleanupBotCache, 5 * 60 * 1000);
```

**Why this works:**
- Telegram users don't send messages at > 1/sec sustained rate
- Cache hit saves ~100ms of bot instantiation overhead
- Cache miss is safe — just creates a new instance
- Memory footprint scales with active users, not total users

### 4.3 Webhook URL Structure

Each tenant gets a unique webhook URL:

```
POST https://api.botcraftwrks.ai/webhook/{botTokenHash}
```

- `botTokenHash` = `SHA-256(botToken)`
- Hash is computed at provisioning time, stored in DB
- Token is never exposed in URL
- On trial expiry or suspension: webhook still receives, worker drops silently

---

## 5. SCRIPT ENGINE — LANGUAGE SUPPORT

### 5.1 Module Location

```
src/
  fleet/
    script-engine.ts        ← Main script engine (this branch)
    language-detector.ts    ← Language detection from prospect data
    hive-service.ts         ← Hive pattern lookup and storage
```

### 5.2 Language Detection Logic

```typescript
interface LanguageDetectionInput {
  prospectName: string;
  prospectSource: string;       // "reddit", "facebook_th", "linkedin", etc.
  prospectSummary: string;
  sourceUrl: string;
  tenantLanguagePref?: string;  // Customer's configured preference
  icpLocationPref?: string;     // "Thailand", "US", "any", etc.
}

// Detection priority (highest to lowest):
// 1. sourceUrl contains Thai domain (.th) or Thai group keywords
// 2. prospectSummary contains Thai Unicode characters (U+0E00–U+0E7F)
// 3. prospectSource explicitly mapped (facebook_th → th)
// 4. tenantLanguagePref (customer configured)
// 5. icpLocationPref contains Thailand/SE Asia → th
// 6. Default: en
```

### 5.3 Script Generation Prompts

#### Thai Script Prompt

```
System: You are a Thai network marketing coach generating a personalized approach script.

Context:
- Customer: {customerName} ({businessType})
- Prospect: {prospectName}
- Why they're a fit: {summary}
- Their pain points: {painPoints}
- Successful patterns (Hive): {hivePatterns}

Requirements:
- Write in Thai (ภาษาไทย)
- Use polite register with ครับ/ค่ะ as appropriate
- Be relationship-first, not transactional
- Reference the prospect's specific situation
- Avoid direct "join my business" in the opening
- Keep opening under 100 words

Generate a JSON with: opening, valueProp, cta, objections{too_expensive, no_time, tried_mlm}, followUp
```

#### English Script Prompt

```
System: You are a network marketing coach generating a personalized outreach script.

Context:
- Customer: {customerName} ({businessType})
- Prospect: {prospectName}
- Why they're a fit: {summary}
- Their pain points: {painPoints}
- Successful patterns (Hive): {hivePatterns}

Requirements:
- Professional but conversational English
- Reference the prospect's specific situation from their post/profile
- Curiosity-based opener — don't lead with the opportunity
- Include "The Three Threes" philosophy if prospect shows urgency signals
- Keep opening under 80 words

Generate a JSON with: opening, valueProp, cta, objections{too_expensive, no_time, tried_mlm}, followUp
```

### 5.4 Hive Pattern Integration

```typescript
// Before generating, check Hive for successful patterns
async function getRelevantHivePatterns(
  language: string,
  patternType: string,
  context: { role: string; painPointCategory: string }
): Promise<PatternMatch[]> {
  // Vector similarity search OR keyword match on context JSON
  // Returns top 3 most successful patterns sorted by success_rate
  // Only returns patterns with >= 3 uses (avoid outliers)
}

// After Converted feedback, extract and store pattern
async function contributeToHive(script: Script, prospect: Prospect): Promise<void> {
  // Extract opening that got a conversion
  // Store with context: { language, role, painPointCategory, icpType }
  // Increment uses and successes on matching patterns
}
```

### 5.5 Channel-Specific Formatting

| Channel | Max Length | Formatting |
|---------|-----------|-----------|
| Telegram | No limit | Markdown: **bold**, _italic_, [links] |
| SMS | 300 chars | Plain text, opening only |
| Web Chat | No limit | HTML or Markdown depending on widget |

---

## 6. QUEUE ARCHITECTURE

### 6.1 Queue Definitions

```typescript
export const QUEUE_NAMES = {
  INBOUND: 'inbound',      // Telegram updates → Fleet Worker
  PROVISION: 'provision',  // New customer setup → Provision Worker
  ENRICHMENT: 'enrichment', // Prospect scraping → Enrichment Worker
  REPORTS: 'reports',      // Daily report generation → Scheduler
} as const;
```

### 6.2 Job Retry Policy

| Queue | Attempts | Backoff |
|-------|---------|--------|
| inbound | 3 | Exponential, 1s initial |
| provision | 3 | Exponential, 2s initial |
| enrichment | 2 | Fixed, 5s |
| reports | 2 | Fixed, 30s |

### 6.3 Worker Concurrency

| Worker | Concurrency | Reason |
|--------|------------|--------|
| Fleet Worker | 10 | Parallel message handling |
| Provision Worker | 1 | MTProto session serialization |
| Enrichment Worker | 3 | Rate-limit-safe scraping |
| Report Scheduler | 5 | Parallel tenant report generation |

### 6.4 Rate Limiting

Fleet Worker applies BullMQ rate limiting:
```typescript
limiter: {
  max: 100,
  duration: 1000, // 100 jobs per second max
}
```

---

## 7. PROVISIONING SYSTEM

### 7.1 Auto-Provisioning via MTProto

The `provision-worker.ts` uses gramjs to authenticate as a Telegram user (admin account) and create new bots via BotFather:

```
provisionNewBot(name, email):
  1. Connect to Telegram via MTProto (gramjs session)
  2. Start conversation with @BotFather
  3. Send /newbot
  4. Send bot name: "Tiger Bot - {name}"
  5. Send username: "Tiger_{randomHex}_bot"
  6. Parse token from BotFather response
  7. Return { token, username, hash: sha256(token) }
```

**Session Storage:** gramjs session string stored in `TELEGRAM_SESSION` env var.

**Fallback:** If MTProto fails, creates PENDING_ placeholder and alerts admin on Telegram with manual instructions.

### 7.2 Token Security Pipeline

```
Raw token (from BotFather)
      ↓
AES-256 encrypt (ENCRYPTION_KEY from env)
      ↓
Store encrypted token in tenants.botToken
      ↓
SHA-256 hash of RAW token
      ↓
Store hash in tenants.botTokenHash
      ↓
Register Telegram webhook:
  POST https://api.telegram.org/bot{rawToken}/setWebhook
  url: https://api.botcraftwrks.ai/webhook/{hash}
```

Raw token is never stored in plaintext or URLs after this process.

### 7.3 Invite Token Flow

```typescript
// Admin creates invite
POST /admin/invite
{ trialDays: 30 }  // or 0 for permanent
→ Returns: { token: "abc123", url: "https://api.botcraftwrks.ai/invite/abc123" }

// Customer claims invite
GET /invite/:token
→ Validates token (not expired, not claimed)
→ Enqueues provision job with { inviteTokenId, trialDays }
→ Provision worker creates bot, sets trialEndsAt
→ Marks InviteToken as claimed (claimedBy, claimedAt, tenantId)
```

---

## 8. ENRICHMENT PIPELINE

### 8.1 Pipeline Steps

```
Prospect URL received (from web-search.ts)
        ↓
scraper.ts — fetch public page content
        ↓
chunker.ts — split into 512-token segments
        ↓
summarizer.ts — AI summarizes: interests, pain points, context
        ↓
Store in prospects.summary + prospects.profileData
        ↓
Trigger script generation if requested
```

### 8.2 Scraper

- Uses axios with a descriptive User-Agent
- Handles LinkedIn (via Google cache), Reddit (JSON API), general web
- Returns: `{ title, content, url }` (ScrapeResult type)
- Timeout: 10 seconds per request

### 8.3 Chunker

- Splits content at sentence boundaries
- Max 512 tokens per chunk (Gemini context efficient)
- Preserves paragraph structure

### 8.4 Summarizer

```
Prompt: "Extract key information about this person for sales prospecting:
  - Who are they (role, situation)?
  - What pain points do they express?
  - What are they interested in?
  - What buying signals are present?
  Return JSON: { summary, interests[], painPoints[], buyingSignals[] }"
```

---

## 9. MULTI-CHANNEL ARCHITECTURE

### 9.1 Channel Registration

All channels registered in `src/channels/channel-router.ts` and mounted on the gateway Express app.

### 9.2 Telegram (Primary)

- Webhook-based (no long polling)
- Per-tenant bot URL: `/webhook/:botTokenHash`
- Message flow: Gateway → Redis queue → Fleet Worker → Virtual Bot → Telegram API

### 9.3 SMS (Twilio)

- Inbound: `POST /sms/webhook` (Twilio calls this)
- Outbound: `POST /sms/send`
- Tenant lookup: by phone number stored in `interview_data.interview1.phone`
- Scripts auto-truncated to 300 chars for SMS

### 9.4 Web Chat Widget

- Embeds via: `<script src="https://api.botcraftwrks.ai/widget/{tenantId}"></script>`
- Session-based (no auth — anonymous chat with AI)
- Sessions stored in memory (Map), TTL 1 hour
- Endpoint: `POST /chat/web { tenantId, sessionId, message }`

### 9.5 Channel Status Endpoint

`GET /channels/status` returns live config state:

```json
{
  "telegram": { "enabled": true, "status": "active" },
  "sms": { "enabled": true, "phone": "+1234567890" },
  "web": { "enabled": true, "status": "active" },
  "email": { "enabled": true, "status": "ready" },
  "line": { "enabled": false, "status": "coming soon" }
}
```

---

## 10. FILE STRUCTURE

```
tiger-bot-scout/
  src/
    channels/
      channel-router.ts       Multi-channel Express router
      line-channel.ts         LINE channel (stub)
      sms-channel.ts          Twilio SMS send/receive
      web-channel.ts          Web chat widget + sessions
    enrichment/
      chunker.ts              Token-aware content chunker
      scraper.ts              Public URL content fetcher
      summarizer.ts           AI-powered prospect summarizer
    fleet/
      agent-brain.ts          Proactive hunting after ACTIVE state
      conversation-engine.ts  2-stage interview state machine
      prospect-scheduler.ts   Daily report cron (7 AM)
      script-engine.ts        ← NEW: Multi-language script generator
      language-detector.ts    ← NEW: Language detection from prospect data
      hive-service.ts         ← NEW: Hive pattern lookup/storage
      web-search.ts           Serper + Reddit + LinkedIn search
      worker.ts               BullMQ fleet worker (processes inbound queue)
    gateway/
      index.ts                Express app entry point
      router.ts               FleetRouter class (enqueues jobs)
    monitoring/
      health.ts               Health check endpoint + queue metrics
    provisioner/
      provision-worker.ts     BullMQ provision worker
      session-generator.ts    MTProto session setup utility
      userbot.ts              gramjs BotFather automation
    shared/
      crypto.ts               AES-256 encrypt/decrypt helpers
      types.ts                TypeScript type definitions (source of truth)
  specs/
    v4/
      PRD_v4.md               Product requirements (this doc's companion)
      BLUEPRINT_v4.md         This document
  prisma/
    schema.prisma             Database schema
    migrations/               Migration history
  scripts/
    invite.ts                 CLI: generate invite tokens
    provision.ts              CLI: manual provisioning fallback
  tests/
    unit/
      script-engine.test.ts   Script engine unit tests
      language-detector.test.ts
      conversation-engine.test.ts
    integration/
      provisioning.test.ts
      webhook-routing.test.ts
  .env.example
  package.json
  tsconfig.json
  pm2.config.js               API server + workers (not bots)
```

---

## 11. ENVIRONMENT VARIABLES

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/tigerbot

# Redis
REDIS_URL=redis://localhost:6379

# Encryption (32-byte hex)
ENCRYPTION_KEY=your-32-byte-hex-key-here

# Telegram Admin Bot (for admin notifications)
TELEGRAM_BOT_TOKEN=admin-bot-token
TELEGRAM_REPORT_CHAT_ID=your-chat-id

# Telegram MTProto (for auto-provisioning)
TELEGRAM_API_ID=12345
TELEGRAM_API_HASH=abc123def456
TELEGRAM_SESSION=gramjs-session-string

# AI
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=sk-your-openai-key

# Search (3-key rotation)
SERPER_KEY_1=your-serper-key-1
SERPER_KEY_2=your-serper-key-2
SERPER_KEY_3=your-serper-key-3

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio (SMS)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890

# Brevo (Email)
BREVO_API_KEY=your-brevo-key

# Admin
ADMIN_API_KEY=random-secret-string
API_URL=https://api.botcraftwrks.ai

# Worker
WORKER_CONCURRENCY=10
```

---

## 12. PM2 PROCESS MODEL

```javascript
// pm2.config.js
module.exports = {
  apps: [
    {
      name: 'tiger-api',
      script: 'dist/gateway/index.js',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'tiger-fleet-worker',
      script: 'dist/fleet/worker.js',
      env: { WORKER_CONCURRENCY: 10 }
    },
    {
      name: 'tiger-provision-worker',
      script: 'dist/provisioner/provision-worker.js',
      instances: 1
    },
    {
      name: 'tiger-scheduler',
      script: 'dist/fleet/prospect-scheduler.js',
      instances: 1
    }
  ]
}
```

Note: In v4, PM2 manages 4 services — NOT one process per customer. Customer isolation is handled by the virtual bot pattern at the application layer.

---

## 13. SECURITY MODEL

### 13.1 Token Isolation

```
BotFather Token (plaintext)
    ↓ AES-256 encrypt(ENCRYPTION_KEY)
    → stored: tenants.botToken (encrypted string)
    ↓ SHA-256 hash(plaintext token)
    → stored: tenants.botTokenHash (routing key)
    ↓ Register Telegram webhook
    → URL: /webhook/{hash}  ← hash only, never token
```

### 13.2 Tenant Data Isolation

Every database query scoped by `tenantId`:
```typescript
// CORRECT - always filter by tenantId
await prisma.prospect.findMany({ where: { tenantId: ctx.tenantId } });

// WRONG - never query without tenant scope
await prisma.prospect.findMany(); // ← never do this
```

### 13.3 Admin API Authentication

```typescript
// All /admin/* routes require:
// Header: X-API-Key: {ADMIN_API_KEY}
```

---

## 14. IMPLEMENTATION PLAN — SCRIPT ENGINE FEATURE

### Phase 1: Language Detector (1 day)

- [ ] Create `src/fleet/language-detector.ts`
- [ ] Implement detection from: source URL, summary text, Unicode ranges, tenant pref
- [ ] Unit tests for all detection scenarios
- [ ] Thai Unicode range check (U+0E00–U+0E7F)

### Phase 2: Script Engine Core (2 days)

- [ ] Create `src/fleet/script-engine.ts`
- [ ] Thai prompt template
- [ ] English prompt template
- [ ] Mixed Thai-English prompt template
- [ ] JSON response parsing with fallback
- [ ] Channel formatting (Telegram / SMS / Web)
- [ ] Unit tests for each language and channel

### Phase 3: Hive Service (1 day)

- [ ] Create `src/fleet/hive-service.ts`
- [ ] `getRelevantHivePatterns(language, patternType, context)` function
- [ ] `contributeToHive(script, prospect)` function on Converted feedback
- [ ] Update `hive_patterns` schema to include `language` field
- [ ] Migration for language column

### Phase 4: Integration (1 day)

- [ ] Wire script-engine into worker.ts on script request
- [ ] Wire script-engine into daily report delivery
- [ ] Wire hive contribution into feedback callback handler
- [ ] Update Telegram message format to show language indicator
- [ ] End-to-end test: Thai prospect → Thai script → Hive contribution

### Phase 5: Validation (1 day)

- [ ] Thai native speaker review of 5 sample scripts
- [ ] Confirm cultural appropriateness
- [ ] Confirm polite register (ครับ/ค่ะ) usage
- [ ] Test with real tenant on Thai prospects
- [ ] Verify Hive patterns accumulate correctly

---

## 15. MONITORING

### 15.1 Health Check

`GET /health` returns:
```json
{
  "status": "healthy",
  "queue": {
    "inbound": { "waiting": 0, "active": 2, "completed": 1423, "failed": 1 },
    "provision": { "waiting": 0, "active": 0, "completed": 47, "failed": 0 }
  },
  "database": "connected",
  "redis": "connected"
}
```

### 15.2 Key Metrics to Watch

| Metric | Alert Threshold |
|--------|----------------|
| inbound queue depth | > 100 waiting jobs |
| provision queue failures | > 0 failed jobs |
| Worker error rate | > 1% of jobs |
| Script generation failures | > 5% of requests |
| Language detection fallback rate | > 20% (indicates detection needs tuning) |

### 15.3 Logging

- Structured JSON logs via console (captured by PM2)
- Format: `[service] Message — {key: value}`
- No sensitive data (tokens, emails) in logs
- Log levels: error, warn, info (no debug in production)

---

## 16. SUCCESS CRITERIA

- [ ] Language detected correctly for Thai and English prospects
- [ ] Thai scripts use proper polite register
- [ ] English scripts are personalized and not generic
- [ ] Script generation succeeds in < 10 seconds
- [ ] Hive patterns accumulate from Converted feedback
- [ ] All existing functionality unaffected (no regressions)
- [ ] SMS format (300 char) enforced for SMS channel
- [ ] Unit tests pass for all script engine modules
