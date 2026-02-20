# Tiger Bot Scout — Product Requirements Document

**Version:** 4.0.0
**Date:** 2026-02-19
**Branch:** feat/script-engine-language-support
**Status:** In Development

---

## 1. EXECUTIVE SUMMARY

### 1.1 Product Vision

Tiger Bot Scout is an AI-powered prospecting machine for network marketing distributors. Each paying customer receives their own dedicated Telegram bot that proactively hunts prospects, conducts onboarding interviews to learn the customer's business and ICP, and delivers qualified leads with personalized multi-language approach scripts.

### 1.2 Target Users

- Network marketing distributors (Nu Skin, Herbalife, Amway, and other MLM companies)
- Direct sales professionals
- Coaches, tutors, fitness trainers, freelancers seeking clients
- Located primarily in Thailand/Southeast Asia and the United States

### 1.3 Business Model

| Item | Detail |
|------|--------|
| Price | $99/month per customer |
| Trial | Invite-based free trial (configurable days) |
| Checkout | Stan Store → Stripe billing |
| Delivery | Dedicated Telegram bot per customer |

### 1.4 Core Value Proposition

> "Your Tiger Bot interviews you, learns your business, then hunts prospects across LinkedIn, Reddit, and social communities — delivering qualified leads with personalized scripts in any language."

---

## 2. WHAT'S NEW IN V4

### 2.1 v3 → v4 Key Changes

| Area | v3 | v4 |
|------|----|----|
| Architecture | Per-process PM2 bots | Queue-based virtual bot pattern (BullMQ + Redis) |
| Bot Provisioning | Manual via BotFather | Auto-provisioned via MTProto/gramjs |
| Onboarding | Static /start command | Conversational interview engine (2-stage) |
| Prospect Hunting | Manual seed data | Proactive agent brain (web search + Reddit + LinkedIn) |
| Script Delivery | Scheduled daily report | On-demand + event-driven |
| AI Engine | OpenAI GPT-4 | Google Gemini 2.0 Flash (primary) + OpenAI (scripts) |
| Channels | Telegram only | Telegram + SMS (Twilio) + Web Chat widget |
| **Script Engine** | **Basic templates** | **Multi-language script engine (Thai + English + multilingual)** |
| Trial System | None | Invite token + configurable trial period |

### 2.2 This Feature Branch: Script Engine with Language Support

The `feat/script-engine-language-support` branch adds a dedicated **Script Engine** that:

1. Detects the prospect's language from their profile data and source signals
2. Generates personalized approach scripts in the correct language (Thai, English, or mixed)
3. Adapts tone, cultural context, and communication style per language
4. Integrates with the Hive learning system to improve scripts over time
5. Supports full script lifecycle: generate → deliver → collect feedback → improve

---

## 3. PROBLEM STATEMENT

### 3.1 Customer Pain Points

| Problem | Impact |
|---------|--------|
| Manual prospect research | 2–4 hours/day wasted scrolling social media |
| Cold outreach without context | Low response rates (< 5%) |
| Generic copy-paste scripts | Feel spammy, damage relationships |
| Language barriers | Thai distributors need Thai scripts for Thai prospects |
| No tracking of what works | Can't learn or improve approach |
| Time zones and daily discipline | Missing morning outreach windows |

### 3.2 Script Engine Specific Problem

Customers recruit from multiple demographics:
- **Thai-speaking prospects** require culturally-aware Thai scripts
- **English-speaking prospects** require professional English scripts
- **Bilingual prospects** benefit from mixed-language approaches
- Generic AI scripts in the wrong language are immediately ignored

---

## 4. FUNCTIONAL REQUIREMENTS

### 4.1 Onboarding — Conversational Interview Engine

The bot onboards each customer through a 2-stage natural language interview. No forms, no buttons — just conversation.

**State Machine:**

```
IDLE → WELCOME → INTERVIEW_1 → INTERVIEW_2 → ACTIVE
```

