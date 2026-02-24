# Mantis — Research Brief
## Full architecture + current state — updated 2026-02-24

---

## What You Are Researching For

**BotCraft Works** — a multi-tenant SaaS that provisions individual AI-powered Telegram bots for paying customers. Built by Brent Bryson, operating commercially with paying customers in SE Asia (primarily Thailand, Vietnam, Indonesia, Malaysia).

**Two products:**
- **Tiger Claw Scout** 🐯 — AI prospecting engine for network marketing distributors
- **Alien Claw** 👽 — AI business operations assistant for other professions (Airbnb, real estate, healthcare, massage therapy, fitness coaching)

---

## Current Architecture

### Server
- **DigitalOcean Singapore** — `209.97.168.251`
- Single VPS (this is a known risk — no failover yet)
- OS: Ubuntu, app runs as `root` via PM2
- **Second droplet exists** but redundancy/failover is NOT configured

### Application
- **Language:** TypeScript → compiled to `dist/` by `tsc`
- **Process manager:** PM2 (7 processes)
- **Queue:** BullMQ + Redis (job processing for Telegram messages)
- **ORM:** Prisma v5 + PostgreSQL (pgvector extension)
- **Backups:** Backblaze (programmatic, automated) — restore not yet tested

### AI Stack
- **Primary model:** `claude-opus-4-5-20251101` — runs the customer conversation tool-use loop
- **Scheduling model:** `claude-3-5-haiku-20241022` — daily prospect hunting (cost optimization)
- **Script model:** `claude-sonnet-4-6` — /script command
- **Key:** Anthropic API — cost is significant. This week: ~$2,000 due to crashes + repeated sessions.

### Telegram Architecture
- Each customer gets their OWN bot token (via BotFather), registered via webhook
- Webhook URL format: `https://api.botcraftwrks.ai/telegram/{sha256_hash_of_token}`
- Messages route to `tiger-worker` via BullMQ INBOUND queue
- No shared bot — fully isolated per tenant

### Database Schema (Key Tables)
- `Tenant` — one per customer. Holds encrypted bot token, flavor, trial dates, status.
- `Prospect` — leads found by AI scheduler. Scored 0-100. Only 70+ delivered.
- `Script` — AI-generated outreach scripts. Tracks outcome: no_response/replied/converted.
- `HivePattern` — shared learning. Successful scripts feed patterns here.
- `Flavor` — profession configs. systemPrompt + enabledTools, live-editable.
- `InviteToken` — for trial/gifted customers.
- `ops_bulletins` — NOT a Prisma model, raw PostgreSQL table.

---

## Current PM2 Processes

| Name | Role |
|------|------|
| `tiger-bot` | REST API on port 4000 |
| `tiger-poller` | Telegram long-poll fallback |
| `tiger-worker` | Processes all inbound Telegram messages |
| `provision-worker` | Provisions new bots via BotFather |
| `tiger-gateway` | Registers webhooks with Telegram |
| `prospect-scheduler` | Daily 5 AM Bangkok prospect hunt |
| `health-monitor` | System health watchdog |

---

## The Flavor System

Profession-specific behavior is entirely DB-driven via the `"Flavor"` table. Each flavor contains:
- `systemPrompt` — full AI persona and instructions
- `enabledTools` — array of tool names available to this flavor
- `prospectSources` — where to search for leads
- `signalVocabulary` — pain points and triggers to look for

Changes take effect on next customer message — no server restart needed.

---

## Prospect Sourcing (Current)

- **Source:** Reddit public API (no key needed)
- **Current subreddits:** r/sidehustle, r/workfromhome, r/antiMLM, r/entrepreneur, r/financialindependence
- **Known gap:** These subreddits are primarily English-speaking US content. Thai/SE Asia customers need local sources.
- **AI extraction model:** `claude-3-5-haiku-20241022`
- **Frequency:** Daily at 5:00 AM Bangkok / 22:00 UTC
- **Delivery:** Only prospects scored 70+ appear in daily reports

