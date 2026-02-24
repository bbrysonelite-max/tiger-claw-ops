# Tiger Claw Scout v1.0.0 — Enterprise Blueprint

## Document Control
| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Codename | Command Center |
| Status | Blueprint |
| Author | Claude Opus 4.5 |
| Date | 2026-02-05 |
| Classification | Enterprise Deliverable |

---

## 1. VISION

**One sentence:** The command center that runs your entire bot empire.

**Core principles (Jony Ive style):**
1. **Clarity** — Every element has one purpose, immediately understood
2. **Deference** — The UI gets out of the way; content is king
3. **Depth** — Simple surface, powerful depths for those who need it
4. **Isolation** — Projects don't bleed into each other. Ever.
5. **Real-time** — If it happened, you see it. Now.

---

## 2. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TIGER BOT SCOUT v1.0.0                             │
│                            "Command Center"                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   DASHBOARD     │     │      API        │     │    DATABASE     │
│   (Frontend)    │────▶│   (Backend)     │────▶│   (PostgreSQL)  │
│                 │     │                 │     │                 │
│ • React 19      │     │ • Express/Node  │     │ • Multi-tenant  │
│ • TypeScript    │     │ • TypeScript    │     │ • Row-level sec │
│ • Tailwind      │     │ • WebSocket     │     │ • Audit logs    │
│ • shadcn/ui     │     │ • REST + WS     │     │ • Full-text     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   BOTS          │     │   INTEGRATIONS  │     │   AI/LLM        │
│                 │     │                 │     │                 │
│ • Telegram      │     │ • Stripe        │     │ • Anthropic     │
│ • LINE          │     │ • Brevo         │     │ • Script Gen    │
│ • WhatsApp*     │     │ • Twilio        │     │ • Translation   │
│ • Messenger*    │     │ • Calendly      │     │ • Chat          │
└─────────────────┘     └─────────────────┘     └─────────────────┘

* Future
```

---

## 3. CORE MODULES

### 3.1 PROJECT ISOLATION

**Problem:** Context bleeds between unrelated work.

**Solution:** Everything belongs to a Project. Projects are walled gardens.

```
┌─────────────────────────────────────────────────────────────────┐
│ PROJECT: Tiger Claw Scout                                        │
├─────────────────────────────────────────────────────────────────┤
│ • Customers: 7                                                  │
│ • Bots: TigerClawScout_bot                                       │
│ • Prospects: 47                                                 │
│ • Messages: 234                                                 │
│ • Scripts: 89                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PROJECT: Spanish Bot Launch                                     │
├─────────────────────────────────────────────────────────────────┤
│ • Customers: 0                                                  │
│ • Bots: TigerClaw_es (pending)                                   │
│ • Prospects: 0                                                  │
│ • Messages: 12                                                  │
│ • Scripts: 15                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Database Schema:**
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#f97316',  -- Orange
    icon TEXT DEFAULT '🐯',
    settings JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Everything has a project_id
ALTER TABLE customers ADD COLUMN project_id UUID REFERENCES projects(id);
ALTER TABLE prospects ADD COLUMN project_id UUID REFERENCES projects(id);
ALTER TABLE messages ADD COLUMN project_id UUID REFERENCES projects(id);
ALTER TABLE scripts ADD COLUMN project_id UUID REFERENCES projects(id);
ALTER TABLE bots ADD COLUMN project_id UUID REFERENCES projects(id);
```

**UI: Project Switcher**
```
┌──────────────────────────────────────┐
│ 🐯 Tiger Claw Scout          ▼       │
├──────────────────────────────────────┤
│ 🐯 Tiger Claw Scout       ✓          │
│ 🇪🇸 Spanish Bot Launch              │
│ 🧪 Testing Sandbox                  │
│ ─────────────────────────           │
│ + Create New Project                │
└──────────────────────────────────────┘
```

---

### 3.2 MESSAGING SYSTEM

**Problem:** Messages scattered across Telegram, email, notes.

**Solution:** Unified inbox with conversation threading.

**Features:**
| Feature | Description |
|---------|-------------|
| Unified Inbox | All messages from all channels in one view |
| Conversation Threading | Messages grouped by contact |
| Channel Icons | Telegram 📱, LINE 💚, Email ✉️, SMS 📲 |
| Real-time Updates | WebSocket push, no refresh needed |
| Quick Reply | Reply from inbox without leaving |
| Templates | One-click insert script/template |
| Search | Full-text search across all messages |
| Filters | By channel, date, status, project |

**Database Schema:**
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    contact_id UUID REFERENCES contacts(id),
    channel TEXT NOT NULL,  -- telegram, line, email, sms
    channel_id TEXT,        -- External ID (chat_id, etc)
    last_message_at TIMESTAMPTZ,
    unread_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'open',  -- open, closed, archived
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    direction TEXT NOT NULL,  -- inbound, outbound
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text',  -- text, image, file, script
    sender_type TEXT NOT NULL,  -- user, bot, contact
    sender_id TEXT,
    read_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_conversations_last ON conversations(last_message_at DESC);
```

