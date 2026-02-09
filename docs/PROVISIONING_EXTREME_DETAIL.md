# Tiger Bot Scout — Extreme Detail Provisioning Guide

---

## 1. STAN STORE SETUP

### Current State
Stan Store URL: https://stan.store/bbrysonelite
Product: Tiger Bot Scout ($99/mo)

### What Needs to Be Fixed

**Product Images Needed:**
| Image | Size | Purpose |
|-------|------|---------|
| Main Product Image | 1080x1080px | Shows in product grid |
| Banner/Hero | 1200x630px | Top of product page |
| Feature Screenshots | 1080x1920px (3-5 images) | Carousel showing the bot in action |
| Logo/Avatar | 400x400px | Tiger Bot Scout icon |

**Image Content Ideas:**
1. **Hero Image**: Phone mockup showing Telegram with Tiger Bot message
2. **Screenshot 1**: Daily report example (5 prospects listed)
3. **Screenshot 2**: Script generation in action
4. **Screenshot 3**: Dashboard overview
5. **Screenshot 4**: Before/After - "Manual prospecting" vs "Tiger Bot finds them for you"

**Copy Updates for Stan Store:**

```
TITLE: Tiger Bot Scout — Your AI Recruiting Partner

SUBTITLE: 5 Fresh Prospects Every Morning. Personalized Scripts. Zero Cold Calling.

DESCRIPTION:
🐯 What You Get:
• Daily prospect report delivered to Telegram at 7 AM
• AI-scored leads (only 70+ quality sent to you)
• Personalized approach scripts for each prospect
• Objection handling on demand
• Pipeline tracking dashboard

🎯 How It Works:
1. Subscribe → Get your personal Tiger Bot
2. Tell us your ideal customer
3. Wake up to qualified prospects in your Telegram
4. Copy the script, send the message, close the deal

💰 ROI:
• Find 5+ qualified prospects daily
• Save 2+ hours of manual searching
• Close 1-2 extra deals per month = $500-2000+ value

Perfect for: Nu Skin distributors, network marketers, direct sales pros

PRICE: $99/month
```

**Task for Birdie:**
"Create 5 product images for Stan Store:
1. Hero image: iPhone mockup with Tiger Bot Telegram chat showing daily report
2. Feature 1: Screenshot of dashboard with 'Today's Prospects: 5'
3. Feature 2: Script generation example
4. Feature 3: Before/after comparison graphic
5. Square logo: Tiger head with chat bubble
Style: Dark theme matching dashboard (slate-900 background, orange accents)"

---

## 2. STRIPE WEBHOOK → API → CREATE TENANT

### The Complete Technical Flow

