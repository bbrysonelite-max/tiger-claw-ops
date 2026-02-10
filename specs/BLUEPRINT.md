# Tiger Bot Scout — Technical Blueprint

**Version:** 2.0.0  
**Date:** 2026-02-10  
**Status:** COMPLETE REWRITE  

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 High-Level Architecture

**Customer Journey:**
- Stan Store (purchase) → Stripe (payment) → Webhook → Provisioner → Per-Customer Bot Created

**Bot Fleet Model:**
- Each customer gets their OWN dedicated Telegram bot
- Each bot runs as SEPARATE Node.js process  
- Failure isolation: one bot crash does NOT affect others

**Shared Services:**
- PostgreSQL (data store)
- AI Engine (script generation)
- Hive DB (shared learning patterns)
- Scheduler (daily report cron)
- Admin API (management endpoints)

### 1.2 Key Design Principles

1. **Per-Customer Isolation**
   - Each customer gets dedicated Telegram bot
   - Bots run as separate processes
   - Failure isolation: one bot crash does not affect others

2. **Single Server Simplicity**
   - PostgreSQL for all data
   - PM2 for process management
   - No microservices complexity for v1

3. **Event-Driven**
   - Stripe webhooks trigger provisioning
   - Cron triggers daily reports
   - Telegram updates trigger bot responses

---

## 2. TECHNOLOGY STACK

### 2.1 Runtime
| Layer | Technology | Version |
|-------|------------|--------|
| Runtime | Node.js | 20.x LTS |
| Language | TypeScript | 5.x |
| Process Manager | PM2 | 5.x |
| Package Manager | npm | 10.x |

### 2.2 Backend
| Component | Technology | Purpose |
|-----------|------------|--------|
| API Server | Express.js | Admin API endpoints |
| Telegram | node-telegram-bot-api | Bot framework |
| Database | PostgreSQL | Primary data store |
| ORM | Prisma | Database access |
| Scheduler | node-cron | Daily report scheduling |
| AI | OpenAI API | Script generation |

### 2.3 Infrastructure
| Component | Technology | Details |
|-----------|------------|--------|
| Server | Ubuntu 22.04 | EC2 t3.medium |
| SSL | Lets Encrypt | Via nginx |
| Reverse Proxy | nginx | Route to API |
| DNS | Route53 | api.botcraftwrks.ai |

---

## 3. DATABASE SCHEMA

### 3.1 Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| tenants | Paying customers | id, email, name, stripe_customer_id |
| bots | Per-customer Telegram bots | id, tenant_id, telegram_token, status, pid |
| prospects | Prospects for each tenant | id, tenant_id, name, score, status |
| scripts | Generated approach scripts | id, tenant_id, prospect_id, full_script, outcome |
| daily_reports | Log of sent reports | id, tenant_id, report_date, status |
| hive_patterns | Shared successful patterns | id, pattern_type, template, success_rate |

### 3.2 tenants Table

Stores paying customers.

Fields:
- id: UUID PRIMARY KEY
- email: VARCHAR(255) UNIQUE NOT NULL
- name: VARCHAR(255) NOT NULL  
- status: VARCHAR(50) DEFAULT active (active, paused, churned)
- timezone: VARCHAR(50) DEFAULT Asia/Bangkok
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- stripe_customer_id: VARCHAR(255)
- stripe_subscription_id: VARCHAR(255)
- subscription_status: VARCHAR(50) (active, past_due, canceled)
- provisioned_at: TIMESTAMP
- comped: BOOLEAN DEFAULT FALSE

### 3.3 bots Table

One row per Telegram bot (one per tenant).

Fields:
- id: UUID PRIMARY KEY
- tenant_id: UUID REFERENCES tenants(id) ON DELETE CASCADE
- telegram_token: TEXT NOT NULL (ENCRYPTED)
- telegram_username: VARCHAR(255) (@TigerBot_NancyL_bot)
- telegram_chat_id: BIGINT (customers chat_id after /start)
- status: VARCHAR(50) DEFAULT stopped (stopped, running, error)
- pid: INTEGER (Process ID when running)
- last_health_check: TIMESTAMP
- error_message: TEXT
- last_report_at: TIMESTAMP
- reports_sent: INTEGER DEFAULT 0
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- UNIQUE(tenant_id)

### 3.4 prospects Table

Prospects assigned to tenants.

Fields:
- id: UUID PRIMARY KEY
- tenant_id: UUID REFERENCES tenants(id)
- name: VARCHAR(255) NOT NULL
- source: VARCHAR(100) (line_openchat, facebook, instagram)
- source_url: TEXT
- profile_data: JSONB
- score: INTEGER (0-100)
- score_breakdown: JSONB
- signals: TEXT[]
- status: VARCHAR(50) DEFAULT new (new, delivered, contacted, replied, converted, archived)
- delivered_at: TIMESTAMP
- contacted_at: TIMESTAMP
- replied_at: TIMESTAMP
- converted_at: TIMESTAMP
- language: VARCHAR(10) DEFAULT th
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

