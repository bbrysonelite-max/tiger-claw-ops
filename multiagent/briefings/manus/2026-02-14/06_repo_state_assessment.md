# Tiger Bot Scout — Actual Current State (Feb 14, 2026)

## What Actually Exists and Works

### Infrastructure
- **Gateway**: api.botcraftwrks.ai (NOT localhost)
- **Bot Platform**: Telegram bots via GramJS (TelegramClient, StringSession)
- **Provisioning**: provision-bots.cjs — CommonJS script that creates bots via Telegram API
- **Bot naming**: Tiger_{random_suffix}_bot (e.g., Tiger_5g6swcaw_bot)
- **Delay**: 30-second delays between bot creation to avoid Telegram rate limiting

### 9 Live Customers (Already Provisioned)
| Customer | Market | Bot Link | Email |
|----------|--------|----------|-------|
| Nancy Lim | Thailand | Tiger_5g6swcaw_bot | nancynutcha@gmail.com |
| Chana Lohasaptawee | Thailand | Tiger_urkz4hwl_bot | chanaloha7777@gmail.com |
| Phaitoon S. | Thailand | Tiger_d8a671af_bot | phaitoon2010@gmail.com |
| Tarida Sukavanich | Thailand | Tiger_d0aa5717_bot | taridadew@gmail.com |
| Lily Vergara | Thailand | Tiger_d2fc1bed_bot | lilyrosev@gmail.com |
| Theera Phetmalaigul | Thailand | Tiger_Theera_bot | theeraphet@gmail.com |
| John & Noon | Thailand | Tiger_JohnNoon_bot | johnnoon.biz@gmail.com |
| Debbie Cameron | Spain | Tiger_Debbie_bot | justagreatdirector@outlook.com |
| Brent Bryson | USA | Tiger_Brent_bot | brent@tigertopup.com |

### Bot Creation Process (from provision-bots.cjs)
1. Uses TelegramClient with StringSession
2. Connects to Telegram API
3. Generates bot name: Tiger_{random_hex}_bot
4. Creates bot via @BotFather conversation
5. Extracts bot token from BotFather response
6. Registers bot with api.botcraftwrks.ai gateway
7. 30-second delay between each bot

### Multi-Agent System
- **Agent Zero**: Primary orchestrator, does commits, provisioning
- **Birdie**: Handles onboarding emails, Stan Store integration
- **Claude Code Terminal**: Development agent
- Agents communicate via briefings in multiagent/briefings/

### Dashboard
- website/dashboard.html — 10,001 line SPA
- api/server.ts — Express server on port 4000
- Mock data fallbacks (PostgreSQL optional)
- Dark mode, mobile responsive

### What's Been Done Recently
- Bots provisioned for all 9 customers
- Welcome email template created (Birdie task)
- Stan Store integration being verified
- F-05 Failsafe Feedback Loop added
- F-06 OpenClaw Update Tracking added

### Purchase-to-Bot Flow (Designed but Not Fully Working)
Stan Store purchase → Stripe checkout.session.completed → api.botcraftwrks.ai/stripe/webhook → Redis provision job → Worker creates bot via BotFather → Brevo sends welcome email → Customer clicks link, taps START → Bot welcomes customer

### Critical Infrastructure Gaps (from Feb 11 Comprehensive Report)
- Redis: Should be Upstash (cloud), actually localhost:6379
- Database: Should be Supabase + pgvector, actually local PostgreSQL
- Bot Architecture: Was single shared token, now per-customer dedicated bots
- Session String: TELEGRAM_SESSION_STRING was generated but lost
- Workers: Mac Pro Trash Cans not configured
- Stripe webhook: we_1SzVPy0Fp3hGvMoUr8d4WKDz at api.botcraftwrks.ai/stripe/webhook

### What Does NOT Exist Yet
- Onboarding interview state machine (the conversational flow after /start)
- ICP (Ideal Customer Profile) interview
- API key rotation system (72-hour trial, then customer's own key)
- Nurture campaign engine
- Prospecting automation
- The actual "hello world" moment — what happens after customer taps START
- Aftercare/retention sequences
- The bot's brain/personality (no .md briefing files loaded into bots yet)