```
STEP BY STEP:

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Customer Clicks "Buy" on Stan Store                             │
├─────────────────────────────────────────────────────────────────────────┤
│ • Stan Store checkout page loads                                        │
│ • Customer enters email + payment info                                  │
│ • Clicks "Subscribe"                                                    │
│ • Stan Store uses YOUR Stripe account to process payment                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Stripe Creates Subscription                                     │
├─────────────────────────────────────────────────────────────────────────┤
│ Stripe creates these objects:                                           │
│                                                                         │
│ CUSTOMER OBJECT:                                                        │
│ {                                                                       │
│   "id": "cus_ABC123xyz",                                                │
│   "email": "nancy@gmail.com",                                           │
│   "name": "Nancy Lim",                                                  │
│   "created": 1707100800                                                 │
│ }                                                                       │
│                                                                         │
│ SUBSCRIPTION OBJECT:                                                    │
│ {                                                                       │
│   "id": "sub_DEF456abc",                                                │
│   "customer": "cus_ABC123xyz",                                          │
│   "status": "active",                                                   │
│   "items": [{ "price": { "lookup_key": "tiger_bot_scout" }}],           │
│   "current_period_start": 1707100800,                                   │
│   "current_period_end": 1709779200                                      │
│ }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Stripe Sends Webhook to YOUR Server                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ WEBHOOK URL: https://api.botcraftwrks.ai/provisioning/webhooks/stripe   │
│                                                                         │
│ HTTP POST with body:                                                    │
│ {                                                                       │
│   "type": "customer.subscription.created",                              │
│   "data": {                                                             │
│     "object": {                                                         │
│       "id": "sub_DEF456abc",                                            │
│       "customer": "cus_ABC123xyz",                                      │
│       "customer_email": "nancy@gmail.com",                              │
│       "status": "active",                                               │
│       "items": {                                                        │
│         "data": [{                                                      │
│           "price": { "lookup_key": "scout" }                            │
│         }]                                                              │
│       }                                                                 │
│     }                                                                   │
│   }                                                                     │
│ }                                                                       │
│                                                                         │
│ HEADERS:                                                                │
│ Stripe-Signature: t=1707100800,v1=abc123...                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Your API Receives Webhook                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ FILE: api/provisioning.ts                                               │
│ ENDPOINT: POST /provisioning/webhooks/stripe                            │
│                                                                         │
│ CODE THAT RUNS:                                                         │
│ ```                                                                     │
│ router.post('/webhooks/stripe', async (req, res) => {                   │
│   const event = req.body;                                               │
│                                                                         │
│   if (event.type === 'customer.subscription.created') {                 │
│     const subscription = event.data.object;                             │
│     const customerId = subscription.customer;        // cus_ABC123xyz   │
│     const email = subscription.customer_email;       // nancy@gmail.com │
│     const plan = subscription.items.data[0]?.price?.lookup_key; // scout│
│                                                                         │
│     // CREATE THE TENANT                                                │
│     const tenant = await provisionCustomer(db, {                        │
│       stripe_customer_id: customerId,                                   │
│       email,                                                            │
│       plan,                                                             │
│       subscription_id: subscription.id                                  │
│     });                                                                 │
│   }                                                                     │
│   res.json({ received: true });                                         │
│ });                                                                     │
│ ```                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 5: provisionCustomer() Creates Tenant                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ WHAT IT DOES:                                                           │
│                                                                         │
│ 1. Generate unique tenant ID:                                           │
│    const tenantId = crypto.randomUUID();                                │
│    → "a1b2c3d4-e5f6-7890-abcd-ef1234567890"                             │
│                                                                         │
│ 2. Generate API key for this customer:                                  │
│    const apiKey = `tb_${crypto.randomBytes(24).toString('hex')}`;       │
│    → "tb_8f3a2b1c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c"                   │
│                                                                         │
│ 3. INSERT into tenants table:                                           │
│    ```sql                                                               │
│    INSERT INTO tenants (                                                │
│      id,                    -- a1b2c3d4-e5f6-7890-abcd-ef1234567890     │
│      email,                 -- nancy@gmail.com                          │
│      name,                  -- nancy (from email prefix)                │
│      plan,                  -- scout                                    │
│      status,                -- active                                   │
│      stripe_customer_id,    -- cus_ABC123xyz                            │
│      subscription_id,       -- sub_DEF456abc                            │
│      api_key,               -- tb_8f3a2b1c9d4e5f6a...                   │
│      telegram_chat_id,      -- NULL (filled later when they /start)    │
│      created_at,            -- 2026-02-05 10:30:00                      │
│      updated_at             -- 2026-02-05 10:30:00                      │
│    )                                                                    │
│    ```                                                                  │
│                                                                         │
│ 4. CREATE channel record:                                               │
│    ```sql                                                               │
│    INSERT INTO channels (                                               │
│      tenant_id,  -- a1b2c3d4-e5f6-7890-abcd-ef1234567890               │
│      type,       -- telegram                                            │
│      name,       -- Tiger Bot Scout                                     │
│      status      -- active                                              │
│    )                                                                    │
│    ```                                                                  │
│                                                                         │
│ 5. SEND welcome email (if Brevo configured):                            │
│    To: nancy@gmail.com                                                  │
│    Subject: 🐯 Welcome to Tiger Bot Scout!                              │
│    Body: Your bot is ready. Click here to start: t.me/TigerBotScout_bot │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 6: Tenant NOW EXISTS in Database                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ DATABASE: PostgreSQL on your VPS                                        │
│ TABLE: tenants                                                          │
│                                                                         │
│ ┌────────────────────────────────────────────────────────────────────┐  │
│ │ id          │ a1b2c3d4-e5f6-7890-abcd-ef1234567890                 │  │
│ │ email       │ nancy@gmail.com                                      │  │
│ │ name        │ Nancy Lim                                            │  │
│ │ plan        │ scout                                                │  │
│ │ status      │ active                                               │  │
│ │ stripe_id   │ cus_ABC123xyz                                        │  │
│ │ sub_id      │ sub_DEF456abc                                        │  │
│ │ api_key     │ tb_8f3a2b1c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c      │  │
│ │ chat_id     │ NULL (waiting for /start)                            │  │
│ │ created_at  │ 2026-02-05 10:30:00                                  │  │
│ └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### WHERE DOES IT SHOW ON THE DASHBOARD?

**Currently:** The dashboard has hardcoded 7 customers.

**What needs to change:** Dashboard should fetch from `/provisioning/tenants` API.

```
DASHBOARD FLOW:

