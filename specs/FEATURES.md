# Tiger Claw Scout — Feature Specifications

**Version:** 2.0.0
**Date:** 2026-02-10

---

## Feature Index

| ID | Feature | Priority | Status |
|----|---------|----------|--------|
| F001 | Per-Customer Bot Provisioning | P0 | Required |
| F002 | Daily Prospect Report | P0 | Required |
| F003 | Script Generation | P0 | Required |
| F004 | Bot Commands | P0 | Required |
| F005 | Feedback Collection | P1 | Required |
| F006 | Hive Learning | P1 | Required |
| F007 | Stripe Integration | P0 | Required |
| F008 | Admin API | P1 | Required |
| F009 | Bot Fleet Management | P1 | Required |
| F010 | Pipeline Tracking | P2 | Optional v1 |

---

## F001: Per-Customer Bot Provisioning

### Description
Each paying customer receives their own dedicated Telegram bot with unique token and username.

### Requirements

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| F001-R01 | Each customer gets unique bot token | P0 |
| F001-R02 | Each customer gets unique bot username | P0 |
| F001-R03 | Bot runs as separate Node.js process | P0 |
| F001-R04 | Bot token encrypted in database | P0 |
| F001-R05 | Bot can be started/stopped independently | P0 |
| F001-R06 | Bot failure does not affect other bots | P0 |

### User Stories

**US-F001-01**: As a new customer, I receive my own personal Telegram bot within 24 hours of purchase.

**US-F001-02**: As a customer, my bot is always available and my data is isolated from other customers.

### Technical Notes

- Bots created manually via BotFather (for v1)
- Bot token stored encrypted (AES-256)
- PM2 manages bot processes
- Process naming: bot-{customername}

### Acceptance Criteria

- [ ] Customer has dedicated bot username
- [ ] Bot token is unique per customer
- [ ] Bot runs in isolated process
- [ ] Restarting one bot does not affect others
- [ ] Token is encrypted at rest

---

## F002: Daily Prospect Report

### Description
Every morning at 7 AM local time, customers receive a Telegram message with their top 5 qualified prospects.

### Requirements

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| F002-R01 | Report delivered at 7 AM customer timezone | P0 |
| F002-R02 | Report contains top 5 prospects (score >= 70) | P0 |
| F002-R03 | Each prospect shows name, source, score, signal | P0 |
| F002-R04 | Each prospect has brief approach suggestion | P0 |
| F002-R05 | Button to get full script for each prospect | P1 |
| F002-R06 | Report logged to daily_reports table | P1 |

### User Stories

**US-F002-01**: As a subscriber, I wake up to 5 qualified prospects in my Telegram every morning.

**US-F002-02**: As a subscriber, I can quickly scan prospect quality without reading full details.

### Report Format

Tiger Claw Daily Report
[Date]

Found 5 qualified prospects today:

1. [Name] (Score: XX/100) [fire emoji if >= 85]
   Source: [where found]
   Signal: [what they said]
   Approach: [brief 1-line suggestion]
   [Get Full Script button]

[... 4 more prospects ...]

Pipeline: X total | Y contacted
This week: Z converted

### Acceptance Criteria

- [ ] Report delivered within 5 min of 7 AM
- [ ] Contains exactly 5 prospects (or fewer if not enough)
- [ ] All prospects have score >= 70
- [ ] Each prospect has clickable script button
- [ ] Delivery logged to database

---

## F003: Script Generation

### Description
AI-powered personalized approach scripts generated for each prospect.

### Requirements

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| F003-R01 | Script personalized to prospect profile | P0 |
| F003-R02 | Script in appropriate language (Thai/English) | P0 |
| F003-R03 | Script includes opening, value prop, CTA | P0 |
| F003-R04 | Script includes objection responses | P1 |
| F003-R05 | Script generation under 5 seconds | P1 |
| F003-R06 | Scripts can use successful Hive patterns | P2 |

### User Stories

**US-F003-01**: As a subscriber, I get personalized scripts that feel genuine, not generic.

**US-F003-02**: As a Thai-speaking subscriber, I receive scripts in Thai.

### Script Components

1. **Opening**: Personalized hook referencing prospect context
2. **Value Prop**: Benefit statement relevant to prospect signals
3. **CTA**: Soft ask appropriate to relationship stage
4. **Objections**: Pre-written responses to common objections

### Script Format (Telegram)

Script for [Prospect Name]

Opening:
[Personalized message]

If they seem interested:
[Value proposition]

Ask them:
[Call to action]

If they say "too expensive":
[Response]

If they say "no time":
[Response]

[Copy Script button]
[Mark as Sent button]

### Acceptance Criteria

- [ ] Script references prospect-specific details
- [ ] Language matches prospect profile
- [ ] Includes at least 2 objection responses
- [ ] Generated in under 5 seconds
- [ ] Can be copied to clipboard

---

## F004: Bot Commands

### Description
Telegram bot responds to standard commands for interaction.

### Commands

| Command | Description | Priority |
|---------|-------------|----------|
| /start | Initialize bot, save chat_id | P0 |
| /report | Get todays prospect report | P0 |
| /script [name] | Get full script for prospect | P0 |
| /pipeline | View prospect pipeline by status | P1 |
| /settings | Configure preferences | P2 |
| /help | List all commands | P0 |

### Command Details

#### /start
- Saves customer chat_id to bots table
- Sends welcome message with instructions
- Required before any other commands work