### 3.5 scripts Table

Generated approach scripts.

Fields:
- id: UUID PRIMARY KEY
- tenant_id: UUID REFERENCES tenants(id)
- prospect_id: UUID REFERENCES prospects(id)
- opening: TEXT NOT NULL
- value_prop: TEXT
- cta: TEXT  
- objections: JSONB
- full_script: TEXT
- ai_model: VARCHAR(100)
- prompt_version: VARCHAR(50)
- tokens_used: INTEGER
- outcome: VARCHAR(50) (no_response, replied, converted)
- feedback_at: TIMESTAMP
- rating: INTEGER (1-5)
- notes: TEXT
- created_at: TIMESTAMP

### 3.6 daily_reports Table

Log of sent reports.

Fields:
- id: UUID PRIMARY KEY
- tenant_id: UUID REFERENCES tenants(id)
- bot_id: UUID REFERENCES bots(id)
- report_date: DATE NOT NULL
- prospects_count: INTEGER
- prospect_ids: UUID[]
- message_id: BIGINT (Telegram message_id)
- status: VARCHAR(50) (sent, failed, opened)
- sent_at: TIMESTAMP
- opened_at: TIMESTAMP  
- error: TEXT
- created_at: TIMESTAMP
- UNIQUE(tenant_id, report_date)

### 3.7 hive_patterns Table

Shared successful script patterns.

Fields:
- id: UUID PRIMARY KEY
- pattern_type: VARCHAR(100) (opening, objection_response, cta)
- context: JSONB
- template: TEXT NOT NULL
- uses: INTEGER DEFAULT 0
- successes: INTEGER DEFAULT 0
- success_rate: DECIMAL(5,2)
- source_script_id: UUID REFERENCES scripts(id)
- source_tenant_id: UUID REFERENCES tenants(id)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

---

## 4. BOT ARCHITECTURE

### 4.1 Per-Customer Bot Model (CRITICAL)

Each customer gets:
- Their own Telegram bot (@TigerBot_CustomerName_bot)
- Their own bot token (from BotFather)
- Their own Node.js process
- Isolated failure domain

Example:
| Customer | Bot Username | Token | Process |
|----------|--------------|-------|--------|
| Nancy Lim | @TigerBot_NancyL_bot | 7001234567:AAH... | bot-nancy |
| Chana L. | @TigerBot_ChanaL_bot | 7009876543:BBY... | bot-chana |
| Phaitoon S. | @TigerBot_PhaitoonS_bot | 7005551234:CCW... | bot-phaitoon |

### 4.2 Bot Lifecycle States

CREATED -> STARTING -> RUNNING -> STOPPED
                          |
                          v
                        ERROR

| State | Description |
|-------|-------------|
| CREATED | Bot record exists in DB, not yet started |
| STARTING | Process spawning |
| RUNNING | Healthy, responding to commands |
| STOPPED | Gracefully stopped |
| ERROR | Crashed, needs attention |

### 4.3 PM2 Process Model

PM2 Ecosystem:
- tiger-api (port 4001)
- tiger-scheduler (cron runner)
- bot-nancy (Nancys bot)
- bot-chana (Chanas bot)
- bot-phaitoon (Phaitoons bot)
- ... (one per customer)

Why separate processes:
- Process crash does not affect other bots
- Can restart individual bots
- Memory isolation
- Easy horizontal scaling

### 4.4 Bot Worker Entry Point

bot-worker.ts is launched with: pm2 start bot-worker.js --name bot-nancy -- --tenant-id=UUID

It:
1. Gets tenant-id from command args
2. Loads bot config from database
3. Creates TelegramBot with token and polling
4. Registers command handlers (/start, /report, /script, /pipeline, /help)
5. Updates bot status to running with process.pid
6. Listens for Telegram updates

---

## 5. API ENDPOINTS

### 5.1 Admin API (port 4001)

| Method | Endpoint | Purpose |
|--------|----------|--------|
| GET | /health | Server health check |
| GET | /admin/tenants | List all tenants |
| POST | /admin/tenants | Create tenant (manual) |
| GET | /admin/tenants/:id | Get tenant details |
| DELETE | /admin/tenants/:id | Delete tenant |
| GET | /admin/bots | List all bots with status |
| POST | /admin/bots/:tenantId/start | Start a bot |
| POST | /admin/bots/:tenantId/stop | Stop a bot |
| POST | /admin/bots/:tenantId/restart | Restart a bot |
| POST | /webhooks/stripe | Stripe webhook handler |

### 5.2 Stripe Webhook Flow

1. Stripe Event: customer.subscription.created
2. /webhooks/stripe receives event
3. Verify signature (STRIPE_WEBHOOK_SECRET)
4. Extract: customer_id, subscription_id, email
5. Create tenant in DB
6. MANUAL: Create bot via BotFather, get token
7. Add token to bots table
8. Start bot process via PM2
9. Send welcome email with bot link

---

## 6. PROVISIONING FLOW