┌─────────────────────────────────────────────────────────────────────────┐
│ Dashboard loads → Fetches /provisioning/tenants                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ API ENDPOINT: GET /provisioning/tenants                                 │
│                                                                         │
│ RETURNS:                                                                │
│ {                                                                       │
│   "tenants": [                                                          │
│     {                                                                   │
│       "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",                     │
│       "email": "nancy@gmail.com",                                       │
│       "name": "Nancy Lim",                                              │
│       "plan": "scout",                                                  │
│       "status": "active",                    // or "trial", "cancelled" │
│       "telegram_chat_id": "123456789",       // or NULL if not started │
│       "prospect_count": 15,                  // how many prospects found│
│       "created_at": "2026-02-05T10:30:00Z"                              │
│     },                                                                  │
│     { ... more tenants ... }                                            │
│   ]                                                                     │
│ }                                                                       │
│                                                                         │
│ DASHBOARD SHOWS:                                                        │
│ ┌──────────────────────────────────────────────────────────────────┐    │
│ │ 👩 Nancy Lim                                                     │    │
│ │ nancy@gmail.com                                                  │    │
│ │ Plan: Scout $99/mo                                               │    │
│ │ Status: ✅ Active (or ⏳ Pending Setup if chat_id is NULL)       │    │
│ │ Prospects Found: 15                                              │    │
│ │ [Deploy Bot] [Email] [View]                                      │    │
│ └──────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### GIVEAWAY CUSTOMERS (Free/Comped)

For customers you give free access to:

```bash
# Manual provision via API (no Stripe)
curl -X POST https://api.botcraftwrks.ai/provisioning/provision \
  -H "Content-Type: application/json" \
  -d '{
    "email": "friend@gmail.com",
    "name": "Free Friend",
    "plan": "scout_free"
  }'
```

They show up on dashboard the same way, but with `plan: "scout_free"` so you know they're comped.

---

## 3. CUSTOMER OPENS TELEGRAM — EXACTLY WHAT THEY SEE