**UI: Inbox Layout**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ INBOX                                              🔍 Search    Filter ▼    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────┐  ┌────────────────────────────────────────────────┐ │
│ │ CONVERSATIONS       │  │ Somchai K.                              📱     │ │
│ │                     │  │ ──────────────────────────────────────────────│ │
│ │ ● Somchai K.    2m  │  │                                               │ │
│ │   📱 ขอบคุณครับ...   │  │ [10:30 AM] Somchai:                           │ │
│ │                     │  │ สนใจครับ ขอข้อมูลเพิ่มเติมได้ไหมครับ          │ │
│ │ ○ Nancy Lim    1h   │  │                                               │ │
│ │   📱 Thanks for...  │  │ [10:32 AM] You:                               │ │
│ │                     │  │ ยินดีค่ะ! ส่งข้อมูลให้ทางนี้เลยนะคะ           │ │
│ │ ○ Phaitoon     3h   │  │ [Shows product info]                         │ │
│ │   📱 ไว้คุยกันใหม่... │  │                                               │ │
│ │                     │  │ [10:45 AM] Somchai:                           │ │
│ │ ○ Tarida       1d   │  │ ขอบคุณครับ ผมจะดูและติดต่อกลับ               │ │
│ │   ✉️ Re: Welcome... │  │                                               │ │
│ │                     │  │ ──────────────────────────────────────────────│ │
│ │                     │  │ [Type a message...]            📎 📝 Send ➤  │ │
│ └─────────────────────┘  └────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Legend: ● = unread, ○ = read, 📱 = Telegram, 💚 = LINE, ✉️ = Email
```

---

### 3.3 CUSTOMER MANAGEMENT

**Problem:** Customer data in dashboard is static, hardcoded.

**Solution:** Full CRUD, lifecycle tracking, automated provisioning.

**Customer Lifecycle:**
```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  LEAD    │───▶│ PENDING  │───▶│  ACTIVE  │───▶│ CHURNED  │───▶│ WINBACK  │
│          │    │  SETUP   │    │          │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
    │                │                │                │                │
    │                │                │                │                │
Signed up      Payment         Bot started       Cancelled        Re-subscribed
               received        /start sent       subscription