#### /report
- Triggers immediate report generation
- Same format as daily scheduled report
- Useful if customer missed morning report

#### /script [name]
- Generates full script for named prospect
- Name can be partial match
- Returns full script with objection handling

#### /pipeline
- Shows all prospects grouped by status
- Status: new, contacted, replied, converted
- Shows count per status

#### /help
- Lists all available commands
- Brief description of each

### Acceptance Criteria

- [ ] All commands respond within 2 seconds
- [ ] /start saves chat_id correctly
- [ ] /report generates fresh report
- [ ] /script finds prospect by partial name
- [ ] /help lists all commands

---

## F005: Feedback Collection

### Description
After scripts are used, collect outcome feedback to improve future scripts.

### Requirements

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| F005-R01 | Prompt for feedback after script sent | P1 |
| F005-R02 | Three outcome options: no response, replied, converted | P1 |
| F005-R03 | Store feedback in scripts table | P1 |
| F005-R04 | Update prospect status based on feedback | P1 |

### Feedback Flow

1. Customer receives script
2. Customer clicks "Mark as Sent"
3. After 24 hours, bot asks: "Did this script work?"
4. Customer clicks: [No Response] [Got Reply] [Converted]
5. System stores outcome and updates prospect status

### Acceptance Criteria

- [ ] Feedback prompt sent 24h after "Mark as Sent"
- [ ] All three outcome buttons work
- [ ] Outcome stored in scripts table
- [ ] Prospect status updated accordingly

---

## F006: Hive Learning

### Description
Successful script patterns shared across all customers to improve results.

### Requirements

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| F006-R01 | Extract patterns from converted scripts | P1 |
| F006-R02 | Store patterns with context | P1 |
| F006-R03 | Track pattern success rate | P2 |
| F006-R04 | Use successful patterns in new scripts | P2 |

### Pattern Types

- Opening hooks that got replies
- Value propositions that converted
- Objection responses that worked
- CTAs that drove action

### Acceptance Criteria

- [ ] Patterns extracted from converted scripts
- [ ] Patterns stored with context metadata
- [ ] Success rate calculated and tracked
- [ ] New scripts can incorporate hive patterns

---

## F007: Stripe Integration

### Description
Automatic customer provisioning when payment received via Stripe.

### Requirements

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| F007-R01 | Receive Stripe webhooks | P0 |
| F007-R02 | Verify webhook signature | P0 |
| F007-R03 | Create tenant on subscription.created | P0 |
| F007-R04 | Update status on subscription.updated | P1 |
| F007-R05 | Handle subscription.deleted (churn) | P1 |

### Webhook Events

| Event | Action |
|-------|--------|
| customer.subscription.created | Create tenant (status: pending_bot) |
| customer.subscription.updated | Update subscription_status |
| customer.subscription.deleted | Set tenant status to churned, stop bot |
| invoice.payment_failed | Set subscription_status to past_due |

### Acceptance Criteria

- [ ] Webhook endpoint receives events
- [ ] Signature verified before processing
- [ ] Tenant created on new subscription
- [ ] Tenant status updated on changes
- [ ] Bot stopped on subscription cancellation

---

## F008: Admin API

### Description
API endpoints for system administration and monitoring.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /admin/tenants | List all tenants |
| POST | /admin/tenants | Create tenant manually |
| GET | /admin/tenants/:id | Get tenant details |
| DELETE | /admin/tenants/:id | Delete tenant |
| GET | /admin/bots | List all bots |
| POST | /admin/bots/:id/start | Start bot |
| POST | /admin/bots/:id/stop | Stop bot |
| POST | /admin/bots/:id/restart | Restart bot |

### Security

- All /admin/* endpoints require API key header
- Header: X-API-Key: {ADMIN_API_KEY}

### Acceptance Criteria

- [ ] All endpoints respond correctly
- [ ] Unauthorized requests rejected
- [ ] Tenant CRUD operations work
- [ ] Bot start/stop/restart works

---

## F009: Bot Fleet Management

### Description
Manage multiple customer bots as a coordinated fleet.

### Requirements

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| F009-R01 | Start all bots on server startup | P0 |
| F009-R02 | Health check all bots periodically | P1 |
| F009-R03 | Auto-restart crashed bots | P1 |
| F009-R04 | Log bot status changes | P1 |

### Fleet Operations

- Start fleet: Start all active tenant bots
- Stop fleet: Gracefully stop all bots
- Health check: Verify all bots responding
- Status report: List all bots with status

### Acceptance Criteria

- [ ] All active bots start on server boot
- [ ] Health check runs every 5 minutes
- [ ] Crashed bots auto-restart within 1 minute
- [ ] Bot status changes logged

---

## F010: Pipeline Tracking

### Description
Track prospects through the sales pipeline.

### Pipeline Stages

| Stage | Description |
|-------|-------------|
| new | Prospect identified, not yet delivered |
| delivered | Included in daily report |
| contacted | Customer sent message |
| replied | Prospect responded |
| converted | Prospect converted to customer/recruit |
| archived | No longer active |

### Requirements

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| F010-R01 | Track prospect through stages | P2 |
| F010-R02 | Timestamp each stage transition | P2 |
| F010-R03 | View pipeline via /pipeline command | P2 |
| F010-R04 | Calculate conversion metrics | P2 |

### Acceptance Criteria

- [ ] Prospect status updated correctly
- [ ] Timestamps recorded for transitions
- [ ] /pipeline shows grouped counts
- [ ] Conversion rate calculable