### Step-by-Step Customer Experience

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Customer Gets Welcome Email                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ FROM: pebo@botcraftwrks.ai                                              │
│ TO: nancy@gmail.com                                                     │
│ SUBJECT: 🐯 Welcome to Tiger Bot Scout!                                 │
│                                                                         │
│ ─────────────────────────────────────────────                           │
│                                                                         │
│ Hi Nancy!                                                               │
│                                                                         │
│ Your Tiger Bot Scout is ready! 🎉                                       │
│                                                                         │
│ Click here to activate your bot:                                        │
│ 👉 https://t.me/TigerBotScout_bot                                       │
│                                                                         │
│ Once you open Telegram and tap START, I'll begin finding                │
│ qualified prospects for you every day.                                  │
│                                                                         │
│ Questions? Reply to this email or message @gentlejoker on Telegram.     │
│                                                                         │
│ — Pebo & the Tiger Bot Team                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Customer Clicks Link → Opens Telegram                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────────────────────────────────────────┐                         │
│ │         TELEGRAM APP                        │                         │
│ │                                             │                         │
│ │  ┌───────────────────────────────────────┐  │                         │
│ │  │  🐯 Tiger Bot Scout                   │  │                         │
│ │  │  @TigerBotScout_bot                   │  │                         │
│ │  │                                       │  │                         │
│ │  │  bot • AI Recruiting Partner          │  │                         │
│ │  │                                       │  │                         │
│ │  │  ┌─────────────────────────────────┐  │  │                         │
│ │  │  │          [ START ]              │  │  │                         │
│ │  │  └─────────────────────────────────┘  │  │                         │
│ │  └───────────────────────────────────────┘  │                         │
│ │                                             │                         │
│ └─────────────────────────────────────────────┘                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Customer Taps START → Gets Welcome Message                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ WHAT HAPPENS IN THE CODE:                                               │
│                                                                         │
│ 1. Telegram sends to your bot:                                          │
│    {                                                                    │
│      "message": {                                                       │
│        "chat": { "id": 123456789 },    ← THIS IS THEIR CHAT ID         │
│        "from": { "first_name": "Nancy" },                               │
│        "text": "/start"                                                 │
│      }                                                                  │
│    }                                                                    │
│                                                                         │
│ 2. Your bot code (telegram-bot.ts) handles /start:                      │
│    ```                                                                  │
│    bot.onText(/\/start/, (msg) => {                                     │
│      const chatId = msg.chat.id;  // 123456789                          │
│      // TODO: Look up tenant by email, save chat_id                     │
│      bot.sendMessage(chatId, welcomeMessage);                           │
│    });                                                                  │
│    ```                                                                  │
│                                                                         │
│ 3. Bot sends welcome message:                                           │
│                                                                         │
│ ┌─────────────────────────────────────────────┐                         │
│ │  🐯 Tiger Bot Scout                         │                         │
│ │  ─────────────────────────────────────────  │                         │
│ │                                             │                         │
│ │  🐯 *Welcome to Tiger Bot Scout!*           │                         │
│ │                                             │                         │
│ │  Your AI recruiting partner is now active.  │                         │
│ │                                             │                         │
│ │  *Your Plan:* SCOUT                         │                         │
│ │                                             │                         │
│ │  *Commands:*                                │                         │
│ │  /report — Get your daily prospect report   │                         │
│ │  /pipeline — View your pipeline             │                         │
│ │  /script <name> — Get approach script       │                         │
│ │  /objection <text> — Handle objections      │                         │
│ │  /help — All commands                       │                         │
│ │                                             │                         │
│ │  I'll deliver fresh prospects to you        │                         │
│ │  every morning at 7 AM.                     │                         │
│ │                                             │                         │
│ │  Let's fill your pipeline! 🚀               │                         │
│ │                                             │                         │
│ └─────────────────────────────────────────────┘                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Every Morning at 7 AM — Daily Report                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ WHAT HAPPENS:                                                           │
│ - Cron job runs at 7 AM Bangkok time                                    │
│ - Queries database for prospects found in last 24 hours                 │
│ - Filters to score 70+ only                                             │
│ - Generates approach script for each                                    │
│ - Sends to customer's Telegram                                          │
│                                                                         │
│ CUSTOMER SEES:                                                          │
│                                                                         │
│ ┌─────────────────────────────────────────────┐                         │
│ │  🐯 Tiger Bot Scout                         │                         │
│ │  ─────────────────────────────────────────  │                         │
│ │                                             │                         │
│ │  🐯 *Tiger Bot Daily Report*                │                         │
│ │  February 5, 2026                           │                         │
│ │                                             │                         │
│ │  Found *5 qualified prospects* today:       │                         │
│ │                                             │                         │
│ │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━       │                         │
│ │                                             │                         │
│ │  *1. Somchai K.* (Score: 85/100) 🔥         │                         │
│ │  📍 LINE OpenChat: "Side Hustle Thailand"   │                         │
│ │  💬 Signal: "ต้องการรายได้เสริม             │                         │
│ │     เบื่องานประจำแล้ว"                      │                         │
│ │  ✨ Suggested approach:                     │                         │
│ │  "สวัสดีครับคุณสมชาย เห็นโพสต์ใน           │                         │
│ │  กลุ่มว่าสนใจหารายได้เสริม ผมมี            │                         │
│ │  ธุรกิจ wellness ที่น่าสนใจ..."            │                         │
│ │                                             │                         │
│ │  [📝 Get Full Script]                       │                         │
│ │                                             │                         │
│ │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━       │                         │
│ │                                             │                         │
│ │  *2. Nattaya P.* (Score: 78/100)            │                         │
│ │  📍 Facebook: "Bangkok Entrepreneurs"       │                         │
│ │  💬 Signal: "Anyone doing health business?" │                         │
│ │  ✨ Suggested approach:                     │                         │
│ │  "Hi Nattaya! Saw your post about health    │                         │
│ │  business. I've been in wellness for 3      │                         │
│ │  years and might have what you're..."       │                         │
│ │                                             │                         │
│ │  [📝 Get Full Script]                       │                         │
│ │                                             │                         │
│ │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━       │                         │
│ │                                             │
│ │  ... (3 more prospects) ...                 │                         │
│ │                                             │                         │
│ │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━       │                         │
│ │                                             │                         │
│ │  📊 Your Pipeline: 23 total | 8 contacted   │                         │
│ │  🎯 This week: 2 converted                  │                         │
│ │                                             │                         │
│ │  Type /help for all commands                │                         │
│ │                                             │                         │
│ └─────────────────────────────────────────────┘                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Customer Types /script Somchai → Gets Full Script               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ CUSTOMER TYPES:                                                         │
│ /script Somchai                                                         │
│                                                                         │
│ BOT RESPONDS:                                                           │
│                                                                         │
│ ┌─────────────────────────────────────────────┐                         │
│ │  🐯 Tiger Bot Scout                         │                         │
│ │  ─────────────────────────────────────────  │                         │
│ │                                             │                         │
│ │  📝 *Approach Script for Somchai K.*        │                         │
│ │  Score: 85/100 | Source: LINE OpenChat      │                         │
│ │                                             │                         │
│ │  ━━━ OPENING MESSAGE ━━━                    │                         │
│ │                                             │                         │
│ │  สวัสดีครับคุณสมชาย 🙏                      │                         │
│ │                                             │                         │
│ │  เห็นโพสต์ในกลุ่ม Side Hustle Thailand      │                         │
│ │  ว่าสนใจหารายได้เสริม ผมเข้าใจเลยครับ      │                         │
│ │  งานประจำมันเหนื่อยและไม่พอใช้              │                         │
│ │                                             │                         │
│ │  ผมทำธุรกิจ wellness products อยู่          │                         │
│ │  รายได้ดี ทำควบคู่งานประจำได้               │                         │
│ │  สนใจฟังข้อมูลไหมครับ?                      │                         │
│ │                                             │                         │
│ │  ━━━ IF THEY RESPOND POSITIVELY ━━━         │                         │
│ │                                             │                         │
│ │  ดีใจที่สนใจครับ! เรื่องหลักๆ คือ...       │                         │
│ │  [Continue conversation script]             │                         │
│ │                                             │                         │
│ │  ━━━ LIKELY OBJECTIONS ━━━                  │                         │
│ │                                             │                         │
│ │  ❓ "ไม่มีเวลา"                             │                         │
│ │  → "เข้าใจครับ ผมก็ทำงานประจำเหมือนกัน     │                         │
│ │     เริ่มแค่วันละ 30 นาทีก็พอครับ..."      │                         │
│ │                                             │                         │
│ │  ❓ "ขายของไม่เป็น"                         │                         │
│ │  → "ไม่ต้องขายแบบเดิมครับ เรามีระบบ        │                         │
│ │     ช่วย ผมสอนให้ทุกขั้นตอน..."            │                         │
│ │                                             │                         │
│ │  ─────────────────────────────────────────  │                         │
│ │                                             │                         │
│ │  Did this script work?                      │                         │
│ │  [👎 No Response] [👍 Got Reply] [🎯 Converted] │                     │
│ │                                             │                         │
│ └─────────────────────────────────────────────┘                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 6: Customer Clicks Feedback Button                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ WHAT HAPPENS:                                                           │
│                                                                         │
│ 1. Customer clicks [🎯 Converted]                                       │
│                                                                         │
│ 2. Bot receives callback_query with data: "feedback:converted:abc123"   │
│                                                                         │
│ 3. Code updates database:                                               │
│    UPDATE script_feedback SET feedback = 'converted' WHERE id = 'abc123'│
│                                                                         │
│ 4. If converted or got_reply, adds to hive_learnings:                   │
│    INSERT INTO hive_learnings (content, success_count, ...)             │
│                                                                         │
│ 5. Bot responds:                                                        │
│                                                                         │
│ ┌─────────────────────────────────────────────┐                         │
│ │  🎯 Feedback recorded!                      │                         │
│ │                                             │                         │
│ │  Amazing! 🎉 Another conversion!            │                         │
│ │  This script has been added to the Hive     │                         │
│ │  so other Tiger Bot users can learn from    │                         │
│ │  your success.                              │                         │
│ │                                             │                         │
│ │  Keep closing! 🐯                           │                         │
│ └─────────────────────────────────────────────┘                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 7: Customer Types Anything → AI Chat Mode                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ CUSTOMER TYPES:                                                         │
│ "She said she doesn't have money right now"                             │
│                                                                         │
│ BOT RESPONDS (AI-generated):                                            │
│                                                                         │
│ ┌─────────────────────────────────────────────┐                         │
│ │  🐯 Tiger Bot Scout                         │                         │
│ │  ─────────────────────────────────────────  │                         │
│ │                                             │                         │
│ │  Great objection to handle! Here's how:     │                         │
│ │                                             │                         │
│ │  "I totally understand — I felt the same    │                         │
│ │  way when I first looked at this. What      │                         │
│ │  helped me was realizing that the starter   │                         │
│ │  kit pays for itself within the first       │                         │
│ │  month if you just share with 3-4 people.   │                         │
│ │                                             │                         │
│ │  Would it help if I showed you how some     │                         │
│ │  of my team members got started with        │                         │
│ │  almost no upfront cost?"                   │                         │
│ │                                             │                         │
│ │  💡 Key: Don't push. Acknowledge their      │                         │
│ │  concern, then offer a different angle.     │                         │
│ │                                             │                         │
│ └─────────────────────────────────────────────┘                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## SUMMARY: THE COMPLETE CUSTOMER JOURNEY