```

**Database Schema:**
```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),

    -- Identity
    email TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    avatar_url TEXT,

    -- Subscription
    plan TEXT NOT NULL DEFAULT 'scout',
    status TEXT NOT NULL DEFAULT 'pending_setup',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    trial_ends_at TIMESTAMPTZ,

    -- Bot Connection
    telegram_chat_id TEXT,
    telegram_username TEXT,
    line_user_id TEXT,

    -- Preferences
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'Asia/Bangkok',
    notification_preferences JSONB DEFAULT '{}',

    -- Metrics
    prospects_found INTEGER DEFAULT 0,
    scripts_generated INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    last_active_at TIMESTAMPTZ,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE TYPE customer_status AS ENUM (
    'lead',
    'trial',
    'pending_setup',
    'active',
    'paused',
    'cancelled',
    'churned'
);
```

**UI: Customer Card**
```
┌────────────────────────────────────────────────────────────────┐
│ 👩 Nancy Lim                                     ✅ Active     │
│ nancylimsk@gmail.com                                          │
├────────────────────────────────────────────────────────────────┤
│ Plan: Scout $99/mo              Since: Feb 3, 2026            │
│ Language: English               Timezone: Bangkok (UTC+7)     │
├────────────────────────────────────────────────────────────────┤
│ 📊 METRICS                                                     │
│ Prospects: 23    Scripts: 15    Conversions: 3    Rate: 20%   │
├────────────────────────────────────────────────────────────────┤
│ 📱 CONNECTIONS                                                 │
│ Telegram: @nancylim ✅ Connected                               │
│ LINE: Not connected                                           │
├────────────────────────────────────────────────────────────────┤
│ [💬 Message]  [📝 Generate Script]  [⚙️ Settings]  [⋯ More]   │
└────────────────────────────────────────────────────────────────┘
```

---

### 3.4 BOT FLEET MANAGEMENT

**Problem:** Can't see bot status, can't manage multiple bots.

**Solution:** Fleet dashboard with health monitoring.

**Bot Types:**
| Type | Purpose | Platform |
|------|---------|----------|
| Scout | Prospect reports + scripts | Telegram |
| Assistant | Personal AI helper | Telegram |
| Discovery | Agent Zero prospect finding | Docker |
| Support | Customer support automation | Multi |

**Database Schema:**
```sql
CREATE TABLE bots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),

    -- Identity
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    type TEXT NOT NULL,  -- scout, assistant, discovery, support
    description TEXT,
    avatar_url TEXT,

    -- Platform
    platform TEXT NOT NULL,  -- telegram, line, docker
    platform_id TEXT,        -- Bot username or container ID
    platform_token TEXT,     -- Encrypted

    -- Status
    status TEXT DEFAULT 'offline',  -- online, offline, error, starting
    last_ping_at TIMESTAMPTZ,
    error_message TEXT,

    -- Config
    config JSONB DEFAULT '{}',
    features JSONB DEFAULT '[]',  -- enabled features

    -- Metrics
    messages_today INTEGER DEFAULT 0,
    messages_total INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bot_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID NOT NULL REFERENCES bots(id),
    level TEXT NOT NULL,  -- info, warn, error
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**UI: Bot Card**
```
┌────────────────────────────────────────────────────────────────┐
│ 🐯 Tiger Claw Scout                              ● Online       │
│ @TigerClawScout_bot                                            │
├────────────────────────────────────────────────────────────────┤
│ Type: Scout           Platform: Telegram                      │
│ Uptime: 3 days        Last ping: 2s ago                       │
├────────────────────────────────────────────────────────────────┤
│ TODAY                                                          │
│ Messages: 47          Commands: 12          Errors: 0         │
├────────────────────────────────────────────────────────────────┤
│ CONNECTED CUSTOMERS: 7                                         │
│ Nancy, Chana, Phaitoon, Tarida, Lily, Theera, John            │
├────────────────────────────────────────────────────────────────┤
│ [📊 Analytics]  [📋 Logs]  [⚙️ Config]  [🔄 Restart]          │
└────────────────────────────────────────────────────────────────┘
```

---

### 3.5 SCRIPT LIBRARY

**Problem:** Scripts are generated on-the-fly, no library.

**Solution:** Curated library with categories, languages, success tracking.

**Already defined in ENHANCED_BOT_SPEC.md**

Key additions for v1:
- **Admin UI** to add/edit scripts
- **Import from CSV** (bulk upload Max Steingart scripts)
- **Success tracking** per customer, per script
- **A/B testing** variants

---

### 3.6 ANALYTICS DASHBOARD

**Problem:** No visibility into what's working.

**Solution:** Real-time analytics with actionable insights.

**Key Metrics:**
| Metric | Description |
|--------|-------------|
| MRR | Monthly recurring revenue |
| Customer Count | Active, trial, churned |
| Churn Rate | % customers lost this month |
| Prospects/Day | Average prospects found |
| Script Success Rate | % scripts that got reply/converted |
| Top Scripts | Best performing by conversion |
| Top Sources | Where best prospects come from |

**UI: Analytics Overview**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ANALYTICS                                   Last 30 days ▼    Export 📥    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ $693         │  │ 7            │  │ 0%           │  │ 23%          │    │
│  │ MRR          │  │ Customers    │  │ Churn        │  │ Script Rate  │    │
│  │ +$693 ↑      │  │ +7 this mo   │  │ —            │  │ +5% ↑        │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PROSPECTS OVER TIME                                                 │   │
│  │ ▁▂▃▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅                                   │   │
│  │ Jan 6                            Feb 5                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────┐   │
│  │ TOP SCRIPTS                  │  │ TOP SOURCES                      │   │
│  │ 1. Curiosity Opener   47%   │  │ 1. LINE OpenChat      45%        │   │
│  │ 2. Compliment Opener  38%   │  │ 2. Facebook Groups    32%        │   │
│  │ 3. Value-First        35%   │  │ 3. LinkedIn           15%        │   │
│  │ 4. The Soft Intro     31%   │  │ 4. Manual Entry        8%        │   │
│  └──────────────────────────────┘  └──────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. TYPE DEFINITIONS

See: `/types/v1/` directory