### 6.1 Automated (Stripe)

1. Customer purchases on Stan Store
2. Stripe creates subscription
3. Stripe sends webhook to /webhooks/stripe
4. System creates tenant record
5. MANUAL: Admin creates bot via BotFather, gets token
6. Admin adds token via API or CLI
7. System starts bot process
8. Welcome email sent to customer

### 6.2 Manual Provisioning (Comped Customers)

CLI command:
./provision-customer.sh --email=customer@email.com --name=Customer Name --bot-token=7001234567:AAHxxx --comped

### 6.3 Bot Token Creation (Manual via BotFather)

1. Message @BotFather on Telegram
2. Send /newbot
3. Name: Tiger Bot - CustomerName
4. Username: TigerBot_CustomerName_bot
5. Copy token
6. Add to system via API/CLI

---

## 7. DAILY REPORT SYSTEM

### 7.1 Scheduler

Using node-cron, runs at 7 AM Bangkok time daily.
For each active tenant, generates and sends report.

### 7.2 Report Generation Steps

1. Query top 5 prospects (score >= 70) for tenant
2. Generate brief approach suggestions  
3. Format Telegram message
4. Send via bot
5. Log to daily_reports table

### 7.3 Report Message Format

Tiger Bot Daily Report
Date

Found N qualified prospects today:

1. Name (Score: X/100)
   Source: location
   Signal: quote
   Suggested approach: brief message
   [Get Full Script button]

... (more prospects)

Pipeline: X total | Y contacted
This week: Z converted

---

## 8. SCRIPT GENERATION

### 8.1 AI Integration

Using OpenAI API (gpt-4-turbo).

Input:
- Prospect profile (name, source, signals, language)
- Tenant context (product, style preferences)
- Hive patterns (successful templates)

Output:
- Opening message
- Value proposition
- Call to action
- Objection responses

### 8.2 Script Prompt Template

System: You are a sales script writer for network marketing.
Context: Prospect details, tenant preferences, successful patterns.
Task: Generate personalized approach script in appropriate language.
Format: Opening, value prop, CTA, objection responses.

---

## 9. HIVE LEARNING

### 9.1 Feedback Collection

After each script is sent, bot asks:
Did this script work?
[No Response] [Got Reply] [Converted]

### 9.2 Pattern Extraction

When outcome = converted:
1. Analyze script components
2. Extract patterns that worked
3. Add to hive_patterns table with context
4. Future scripts can use successful patterns

---

## 10. FILE STRUCTURE

tiger-bot-scout/
  src/
    api/
      server.ts          - Express API server
      routes/
        admin.ts         - Admin endpoints
        webhooks.ts      - Stripe webhooks
    bot/
      bot-manager.ts     - Fleet management
      bot-worker.ts      - Individual bot process
      commands/
        start.ts
        report.ts
        script.ts
        pipeline.ts
        help.ts
    services/
      provisioning.ts    - Customer setup
      reporting.ts       - Daily reports
      ai.ts              - Script generation
      hive.ts            - Hive learning
N prospects(tenant_id);
CREATE INDEX idx_prospects_status ON prospects(tenant_id, status);
CREATE INDEX idx_prospects_score ON prospects(tenant_id, score DESC);
CREATE INDEX idx_scripts_prospect ON scripts(prospect_id);
CREATE INDEX idx_daily_reports_tenant ON daily_reports(tenant_id, report_date DESC);
```

### 3.2 Entity Relationships

```
tenants (1) ───────────── (1) bots
    │
    │ (1)
    │
    ├────────────── (*) prospects
    │                      │
    │                      │ (1)
    │                      │
    │                      └──── (*) scripts
    │
    └────────────── (*) daily_reports
```

---

## 4. BOT ARCHITECTURE

### 4.1 Bot Lifecycle

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  CREATED    │────▶│  STARTING   │────▶│   RUNNING   │────▶│  STOPPED    │
│  (in DB)    │     │  (spawn)    │     │  (healthy)  │     │  (graceful) │
└─────────────┘     └─────────────┘     └──────┬──────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │    ERROR    │
                                        │  (crashed)  │
                                        └─────────────┘
```

### 4.2 Bot Manager Service

```typescript
// bot-manager.ts - Manages the fleet of per-customer bots

interface BotProcess {
  tenantId: string;
  pid: number;
  process: ChildProcess;
  lastHealthCheck: Date;
}

class BotManager {
  private bots: Map<string, BotProcess> = new Map();
  
  // Start all active bots on server startup
  async startFleet(): Promise<void>;
  
  // Start a specific tenant's bot
  async startBot(tenantId: string): Promise<void>;
  
  // Stop a specific tenant's bot
  async stopBot(tenantId: string): Promise<void>;
  
  // Restart a crashed bot
  async restartBot(tenantId: string): Promise<void>;
  
  // Health check all bots
  async healthCheck(): Promise<BotHealthReport[]>;
  
  // Get bot status
  getStatus(tenantId: string): BotStatus;
}
