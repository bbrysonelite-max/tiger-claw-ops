# Tiger Claw Scout — Provisioning System

## CURRENT STATE vs WHAT'S NEEDED

### What EXISTS Now ✅
| Component | Status | Notes |
|-----------|--------|-------|
| VPS Server | Running | 208.113.131.83, PM2 with 2 instances |
| API Server | Running | Port 4000, Express + PostgreSQL |
| Dashboard | Live | botcraftwrks.ai/dashboard.html |
| Database | Running | leads, script_feedback, hive_learnings tables |
| Telegram Bot | Running | @TigerClawScout_bot (single shared bot) |
| Provisioning Code | Written | provisioning.ts exists but NOT wired up |
| Stripe Webhook Handler | Written | In provisioning.ts but NOT connected |
| 7 Customers | Listed | In dashboard, "Pending Setup" |

### What's MISSING ❌
| Component | Status | Blocking Issue |
|-----------|--------|----------------|
| Stripe Webhook URL | NOT CONFIGURED | Need to add webhook in Stripe dashboard |
| Tenants Table | NOT CREATED | Schema exists in provisioning.ts, not run |
| Per-Customer Bots | NOT DEPLOYED | Each customer needs their own bot token |
| Stan Store → Stripe Link | NOT VERIFIED | Need to confirm checkout triggers Stripe |
| Provisioning Router | NOT MOUNTED | Code exists but not added to server.ts |

---

## PROVISIONING FLOWCHART

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CUSTOMER PURCHASE FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   CUSTOMER   │
    │ sees ad/post │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  Stan Store  │  ◄── botcraftwrks.ai links here
    │   Checkout   │
    │   ($99/mo)   │
    └──────┬───────┘
           │
           │ Payment processed
           ▼
    ┌──────────────┐
    │    STRIPE    │  ◄── Stan Store uses Stripe for payments
    │  Subscription│
    │   Created    │
    └──────┬───────┘
           │
           │ Webhook: customer.subscription.created
           ▼
    ┌──────────────────────────────────────┐
    │  TIGER BOT API                       │
    │  POST /webhooks/stripe               │
    │                                      │
    │  1. Parse Stripe event               │
    │  2. Extract: email, customer_id      │
    │  3. Call provisionCustomer()         │
    └──────┬───────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────────┐
    │  provisionCustomer()                 │
    │                                      │
    │  1. Generate tenant UUID             │
    │  2. Generate API key (tb_xxx...)     │
    │  3. INSERT into tenants table        │
    │  4. CREATE Telegram channel record   │
    │  5. Send welcome email (Brevo)       │
    └──────┬───────────────────────────────┘
           │
           │ ❌ MISSING STEP: Create dedicated bot
           ▼
    ┌──────────────────────────────────────┐
    │  MANUAL STEP (currently)             │
    │                                      │
    │  1. Admin creates bot via @BotFather │
    │  2. Admin gets bot token             │
    │  3. Admin adds token to .env         │
    │  4. Admin restarts PM2               │
    └──────┬───────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────────┐
    │  CUSTOMER RECEIVES                   │
    │                                      │
    │  1. Welcome email with bot link      │
    │  2. Opens Telegram                   │
    │  3. Sends /start                     │
    │  4. Gets welcome message             │
    │  5. Bot records their chat_id        │
    │  6. Daily reports begin              │
    └──────────────────────────────────────┘
```

---

## WHAT NEEDS TO BE DONE (In Order)

### Step 1: Wire Up Provisioning Router
Add this to `server.ts`:
```typescript
import { createProvisioningRouter, PROVISIONING_SCHEMA } from './provisioning.js';

// After initDatabase()
await db.query(PROVISIONING_SCHEMA);

