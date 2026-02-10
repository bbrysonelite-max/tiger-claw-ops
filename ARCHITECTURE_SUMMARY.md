# Tiger Bot Scout - Architecture Summary for Review

## What Is Tiger Bot Scout?
A SaaS product for network marketing (Nu Skin) distributors that:
- Delivers daily AI-scored prospects via Telegram at 7 AM
- Generates personalized approach scripts using AI
- Handles objections and tracks conversion pipeline
- Price: $99/month per customer
- Current customers: 7 paying (Nancy Lim, Chana, Phaitoon, Tarida, Lily, Theera, John & Noon)

---

## THE ARCHITECTURE QUESTION

### Option A: Multi-Tenant Shared Bot (Current Code)
**How it works:**
- ONE Telegram bot: @TigerBotScout_bot
- ALL customers message the same bot
- System identifies customer by their Telegram chat_id
- Single bot token in .env file
- Customer isolation via database tenant_id

**Pros:**
- Simpler deployment (1 bot, 1 process)
- Easier maintenance
- Single point of configuration
- Scales easily (just add rows to database)
- Standard SaaS pattern

**Cons:**
- If bot goes down, ALL customers affected
- Less personalized feel
- Single point of failure

---

### Option B: Per-Customer Dedicated Bots (New Specs)
**How it works:**
- EACH customer gets their own bot:
  - Nancy → @TigerBot_Nancy_bot
  - Chana → @TigerBot_Chana_bot
  - etc.
- Separate bot token per customer
- Separate process per customer (PM2 managed)
- Complete isolation

**Pros:**
- Complete customer isolation
- One bot failing doesn't affect others
- More "premium" personalized feel
- Easier debugging per customer

**Cons:**
- Must create bot via BotFather for each customer
- Managing N bots vs 1 bot
- N processes vs 1 process
- More complex deployment
- Doesn't scale as elegantly (manual bot creation)

---

## EXISTING CODEBASE SUMMARY

**Location:** /a0/usr/projects/tiger_bots/
**Total lines:** ~17,000
**Architecture:** Multi-tenant shared bot (Option A)

### Key Files:

**api/server.ts** (~500 lines)
- Express.js REST API
- Endpoints: /health, /admin/provision, /admin/tenants
- Stripe webhook integration
- PostgreSQL database connection

**api/telegram-bot.ts** (~510 lines)
- Single TELEGRAM_BOT_TOKEN from env
- Handles incoming messages
- Routes by chat_id to correct tenant
- Commands: /start, /help, /today, /feedback

**api/provisioning.ts** (~293 lines)
- Creates tenant records in database
- Links Stripe subscription to tenant
- Multi-tenant logic throughout

**website/dashboard.html** (~10,000 lines)
- Admin dashboard UI
- View all customers, prospects, scripts
- Analytics and reporting

**tests/** (~1,400 lines)
- 90 tests total
- 12 passing (utility functions)
- 78 failing (require running API server)

---

## NEW SPEC DOCUMENTS

**Location:** /a0/usr/projects/tiger_bots/specs/
**Total lines:** ~2,041
**Architecture:** Per-customer dedicated bots (Option B)

### PRD.md (320 lines)
- Product vision and goals
- User stories
- Success metrics
- Requirements list

### BLUEPRINT.md (537 lines)
- Technical architecture
- Database schema (6 tables)
- API endpoints (12 routes)
- Per-customer bot spawning logic

### FEATURES.md (415 lines)
- 10 features prioritized P0-P2
- Acceptance criteria for each
- Dependencies mapped

### TYPES.ts (769 lines)
- Complete TypeScript definitions
- All interfaces, enums, types
- API request/response shapes

---

## QUESTIONS FOR REVIEW

1. **Which architecture is better for a $99/month B2B SaaS?**
   - Multi-tenant shared bot (simpler, standard)
   - Per-customer dedicated bots (isolated, complex)

2. **Does "per-customer bot" provide meaningful value?**
   - Do customers care if their bot is @TigerBot_Nancy_bot vs @TigerBotScout_bot?
   - Is the operational complexity worth it?

3. **Scalability consideration:**
   - At 7 customers: either works
   - At 100 customers: managing 100 bots is harder
   - At 1000 customers: multi-tenant clearly wins

4. **What do successful Telegram SaaS products do?**
   - Most use multi-tenant shared bot pattern
   - Per-customer bots are rare and typically for enterprise white-label

---

## EXISTING V1 DOCUMENTATION

**docs/V1_BLUEPRINT.md** (868 lines)
- Original comprehensive spec
- References per-customer bots
- But implementation went multi-tenant

**docs/PROVISIONING_EXTREME_DETAIL.md** (649 lines)
- Detailed provisioning flow
- Stripe → Webhook → Tenant creation
- Shows per-customer bot intention

**docs/PROVISIONING_FLOWCHART.md** (255 lines)
- Visual flow of customer onboarding
- Notes "Per-Customer Bots" as MISSING

---

## RECOMMENDATION FOR REVIEW

Present both options objectively to Gemini, ChatGPT, Claude and ask:

"For a $99/month Telegram-based SaaS serving network marketing distributors, 
which architecture would you recommend and why?

Option A: Multi-tenant shared bot (1 bot, customer isolation via chat_id)
Option B: Per-customer dedicated bots (separate bot per customer)

Consider: maintenance burden, scalability, customer experience, failure isolation."
