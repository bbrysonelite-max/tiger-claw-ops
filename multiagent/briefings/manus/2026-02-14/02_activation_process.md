# Tiger Claw Activation: What Happens When Someone Pushes the Button

**Date:** February 14, 2026  
**Based on:** tiger-bot-scout repo as of Feb 13, 2026  
**Author:** Manus AI  
**For:** Brent Bryson

---

## The Honest Picture

This document describes what the activation process *should* be, what *actually exists* in the codebase today, and what *still needs to be built*. No hype, no exaggeration.

---

## Step 0: The Purchase

**What should happen:**

A customer buys Tiger Claw on Stan Store. Stripe processes the payment and fires a `checkout.session.completed` webhook to `https://api.botcraftwrks.ai/stripe/webhook`. The gateway receives it, creates a provision job in Redis, and the automation begins.

**What actually exists:**

| Component | Status | Detail |
|-----------|--------|--------|
| Stan Store product listing | Exists | Needs verification that Stripe is connected as processor |
| Stripe webhook endpoint | Configured | `we_1SzVPy0Fp3hGvMoUr8d4WKDz` pointing to `api.botcraftwrks.ai/stripe/webhook` |
| Gateway receiving webhooks | Running | PM2 process `tiger-gateway v3.1.0` on cloud server `208.113.131.83` |
| Redis job queue | Broken | Using `localhost:6379` instead of Upstash cloud — jobs queued on the gateway server die there because workers are on different machines |
| Automatic bot provisioning from webhook | Not working | The chain breaks at Redis. Jobs never reach workers. |

**What actually happened for the first 9 customers:** Agent Zero ran `provision-bots.cjs` manually from the command line. Each bot was created one at a time with 30-second delays between them to avoid Telegram rate limits. This is not automation — it is a human (or agent) running a script.

---

## Step 1: Bot Creation

**What should happen:**

A worker picks up the provision job from Redis, connects to Telegram via GramJS with the `TELEGRAM_SESSION_STRING`, talks to @BotFather, creates a new bot named `Tiger_{random}_bot`, extracts the bot token, and registers it with the gateway.

**What actually exists:**

The provisioning script (`provision-bots.cjs`) does work. It uses the Telegram API (`telegram` npm package with GramJS), generates a random hex suffix for the bot name, creates the bot through BotFather, and registers it. The 9 bots that exist today were all created this way.

```
provision-bots.cjs flow:
1. Connect TelegramClient with StringSession
2. Generate name: Tiger_{crypto.randomBytes(4).toString('hex')}_bot
3. Send /newbot to @BotFather
4. Send display name, then username
5. Extract bot token from BotFather response
6. POST to https://api.botcraftwrks.ai/bots/register
7. Sleep 30 seconds
8. Next customer
```

**The gap:** This script runs manually. There is no automated trigger from Stripe to this script. The `TELEGRAM_SESSION_STRING` was generated once on a Mac Pro Trash Can but was lost (terminal output not captured). It needs to be regenerated.

---

## Step 2: Welcome Email

**What should happen:**

After the bot is created, Brevo (email service) sends a personalized welcome email with the customer's bot link.

**What actually exists:**

A welcome email template exists in `birdie_onboarding.md`. It is simple and clear:

> Hi [FIRST_NAME],
>
> Your personal Tiger Claw Scout is now live and ready to help you find prospects.
>
> Click here to start: [BOT_LINK]
>
> Once you open the link:
> 1. Tap "START" to activate your bot
> 2. Your bot will guide you through the setup

**The gap:** Birdie (the agent responsible for emails) was tasked with sending these on Feb 12. Whether the Brevo API integration actually works end-to-end has not been confirmed in the repo. The email template exists. The sending mechanism is unclear.

---

## Step 3: Customer Opens Telegram and Taps START

**What should happen:**

The customer clicks the `t.me/Tiger_{name}_bot` link, opens Telegram, taps START. The bot greets them by name and begins Interview 1.

**What actually exists:**

Nothing. This is the single biggest gap in the entire system.

When a customer taps START on any of the 9 existing bots right now, the bot has no conversation logic. There is no onboarding interview. There is no greeting. There is no state machine. The bot token is registered with the gateway, but the gateway's bot handler (if it exists) has no conversational flow defined.

The dashboard (`website/dashboard.html`) exists and is polished — 10,001 lines, dark mode, mobile responsive, mock data fallbacks. But the actual bot-to-customer conversation does not exist.

---

## Step 4: Interview 1 — "Who Are You?"

**What should happen:**

The bot asks 6 conversational questions:
1. What is your name?
2. What is your phone number?
3. What business are you in?
4. How long have you been doing this?
5. What is your mission — what does success look like?
6. How are you currently finding customers?

The LLM extracts structured data from natural language answers. A customer briefing `.md` file is generated and stored in persistent memory.

**What actually exists:**

Nothing. No interview logic. No state machine. No briefing generation. No persistent memory storage for customer profiles.

The concept is documented in the flywheel system design (the document we built earlier in this project), but no code implements it.

---