---

## Customer Languages Supported

Thai (th), Vietnamese (vi), Indonesian Bahasa (id), Malay (ms), Spanish (es), English (en)

---

## Provisioning Flow

```
New customer purchase (Stan Store)
  → POST /webhooks/stanstore
  → InviteToken created in DB
  → Welcome email sent (Resend.com)
  → Admin Telegram notification
  → Customer receives claim link
  → Customer visits claim page, enters name + email
  → provision-worker creates:
      - Tenant record in DB
      - New Telegram bot via BotFather API
      - Registers webhook with Telegram
      - Sends /start welcome message to customer
```

---

## Known Infrastructure Risks (Brent's Blind Spots)

1. **Single point of failure** — One server. If DigitalOcean Singapore goes down, all customers lose service immediately. Second droplet exists but not in failover configuration.
2. **Backup restore never tested** — Backblaze backups exist and are automated. But a backup that's never been restored is not a verified backup.
3. **No 2 AM alerting** — PM2 can crash silently. No SMS/call alerts when processes die at night.
4. **Reddit as prospect source** — Wrong market. Thai distributors need Thai-language local sources (Line Open Chat, Facebook groups, local forums). Customers in Bangkok aren't helped by r/sidehustle posts.
5. **No customer-facing dashboard** — Customers can only interact via Telegram commands. No web UI to see pipeline, edit prospects, review scripts. This was cited in losing an Airbnb deal (Filip's son was frustrated with the bot).
6. **Conversation quality unknown** — No systematic logging of what customers are asking and what the AI answers. No way to know if Alien Claw is actually useful for non-NM customers.
7. **Trial expiry handled silently** — Bot suspends and sends one message. No recovery path, no support ticket created.
8. **Single BotFather account limit** — BotFather accounts have a 20-bot limit. Rate limiting caused a 57-hour partial outage this week when 4 bots needed re-provisioning.

---

## This Week's Incident Summary (2026-02-17 to 24)

- **Feb 17:** Claude Code deployed SQL with non-existent column names. Customers received no responses for hours.
- **Feb 18:** Claude Code committed directly to `main` (bypassing branch policy) and ran `pm2 restart` (hard kill) instead of `pm2 reload`. Service gaps for paying customers.
- **Multiple sessions:** Context window exhaustion caused Claude Code sessions to auto-summarize, losing precision. Each crash required 4-8 hours of recovery work. Estimated cost: ~$2,000 in API compute.
- **Business impact:** 57-hour effective outage. Airbnb deal lost — customer's user was frustrated with bot quality during a live demonstration.
- **Root cause (structural):** No session persistence discipline, no branch enforcement, no safe deployment checklist.
- **Fix implemented:** `SESSION.md` (crash recovery document, updated every session), `CLAUDE.md` hardened with mandatory rules, branch + PR policy documented with incident history.

---

## Current State (2026-02-24 ~04:00 UTC)

- All 7 PM2 processes: **online**
- Tests: **114/114 passing**
- Alien Claw branding: **deployed** (PR #16)
- Stan Store webhook: **deployed** (PR #14/15)
- Reprovision of 4 bots: **pending** — fires at 05:00 UTC today
- Stan Store email/Telegram notifications: **blocked** — needs 3 env vars from Brent

---

## Research Areas You Help With

When Brent asks you to research, likely topics include:
- Thai/SE Asia social platforms for prospect sourcing (Line, Facebook, TikTok, local forums)
- WhatsApp Business API for outreach automation
- Alternative AI models vs Anthropic (cost, quality, reliability tradeoffs)
- DigitalOcean vs alternatives for SE Asia latency
- PostgreSQL backup strategies and restore testing
- BotFather rate limits and multi-account workarounds
- MySudo for multi-session management
- Stan Store API / webhook documentation
- Resend.com transactional email setup
- Network marketing regulations in Thailand/Vietnam/Indonesia