```typescript
// types/v1/project.ts
export interface Project {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon: string;
  settings: ProjectSettings;
  status: 'active' | 'archived' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectSettings {
  defaultLanguage: 'en' | 'th' | 'es';
  timezone: string;
  features: string[];
}

// types/v1/customer.ts
export interface Customer {
  id: string;
  projectId: string;
  email: string;
  name?: string;
  phone?: string;
  avatarUrl?: string;
  plan: Plan;
  status: CustomerStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  trialEndsAt?: Date;
  telegramChatId?: string;
  telegramUsername?: string;
  lineUserId?: string;
  language: 'en' | 'th' | 'es';
  timezone: string;
  notificationPreferences: NotificationPreferences;
  metrics: CustomerMetrics;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export type Plan = 'scout' | 'coach' | 'closer' | 'scout_free' | 'trial';

export type CustomerStatus =
  | 'lead'
  | 'trial'
  | 'pending_setup'
  | 'active'
  | 'paused'
  | 'cancelled'
  | 'churned';

export interface CustomerMetrics {
  prospectsFound: number;
  scriptsGenerated: number;
  conversions: number;
  responseRate: number;
}

// types/v1/message.ts
export interface Conversation {
  id: string;
  projectId: string;
  contactId?: string;
  channel: Channel;
  channelId?: string;
  lastMessageAt?: Date;
  unreadCount: number;
  status: 'open' | 'closed' | 'archived';
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  projectId: string;
  direction: 'inbound' | 'outbound';
  content: string;
  contentType: 'text' | 'image' | 'file' | 'script';
  senderType: 'user' | 'bot' | 'contact';
  senderId?: string;
  readAt?: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export type Channel = 'telegram' | 'line' | 'email' | 'sms' | 'whatsapp';

// types/v1/bot.ts
export interface Bot {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  type: BotType;
  description?: string;
  avatarUrl?: string;
  platform: Platform;
  platformId?: string;
  platformToken?: string; // Encrypted
  status: BotStatus;
  lastPingAt?: Date;
  errorMessage?: string;
  config: BotConfig;
  features: string[];
  metrics: BotMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export type BotType = 'scout' | 'assistant' | 'discovery' | 'support';
export type Platform = 'telegram' | 'line' | 'docker' | 'whatsapp';
export type BotStatus = 'online' | 'offline' | 'error' | 'starting' | 'stopping';

export interface BotConfig {
  language: 'en' | 'th' | 'es';
  dailyReportTime?: string; // "07:00"
  timezone: string;
  features: BotFeature[];
}

export type BotFeature =
  | 'daily_report'
  | 'script_generation'
  | 'objection_handling'
  | 'proactive_followup'
  | 'ai_chat';

export interface BotMetrics {
  messagesToday: number;
  messagesTotal: number;
  activeUsers: number;
  commandsToday: number;
}

// types/v1/script.ts
export interface Script {
  id: string;
  projectId?: string; // null = global library
  category: ScriptCategory;
  name: string;
  contentEn: string;
  contentTh?: string;
  contentEs?: string;
  source: string; // "Max Steingart", "Hive Learning", "Custom"
  context?: string; // "Facebook Group", "Cold DM"
  successCount: number;
  usageCount: number;
  conversionRate: number;
  tags: string[];
  status: 'active' | 'draft' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export type ScriptCategory =
  | 'opening'
  | 'qualifying'
  | 'transition'
  | 'objection'
  | 'follow_up'
  | 'closing';
```

---

## 5. API SPECIFICATION

### Base URL
```
Production: https://api.botcraftwrks.ai/v1
Staging:    https://api-staging.botcraftwrks.ai/v1
```

### Authentication
```
Header: Authorization: Bearer <token>
```

### Endpoints

#### Projects
```
GET    /v1/projects                    List all projects
POST   /v1/projects                    Create project
GET    /v1/projects/:id                Get project
PATCH  /v1/projects/:id                Update project
DELETE /v1/projects/:id                Archive project
```

#### Customers
```
GET    /v1/projects/:pid/customers     List customers
POST   /v1/projects/:pid/customers     Create customer
GET    /v1/customers/:id               Get customer
PATCH  /v1/customers/:id               Update customer
DELETE /v1/customers/:id               Delete customer
POST   /v1/customers/:id/provision     Provision bot for customer
```

#### Messages
```
GET    /v1/projects/:pid/conversations List conversations
GET    /v1/conversations/:id/messages  Get messages
POST   /v1/conversations/:id/messages  Send message
PATCH  /v1/conversations/:id           Update conversation (close, archive)
```

#### Bots
```
GET    /v1/projects/:pid/bots          List bots
POST   /v1/projects/:pid/bots          Create bot
GET    /v1/bots/:id                    Get bot
PATCH  /v1/bots/:id                    Update bot
POST   /v1/bots/:id/start              Start bot
POST   /v1/bots/:id/stop               Stop bot
POST   /v1/bots/:id/restart            Restart bot
GET    /v1/bots/:id/logs               Get bot logs
```