## Step 5: Interview 2 — "Who Is Your Ideal Customer?"

**What should happen:**

The bot asks 6 more questions:
1. Describe your ideal customer.
2. What problem do they have that you solve?
3. Where do they hang out online?
4. What keywords would they use?
5. What triggers them to buy?
6. Who should the bot avoid?

An ICP (Ideal Customer Profile) briefing is generated. Prospecting configuration is created from the answers.

**What actually exists:**

Nothing. Same gap as Interview 1.

---

## Step 6: API Key Rotation

**What should happen:**

After onboarding, the bot runs on your provisioned LLM key for 72 hours. At 24h, 48h, and 64h, the bot sends reminders. At 72h, the customer must enter their own API key via a `/setkey` command. If they don't, the bot pauses gracefully.

**What actually exists:**

Nothing. There is no API key management system. The bots currently use whatever LLM key is configured in the gateway's environment variables. There is no per-customer key isolation, no rotation mechanism, no timer, no reminders.

---

## Step 7: "Hello World" — The Bot Starts Working

**What should happen:**

Once the customer has completed both interviews and (optionally) rotated their API key, the bot begins prospecting. It announces what it's doing, starts the nurture sequences, and delivers the first prospect list at 7 AM the next morning.

**What actually exists:**

The dashboard has prospect tables, script generators, Hive learnings, and analytics — all with mock data. The API server (`api/server.ts`, 2,666 lines) has endpoints for leads, scripts, hive leaderboard, analytics funnel, and settings. But all of this runs on mock data fallbacks because the database is local PostgreSQL without the required Supabase/pgvector setup.

No bot is currently prospecting. No nurture sequences are running. No prospect lists are being delivered.

---

## Summary: What Exists vs. What's Missing

| Step | Component | Exists | Works | Notes |
|------|-----------|--------|-------|-------|
| 0 | Stan Store listing | Yes | Unverified | Stripe connection needs testing |
| 0 | Stripe webhook | Yes | Partially | Webhook fires but Redis queue is broken (localhost) |
| 0 | Gateway server | Yes | Yes | PM2 on cloud server, 11h+ uptime |
| 1 | Bot creation script | Yes | Yes | Manual execution only, not automated |
| 1 | 9 customer bots | Yes | Yes | All created and registered |
| 2 | Welcome email template | Yes | Unverified | Brevo integration status unclear |
| 3 | Bot greeting / START handler | No | No | **Critical gap — nothing happens when customer taps START** |
| 4 | Interview 1 (Customer Profile) | No | No | No conversation logic exists |
| 5 | Interview 2 (ICP) | No | No | No conversation logic exists |
| 6 | API key rotation | No | No | No per-customer key management |
| 7 | Prospecting engine | No | No | Dashboard exists with mock data only |
| 7 | Nurture sequences | No | No | Designed but not implemented |
| — | Dashboard UI | Yes | Yes | 10,001 lines, polished, mock data |
| — | API server | Yes | Yes | 2,666 lines, mock fallbacks |
| — | Multi-agent system | Yes | Yes | Agent Zero, Birdie, Claude Code Terminal |
| — | Test suite | Partial | Partial | 68/102 passing (34 need PostgreSQL) |

---

## The Critical Path

If you want a customer to push a button and have a working Tiger Claw, these things need to be built in this order:

**Priority 1 — The Bot's Brain (without this, nothing else matters):**

1. A `/start` command handler that greets the customer and begins the interview
2. A conversation state machine that walks through Interview 1 and Interview 2
3. LLM integration so the bot can have natural conversations (not rigid menu-driven)
4. Briefing file generation from interview answers
5. Storage for customer profiles and ICP data (Supabase or at minimum local PostgreSQL)

**Priority 2 — The Automation Chain (so you're not running scripts manually):**

6. Fix Redis — move to Upstash so provision jobs flow from gateway to workers
7. Regenerate and deploy `TELEGRAM_SESSION_STRING` to the cloud server
8. Wire Stripe webhook → Redis → worker → bot creation → email → done
9. Verify Brevo email sending actually works

**Priority 3 — The Value Engine (what makes the bot worth paying for):**

10. Prospecting logic — keyword monitoring, social listening, lead scoring
11. Nurture sequence engine — timed message delivery across channels
12. API key rotation system with 72-hour trial
13. Hive learning — bots sharing insights across the network

---

## Open Questions for You

1. **The 9 existing customers** — have any of them actually tapped START on their bots? If so, what happened? Did they see anything, or just silence?

2. **The bot's brain** — should the conversation be powered by OpenAI/Qwen/Gemini through the gateway, or should each bot have its own direct LLM connection? This affects the API key rotation architecture.

3. **Stan Store flow** — is the product live on Stan Store right now, or is it still in setup? Can new customers currently purchase?

4. **Infrastructure priority** — do you want to fix the Redis/Supabase/Upstash infrastructure first (so automation works), or build the bot conversation first (so there's something to automate)?

---

*This document reflects the actual state of the codebase as of February 14, 2026. No capabilities have been exaggerated.*