```
1. SEES AD/POST
      ↓
2. CLICKS LINK → STAN STORE
      ↓
3. PAYS $99/mo
      ↓
4. STRIPE CREATES SUBSCRIPTION
      ↓
5. WEBHOOK → YOUR API
      ↓
6. API CREATES TENANT IN DATABASE
      ↓
7. TENANT APPEARS ON DASHBOARD (Customers section)
      ↓
8. CUSTOMER GETS WELCOME EMAIL
      ↓
9. CUSTOMER OPENS TELEGRAM, TAPS START
      ↓
10. BOT SAVES THEIR CHAT_ID
      ↓
11. DASHBOARD SHOWS "Active" (not "Pending Setup")
      ↓
12. EVERY MORNING: DAILY REPORT WITH PROSPECTS
      ↓
13. CUSTOMER USES /script, /objection, CHAT
      ↓
14. CUSTOMER GIVES FEEDBACK → HIVE LEARNS
      ↓
15. REPEAT DAILY
```

---

## WHAT'S MISSING TO MAKE THIS WORK

| Item | Status | Action |
|------|--------|--------|
| Provisioning router mounted | ❌ | Add to server.ts |
| Tenants table created | ❌ | Run PROVISIONING_SCHEMA |
| Stripe webhook configured | ❌ | Add URL in Stripe dashboard |
| Dashboard fetches real tenants | ❌ | Update JavaScript to call API |
| Welcome email sending | ❌ | Configure Brevo API key |
| Stan Store images | ❌ | Have Birdie create |
| Stan Store → Stripe linked | ✅ | Already working |