| State | Description |
|-------|-------------|
| IDLE | Customer just provisioned, awaiting first message |
| WELCOME | Bot sent greeting, waiting for "ready" confirmation |
| INTERVIEW_1 | Collecting: name, business type, experience, mission, methods |
| INTERVIEW_2 | Collecting: ICP description, pain points, channels, exclusions |
| ACTIVE | Fully onboarded — bot hunts proactively |
| ERROR_RECOVERY | Fallback state if data is incomplete |

**Anti-Pattern Rules (enforced in code):**
- NEVER ask where to find leads — bot already knows
- NEVER re-ask questions already answered
- NEVER list limitations — work around them
- NEVER say "coming soon" — default to ACTION
- Extract intent from paragraphs, don't force structured input

**Interview 1 — About the Customer:**
- Full name
- Business type (role-detected automatically)
- Business description
- Years of experience
- Mission/goals
- Current prospecting methods

**Interview 2 — Ideal Customer Profile (ICP):**
- ICP description (who they're looking for)
- Pain points of their ideal customer
- Where the ICP hangs out online
- Keywords the ICP uses
- Buying triggers
- Exclusions (who to avoid)

### 4.2 Agent Brain — Proactive Hunting

Immediately after Interview 2, the bot begins hunting. No user action required.

**Role Detection:**
Bot detects customer's role from interview data and maps to a pre-loaded Lead Source Intelligence Map:

| Role | Sources | Subreddits | Groups |
|------|---------|------------|--------|
| Network Marketer | LinkedIn, Reddit, Facebook, YouTube | r/antiMLM, r/sidehustle | Side Hustle Nation |
| Hair Stylist | LinkedIn, Facebook, Reddit, Yelp | r/hairstylist, r/beauty | Hair Stylists Unite |
| Rideshare Driver | Reddit, Facebook, LinkedIn | r/uberdrivers, r/lyftdrivers | Rideshare Profits |
| Real Estate | LinkedIn, Reddit, BiggerPockets | r/realestate, r/realtor | Real Estate Agents |
| Fitness Coach | LinkedIn, Reddit, Meetup | r/personaltraining | Online Fitness Coaching |
| Teacher | LinkedIn, Reddit, Facebook | r/teachers, r/education | Teachers Who Side Hustle |
| Default | LinkedIn, Reddit, Facebook, Google | r/entrepreneur, r/sidehustle | Small Business Owners |

**Hunt Process:**
1. Reddit search across mapped subreddits
2. LinkedIn search via Google (public profiles)
3. Pain-point keyword search across all platforms
4. Each result scored against customer's ICP (0–100)
5. Only prospects scoring ≥ 40 saved to database
6. Results formatted and delivered to Telegram

**Serper Key Rotation:**
Google search uses up to 3 Serper API keys with automatic rotation on quota exhaustion (403) or rate limit (429).

### 4.3 Script Engine — Multi-Language Support (This Branch)

#### 4.3.1 Language Detection

The script engine detects prospect language using:
1. Source platform signals (Thai Facebook groups → Thai)
2. Prospect name and location data
3. Keywords and phrases in their posts/comments
4. Customer's configured language preference
5. ICP location data from Interview 2

**Supported Languages:**
| Code | Language | Notes |
|------|----------|-------|
| `th` | Thai | Primary for SE Asia customers |
| `en` | English | Primary for US customers |
| `th-en` | Thai-English mixed | Bilingual prospects |
| `auto` | Auto-detect | Default — detect from prospect data |

#### 4.3.2 Script Components

Each generated script contains:

| Component | Description |
|-----------|-------------|
| **Opening** | Personalized hook referencing prospect's specific signals |
| **Value Prop** | Benefit statement relevant to detected pain points |
| **CTA** | Soft ask appropriate to relationship stage |
| **Objection Responses** | Pre-written for "too expensive", "no time", "already tried MLM" |
| **Follow-up** | Follow-up message if no response after 48 hours |

#### 4.3.3 Script Generation Process

```
Prospect profile received
        ↓
Language detection (signals + location + customer preference)
        ↓
Check Hive patterns for successful templates in detected language
        ↓
AI generates script using: prospect profile + ICP context + Hive patterns
        ↓
Script formatted per channel (Telegram, SMS, Web Chat)
        ↓
Delivered with feedback buttons: [Sent] [Got Reply] [Converted] [Not Relevant]
```

#### 4.3.4 Thai Language Requirements

- Scripts use polite Thai register (ครับ/ค่ะ appropriate to context)
- Cultural context: relationship-first approach, not transactional
- Avoid direct "join my business" — use curiosity-based openers
- Support Thai Unicode characters throughout entire system

#### 4.3.5 Script Feedback and Hive Learning

After a script is marked "Sent":
1. After 48 hours, bot asks: "Did this script work?"
2. Customer taps: `[No Response]` `[Got Reply]` `[Converted]`
3. Outcome stored in `scripts` table with language and prospect context
4. On `Converted`: pattern extracted and added to `hive_patterns`
5. Hive patterns weighted by language code — Thai successes improve Thai scripts

### 4.4 Prospect Enrichment

Before generating a script, the enrichment pipeline runs:

1. **Scraper** — Fetches prospect's public profile/post URL
2. **Chunker** — Breaks content into digestible segments
3. **Summarizer** — AI summarizes key info: interests, pain points, context
4. Enriched data stored in `prospects.summary` and `prospects.profile_data`

### 4.5 Daily Report Delivery

Even in v4's event-driven model, the daily 7 AM report continues:

**Trigger:** Cron job at 7:00 AM customer's timezone (default: Asia/Bangkok)

**Content:**
```
🐯 Tiger Bot Report — Feb 19, 2026

Found 5 new prospects today:

1. Somchai K. (Score: 85) 🔥
   LinkedIn · Network Marketer · Bangkok
   "Looking for new income stream that fits my schedule"
   [Get Script] [Not Relevant]

...

📊 Pipeline: 23 total | 8 contacted | 2 converted this week
```

### 4.6 Multi-Channel Delivery

| Channel | Status | Notes |
|---------|--------|-------|
| Telegram | Active | Primary channel, per-customer bot |
| SMS (Twilio) | Active | Short-form scripts, 300 char limit |
| Web Chat | Active | Embedded widget via `<script>` tag |
| LINE | Planned | SE Asia priority, next release |
| Email (Brevo) | Ready | Transactional only (welcome, reports) |

### 4.7 Bot Commands

| Command | Function |
|---------|----------|
| `/start` | Initialize bot, trigger interview flow |
| `/today` | Get today's prospect report |
| `/help` | List all commands |
| `/feedback` | Submit feedback about the bot |
| `hunt` | Trigger a new prospect hunt (natural language) |
| `show prospects` | View saved prospects |
| `research [URL]` | Analyze a specific URL or profile |
| `research [name]` | Research a specific person |

### 4.8 Provisioning Flow

#### Auto-Provisioning (Stripe):

```
Customer purchases on Stan Store ($99/mo)
        ↓
Stripe fires checkout.session.completed webhook
        ↓
Gateway enqueues provision job (BullMQ)
        ↓
Provision worker auto-creates bot via MTProto/BotFather session
        ↓
Bot token encrypted (AES-256) + hash stored for webhook routing
        ↓
Tenant record created in database (status: active)
        ↓
Admin notified via Telegram
        ↓
Customer messages @theirbotusername → interview begins
```

#### Invite Flow:

```
Admin creates InviteToken (configurable trialDays)
        ↓
Customer clicks invite link → /invite/:token endpoint
        ↓
System validates token, enqueues provision job with trialDays
        ↓
Bot created, trialEndsAt set (null = permanent access)
        ↓
On trial expiry: status → suspended, customer notified
```

#### Provisioning Fallback:
If auto-provisioning via MTProto fails, a `PENDING_` placeholder record is created and admin is alerted on Telegram with instructions for manual setup.

### 4.9 Trial System

| Field | Description |
|-------|-------------|
| `trialDays` | Number of free days (0 = permanent) |
| `trialEndsAt` | Computed expiry timestamp |
| Auto-suspend | Worker checks on every message, suspends on expiry |
| Notification | Customer receives Telegram message to upgrade |

### 4.10 Admin Operations

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | System health check |
| `/admin/tenants` | GET | List all tenants |
| `/admin/tenants` | POST | Manually provision a tenant |
| `/admin/tenants/:id` | GET | Get tenant details |
| `/admin/tenants/:id` | DELETE | Remove a tenant |
| `/admin/bots` | GET | List all bots with queue metrics |
| `/admin/bots/:id/restart` | POST | Re-queue bot for restart |
| `/admin/invite` | POST | Generate invite token |
| `/channels/status` | GET | Multi-channel health status |
| `/webhooks/stripe` | POST | Stripe event handler |
| `/webhook/:hash` | POST | Per-bot Telegram webhook |
| `/sms/webhook` | POST | Twilio inbound SMS |
| `/chat/web` | POST | Web chat message handler |
| `/widget/:tenantId` | GET | Embeddable widget script |

---

## 5. NON-FUNCTIONAL REQUIREMENTS

### 5.1 Performance

| Metric | Target |
|--------|--------|
| Webhook to queue | < 100ms |
| Queue job processing | < 5 seconds |
| Script generation | < 10 seconds |
| Bot response time | < 3 seconds |
| Daily report delivery | Within 5 minutes of scheduled time |

### 5.2 Reliability

| Metric | Target |
|--------|--------|
| API uptime | 99.5% |
| Message delivery rate | 99% |
| Queue job retry | 3 attempts with exponential backoff |
| Worker concurrency | 10 simultaneous jobs |

### 5.3 Security

- Bot tokens encrypted at rest (AES-256)
- Webhook routing via SHA-256 hash (token never exposed in URL)
- Admin endpoints require `X-API-Key` header
- Stripe webhook signature verified before processing
- No sensitive data in logs
- Per-tenant data isolation enforced at query level
- Trial expiry checked on every inbound message

### 5.4 Scalability

| Scale | Architecture |
|-------|-------------|
| 1–100 customers | Single server, BullMQ + Redis |
| 100–500 customers | Multiple workers, same Redis |
| 500+ customers | Worker pool + Redis Cluster |

Virtual bot pattern means no per-customer processes — Redis queue scales horizontally.

---

## 6. USER STORIES

### Customer Stories

**US-001: Onboarding via Conversation**
> As a new customer, I want to tell the bot about my business naturally, without filling out forms, so I can get started immediately.

**Acceptance Criteria:**
- [ ] Bot asks friendly open-ended questions
- [ ] Bot extracts structured data from natural language
- [ ] Bot never re-asks questions already answered
- [ ] Onboarding completes in 3 minutes or less
- [ ] Bot confirms ICP understanding before starting to hunt

**US-002: Proactive Prospect Delivery**
> As a subscriber, I want the bot to immediately start hunting after onboarding, without me having to configure anything.

**Acceptance Criteria:**
- [ ] Bot starts hunting within seconds of ACTIVE state
- [ ] Bot tells me where it's looking (platforms, communities)
- [ ] First prospects delivered within 5 minutes of activation
- [ ] Prospects scored and sorted by relevance

**US-003: Language-Appropriate Scripts**
> As a Thai-speaking subscriber targeting Thai prospects, I want scripts in Thai that feel natural and culturally appropriate.

**Acceptance Criteria:**
- [ ] System detects prospect language from profile signals
- [ ] Thai scripts use polite register (ครับ/ค่ะ)
- [ ] Scripts reference prospect's specific pain points in Thai
- [ ] English scripts available for English-speaking prospects
- [ ] Mixed Thai-English scripts for bilingual prospects

**US-004: Script Generation On Demand**
> As a subscriber, I want to generate a personalized script for any prospect with one tap.

**Acceptance Criteria:**
- [ ] Script button appears next to each prospect in report
- [ ] Script generated in < 10 seconds
- [ ] Script references specific prospect data (not generic)
- [ ] Script includes 2+ objection responses
- [ ] Script can be copied or sent directly from Telegram

**US-005: Feedback Loop**
> As a subscriber, I want to track which scripts worked so the system improves for me over time.

**Acceptance Criteria:**
- [ ] Outcome buttons appear after marking script as Sent
- [ ] 3 outcomes: No Response, Got Reply, Converted
- [ ] Converted scripts feed back into the Hive
- [ ] Future scripts in same language improve from past successes

**US-006: Multi-Channel Access**
> As a subscriber, I want to interact with my bot via SMS or a website widget when Telegram is inconvenient.

**Acceptance Criteria:**
- [ ] SMS responses are concise (< 300 chars)
- [ ] Web chat widget embeds with one `<script>` tag
- [ ] Same AI context used across all channels

### Admin Stories

**US-010: Invite-Based Trial**
> As an admin, I want to give select people free trial access without requiring a Stripe subscription.

**Acceptance Criteria:**
- [ ] Admin creates invite token with configurable trial days
- [ ] Customer claims invite via link, bot auto-provisioned
- [ ] Trial expiry auto-suspends and notifies customer
- [ ] Permanent access available (trialDays = 0)

**US-011: Auto-Provisioning Visibility**
> As an admin, I want to be notified on Telegram when a new bot is created or when provisioning fails.

**Acceptance Criteria:**
- [ ] Success notification includes email, name, bot username
- [ ] Failure notification includes error and manual fallback instructions
- [ ] Queue metrics visible via /admin/bots endpoint

---

## 7. OUT OF SCOPE (v4.0)

- Full admin dashboard UI (API-only for v4; dashboard in v4.5)
- LINE channel integration (planned for v4.1)
- WhatsApp channel
- Team/downline hierarchy tracking
- CRM integrations (HubSpot, Salesforce)
- Mobile app
- Automated prospect outreach (bot sends messages on behalf of customer)

---

## 8. SUCCESS METRICS

### Business Metrics

| Metric | Target (90 days) |
|--------|-----------------|
| Paying customers | 50 |
| MRR | $4,950 |
| Churn rate | < 10% |
| Customer satisfaction | > 4.5/5 |

### Product Metrics

| Metric | Target |
|--------|--------|
| Onboarding completion rate | > 85% |
| Time to first prospect | < 10 minutes after ACTIVE |
| Daily report engagement | > 70% |
| Scripts generated per customer/week | > 20 |
| Feedback submission rate | > 35% |
| Thai script usage (SE Asia customers) | > 60% |

### Script Engine Metrics

| Metric | Target |
|--------|--------|
| Language detection accuracy | > 90% |
| Script generation success rate | > 99% |
| Thai script quality rating | > 4/5 |
| Hive pattern contribution rate | > 10% of converted scripts |

---

## 9. RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| MTProto session expires | High | Session refresh logic, admin fallback alert |
| Serper quota exhaustion | Medium | 3-key rotation, Reddit as fallback |
| Gemini API rate limit | Medium | Exponential backoff, OpenAI fallback |
| Thai Unicode rendering | Medium | Test across Telegram versions and SMS |
| Reddit API changes | Low | Fallback to Google search |
| Bot token leak | High | AES-256 encryption, hash-based routing |
| Trial abuse | Low | Single-use invite tokens, email deduplication |

---

## 10. GLOSSARY

| Term | Definition |
|------|------------|
| Tenant | A paying customer with their own dedicated bot |
| Virtual Bot | Bot instance created on-demand from cache, not a persistent process |
| ICP | Ideal Customer Profile — the type of person a customer wants to recruit |
| Hive | Shared database of successful script patterns across all tenants |
| Agent Brain | The proactive hunting logic that runs when a bot enters ACTIVE state |
| Enrichment | The pipeline that scrapes, chunks, and summarizes prospect data |
| Fleet Worker | BullMQ worker that processes inbound Telegram updates |
| botTokenHash | SHA-256 hash of bot token used for webhook URL routing |
| trialEndsAt | Timestamp when free trial expires (null = permanent access) |
| Script Engine | The v4 component that generates multi-language personalized scripts |

---

## 11. RELATED DOCUMENTS

- `specs/v4/BLUEPRINT_v4.md` — Technical architecture and implementation guide
- `src/shared/types.ts` — TypeScript type definitions (source of truth)
- `src/fleet/conversation-engine.ts` — Interview state machine
- `src/fleet/agent-brain.ts` — Proactive hunting logic
- `src/fleet/web-search.ts` — Prospect search and scoring
- `src/channels/channel-router.ts` — Multi-channel routing