// Mount the router
app.use('/provisioning', createProvisioningRouter(db));
```

### Step 2: Configure Stripe Webhook
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://api.botcraftwrks.ai/provisioning/webhooks/stripe`
3. Select events: `customer.subscription.created`, `customer.subscription.deleted`
4. Copy the webhook signing secret
5. Add to server .env: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`

### Step 3: Verify Stan Store → Stripe
1. Make a test purchase on Stan Store
2. Check Stripe dashboard for the subscription
3. Check server logs for webhook receipt

### Step 4: Deploy Updates
```bash
git add . && git commit -m "Wire up provisioning" && git push
ssh ubuntu@208.113.131.83 "cd tiger-bot-api && git pull && pm2 restart all"
```

---

## TRIAL / DEMO BOT STRATEGY

### Option A: Time-Limited Trial (Recommended)
```
┌────────────────────────────────────────────┐
│  TRIAL FLOW                                │
│                                            │
│  1. User clicks "Try Free for 3 Days"      │
│  2. Enters email only (no card)            │
│  3. System creates trial tenant:           │
│     - plan: 'trial'                        │
│     - status: 'trial'                      │
│     - trial_ends_at: NOW() + 3 days        │
│  4. User gets shared demo bot access       │
│  5. Bot shows sample prospects + scripts   │
│  6. After 3 days: "Trial ended" message    │
│  7. CTA: "Subscribe to continue"           │
└────────────────────────────────────────────┘
```

**Implementation:**
- Create `/provisioning/trial` endpoint
- Accept just email
- Create tenant with `status: 'trial'`
- Use shared @TigerClawScout_bot (not per-customer bot)
- Cron job checks `trial_ends_at`, sends "trial ended" message

### Option B: Promo Codes
```
┌────────────────────────────────────────────┐
│  PROMO CODE FLOW                           │
│                                            │
│  1. Create codes: TIGER50, BETAFREE        │
│  2. User enters code at checkout           │
│  3. Stan Store / Stripe applies discount   │
│  4. TIGER50 = 50% off first month          │
│  5. BETAFREE = Free first month            │
└────────────────────────────────────────────┘
```

**Implementation:**
- Create promo codes in Stripe Dashboard
- Stan Store supports Stripe coupons
- No code changes needed

### Option C: Demo Mode (Sandbox)
```
┌────────────────────────────────────────────┐
│  DEMO MODE                                 │
│                                            │
│  1. Public demo bot: @TigerClawDemo_bot     │
│  2. Pre-loaded with 10 sample prospects    │
│  3. Scripts generated from samples         │
│  4. Limited: 3 scripts per day             │
│  5. Watermarked: "DEMO - Subscribe for     │
│     unlimited access"                      │
│  6. After each script: "Like this?         │
│     Get your own bot: [LINK]"              │
└────────────────────────────────────────────┘
```

**Implementation:**
- Create separate demo bot via BotFather
- Seed database with sample Thai prospects
- Rate limit: 3 scripts/day per user
- Add "DEMO" prefix to all messages

---

## RECOMMENDED TRIAL SYSTEM

**Simplest path for you:**

1. **Create Stripe Coupon**: `TRYFREE` = 100% off, 7 days
2. **Give code to prospects**: "Use code TRYFREE for a free week"
3. **After 7 days**: Stripe auto-charges $99
4. **No code changes needed**

This lets people try before they buy with zero development work.

---

## PROVISIONING YOUR 7 EXISTING CUSTOMERS

Since they already paid, you need to manually provision them:

### For Each Customer:
1. Get their Telegram username/chat_id (ask them)
2. Run:
```bash
curl -X POST https://api.botcraftwrks.ai/provisioning/provision \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@email.com",
    "name": "Customer Name",
    "plan": "scout",
    "telegram_chat_id": "12345678"
  }'
```
3. They'll receive welcome message
4. They start using the shared bot

### OR: Quick Manual Setup
1. Ask each customer to message @TigerClawScout_bot with /start
2. Bot logs their chat_id
3. Add their chat_id to the tenants table
4. They're set up

---

## NEXT ACTIONS

1. [ ] Wire up provisioning router in server.ts
2. [ ] Run PROVISIONING_SCHEMA to create tenants table
3. [ ] Deploy to server
4. [ ] Configure Stripe webhook
5. [ ] Create TRYFREE coupon in Stripe
6. [ ] Ask 7 customers to /start the bot to get their chat_ids
7. [ ] Provision each customer manually