#### Scripts
```
GET    /v1/scripts                     List global scripts
GET    /v1/projects/:pid/scripts       List project scripts
POST   /v1/projects/:pid/scripts       Create script
GET    /v1/scripts/:id                 Get script
PATCH  /v1/scripts/:id                 Update script
DELETE /v1/scripts/:id                 Delete script
POST   /v1/scripts/:id/use             Track usage
POST   /v1/scripts/:id/feedback        Submit feedback
```

#### Analytics
```
GET    /v1/projects/:pid/analytics/overview    Dashboard overview
GET    /v1/projects/:pid/analytics/prospects   Prospect trends
GET    /v1/projects/:pid/analytics/scripts     Script performance
GET    /v1/projects/:pid/analytics/customers   Customer metrics
```

#### Webhooks
```
POST   /v1/webhooks/stripe             Stripe webhook
POST   /v1/webhooks/telegram           Telegram webhook
POST   /v1/webhooks/line               LINE webhook
```

---

## 6. FILE STRUCTURE

```
tiger-bot-scout/
├── VERSION.md
├── README.md
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
│
├── api/
│   ├── server.ts                 # Entry point
│   ├── routes/
│   │   ├── projects.ts
│   │   ├── customers.ts
│   │   ├── messages.ts
│   │   ├── bots.ts
│   │   ├── scripts.ts
│   │   ├── analytics.ts
│   │   └── webhooks.ts
│   ├── services/
│   │   ├── provisioning.ts
│   │   ├── messaging.ts
│   │   ├── bot-manager.ts
│   │   ├── script-engine.ts
│   │   └── analytics.ts
│   ├── bots/
│   │   ├── telegram-bot.ts
│   │   ├── line-bot.ts
│   │   └── bot-base.ts
│   ├── integrations/
│   │   ├── stripe.ts
│   │   ├── anthropic.ts
│   │   ├── brevo.ts
│   │   └── twilio.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── project-context.ts
│   │   └── rate-limit.ts
│   └── utils/
│       ├── db.ts
│       ├── logger.ts
│       └── encryption.ts
│
├── types/
│   └── v1/
│       ├── index.ts
│       ├── project.ts
│       ├── customer.ts
│       ├── message.ts
│       ├── bot.ts
│       ├── script.ts
│       └── analytics.ts
│
├── website/
│   ├── index.html               # Landing page
│   └── dashboard/
│       ├── index.html           # Dashboard SPA entry
│       ├── app.tsx              # React app
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── styles/
│
├── database/
│   ├── schema.sql               # Full schema
│   ├── migrations/
│   │   ├── 001_initial.sql
│   │   ├── 002_projects.sql
│   │   └── ...
│   └── seeds/
│       ├── scripts.sql          # Max Steingart scripts
│       └── test-data.sql
│
├── docs/
│   ├── V1_BLUEPRINT.md          # This file
│   ├── API.md                   # API documentation
│   ├── PROVISIONING.md
│   └── ENHANCED_BOT_SPEC.md
│
└── tests/
    ├── api/
    ├── bots/
    └── e2e/
```

---

## 7. IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1)
- [ ] Set up new project structure
- [ ] Create database schema v1
- [ ] Implement Projects module
- [ ] Basic authentication
- [ ] Deploy staging environment

### Phase 2: Core Features (Week 2)
- [ ] Customer management CRUD
- [ ] Messaging system + WebSocket
- [ ] Bot fleet management
- [ ] Script library + seed data

### Phase 3: Intelligence (Week 3)
- [ ] Proactive bot features
- [ ] Multi-language support
- [ ] Analytics dashboard
- [ ] Stripe integration update

### Phase 4: Polish (Week 4)
- [ ] UI/UX refinement
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] Production deployment

---

## 8. SUCCESS CRITERIA

| Metric | Target |
|--------|--------|
| Page load time | < 2 seconds |
| Message delivery | < 500ms |
| Bot response time | < 3 seconds |
| Uptime | 99.9% |
| API response | < 200ms (p95) |

---

## 9. AGENT EXECUTION NOTES

This blueprint is designed to be executed by Claude or Agent Zero.

**Key instructions for agents:**
1. Always work within the project context
2. Use TypeScript strict mode
3. Follow the file structure exactly
4. Write tests for new features
5. Document all API endpoints
6. Use the defined types
7. Commit with semantic messages
8. Keep VERSION.md updated

**Handoff command:**
```
"Build Tiger Claw Scout v1.0.0 following the V1_BLUEPRINT.md specification.
Start with Phase 1: Foundation. Create the project structure and database schema."
```

---

**Document End**
**Version:** 1.0.0
**Status:** Ready for Implementation
