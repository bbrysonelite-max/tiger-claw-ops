# Agent Triad Daily Handoff

**Last Updated:** 2026-02-08 11:30 PM MST (Claude Code)
**Next Standup:** 2026-02-09 08:00 BKK

---

## The Triad

| Agent | Role | Shift | Primary Tasks |
|-------|------|-------|---------------|
| **Claude** | Architect | Night (BKK) | Code, database, API, planning, architecture |
| **Birdie** | Operator | Day (BKK) | Customer support, browser automation, deployments, monitoring |
| **Agent Zero** | Scout | 24/7 (automated) | Prospect discovery, LINE/Facebook monitoring, lead scoring |

---

## CLAUDE CODE → TEAM BRIEFING

### Dashboard Hardening (Feb 8, 2026 - Late Night Session)

**Problem Solved:** Dashboard was showing fake green dots for all bot statuses. Now shows REAL status via actual API health checks.

**What Changed in `dashboard.html`:**

1. **Auto-detect environment** - Dashboard now detects if running locally on trash can vs remotely
   ```javascript
   const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '192.168.0.136';
   const API_BASE = isLocal ? 'http://localhost:4000' : 'https://api.botcraftwrks.ai';
   ```

2. **Birdie control with fallback** - Uses birdie-control.ts server on port 3001, falls back to API server
   ```javascript
   const BIRDIE_CONTROL_BASE = 'http://192.168.0.136:3001';
   const BIRDIE_API_FALLBACK = `${API_BASE}/v1/bots/birdie`;
   ```

3. **Real status indicators** - All bot cards now start as "Checking..." (yellow) and update based on actual health checks

4. **Connection monitoring** - Shows banner when API is offline, with retry button

5. **Bot Fleet status IDs** - Added IDs to all status elements for dynamic updates:
   - `agent-zero-dot-mini`, `agent-zero-text-mini`
   - `tiger-scout-dot-mini`, `tiger-scout-text-mini`
   - `birdie-dot-mini`, `birdie-text-mini`

**New Script in `package.json`:**
```bash
npm run birdie-control        # Run birdie-control.ts
npm run birdie-control:watch  # Run with auto-reload
```

**Files Modified:**
- `/website/dashboard.html` — Complete status monitoring overhaul
- `/package.json` — Added birdie-control scripts

---

### What I Built Earlier (Feb 7-8, 2026)

#### Tiger Bot Scout v1.0.0-beta "Command Center"

**Database Schema (PostgreSQL)**
Created enterprise multi-tenant schema with auto-migration on server startup:

| Table | Purpose |
|-------|---------|
| `tenants` | Customer records (your 7 customers are seeded) |
| `bots` | Bot fleet management |
| `script_library` | Max Steingart scripts with EN + TH translations |
| `conversations` | Message threading per channel |
| `messages` | Full message history |
| `audit_log` | Compliance tracking |

**API Endpoints Added**
```
GET/POST/PATCH /v1/tenants     — Customer CRUD
GET /v1/dashboard/overview     — Stats summary (customers, MRR, bots, prospects)
GET/POST/PATCH /v1/bots        — Bot fleet management
GET /v1/scripts                — Script library with language/category filters
POST /v1/scripts/:id/use       — Track script usage
POST /webhooks/stripe          — Auto-provision on payment
```

**Dashboard Updates**
- Customers section now fetches from API (not hardcoded HTML)
- Script Library shows Max Steingart methodology scripts
- Language toggle: English, Thai, Spanish
- Category filter: opening, qualifying, transition, objection, follow_up, closing
- Stats update dynamically from database

**Stripe Webhook Automation**
When customer pays via Stan Store → Stripe:
1. `checkout.session.completed` → creates tenant in database
2. `customer.subscription.updated` → syncs status (active/paused/cancelled)
3. `invoice.payment_failed` → auto-pauses account

**Files Modified/Created**
- `/api/server.ts` — Added v1 tables auto-migration, tenant API, Stripe webhooks
- `/api/db/migrations/001_v1_enterprise.sql` — Full schema + seed data
- `/website/dashboard.html` — Dynamic customers, script library UI
- `/package.json` — Added Stripe dependency
- `/VERSION.md` — Updated to v1.0.0-beta

---

### The 7 Customers (Seeded in Database)

| Name | Email | Plan | Status |
|------|-------|------|--------|
| Nancy Lim | nancylimsk@gmail.com | scout | active |
| Chana Lohasaptawee | chana.loh@gmail.com | scout | active |
| Phaitoon S. | phaitoon2010@gmail.com | scout | active |
| Tarida Sukavanich | taridadew@gmail.com | scout | active |
| Lily Vergara | lily.vergara@gmail.com | scout | active |
| Theera Phetmalaigul | phetmalaigul@gmail.com | scout | active |
| John & Noon | vijohn@hotmail.com | scout | active |

---

### Max Steingart Script Library (Seeded)

9 scripts pre-loaded with English + Thai translations:

**Opening**
- Curiosity Opener
- Compliment Opener

**Qualifying**
- The Job Question
- The Open Question

**Transition**
- The Soft Intro

**Objection Handling**
- No Time
- Is This MLM

**Follow-up**
- The Check-In

**Closing**
- The Enrollment Close

---

### OpenClaw Upgrade Path

Identified two new versions:
- **v2026.2.6** (Feb 7) — Opus 4.6 support, token dashboard, safety scanner
- **v2026.2.3** (Feb 5) — Telegram improvements, Cloudflare AI Gateway

**Upgrade commands for Birdie:**
```bash
cd ~/openclaw
git fetch origin
git checkout v2026.2.6
npm install
pm2 restart birdie
```

---

### Not Yet Deployed

The v1.0.0-beta code exists locally but is NOT on the server yet. Deployment commands:

```bash
# Local
cd /Users/brentbryson/Desktop/tiger-bot-website/tiger-bot-scout
git add -A
git commit -m "v1.0.0-beta: Enterprise schema, script library, Stripe webhooks"
git push

# Server
ssh -i ~/Desktop/"botcraft key pair.pem" ubuntu@208.113.131.83
cd tiger-bot-api && git pull && npm install && pm2 restart all
```

---

### Outstanding Tasks

| Priority | Task | Owner | Status |
|----------|------|-------|--------|
| 0 | **Start birdie-control.ts on trash can** | Birdie | NEW |
| 0 | **Run `openclaw gateway install`** | Birdie | NEW (prevents boot crashes) |
| 1 | Deploy v1.0.0-beta to server | Birdie | |
| 2 | Upgrade OpenClaw to v2026.2.6 | Birdie | |
| 3 | Configure Stripe webhook URL in dashboard | Birdie | |
| 4 | Test customer provisioning end-to-end | Birdie + Agent Zero | |
| 5 | Add Spanish translations to script library | Claude | |
| 6 | Build Agent Zero → Leap prospect pipeline | Claude | |
| 7 | Configure LINE OpenChat monitoring skill | Claude + Agent Zero | |

### CRITICAL: Start birdie-control.ts on Trash Can

The dashboard's Birdie Restart/Update buttons need the birdie-control server running:

```bash
cd /Users/birdie/clawd/tiger-bot-scout  # or wherever the code is
npm install
npm run birdie-control
# OR with pm2:
pm2 start "npx tsx api/birdie-control.ts" --name birdie-control
```

This starts a tiny HTTP server on port 3001 that:
- `GET /status` — Check if OpenClaw gateway is running
- `POST /restart` — Restart Birdie (kill + start gateway)
- `POST /update` — Update OpenClaw + restart
- `GET /logs` — View recent Birdie logs

---

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PROSPECT DISCOVERY                        │
│  Agent Zero (Docker :50001)                                      │
│  ├── LINE OpenChat Monitor (Thai groups)                         │
│  ├── Facebook Group Monitor (Thai entrepreneur groups)           │
│  └── Buying Signal Detection (AI scoring)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ POST /v1/prospects
┌─────────────────────────────────────────────────────────────────┐
│                      TIGER BOT SCOUT API                         │
│  PostgreSQL: tenants, bots, prospects, scripts, messages         │
│  ├── /v1/tenants (customer management)                           │
│  ├── /v1/prospects (from Agent Zero)                             │
│  ├── /v1/scripts (Max Steingart library)                         │
│  └── /webhooks/stripe (auto-provisioning)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   Dashboard      │ │   Tiger Bot      │ │   Birdie Bot     │
│   (website)      │ │   (Telegram)     │ │   (Telegram)     │
│   - Stats        │ │   - Daily Report │ │   - Support      │
│   - Customers    │ │   - Scripts      │ │   - Monitoring   │
│   - Scripts      │ │   - Objections   │ │   - Automation   │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

---

### Questions for Team

**For Birdie:**
1. What's the current status of the 7 customers? (5/7 replied per last update)
2. Have you sent any follow-up messages since the onboarding emails?
3. What browser automation tasks are you handling?
4. Any blockers or issues I should know about?

**For Agent Zero:**
1. What LINE OpenChat rooms are you currently monitoring?
2. How many prospects discovered in the last 24 hours?
3. What's the average lead score of recent prospects?
4. Any rate limiting or access issues?

---

## BIRDIE → TEAM BRIEFING

*(Birdie fills this section during 08:00 BKK standup)*

### Customer Status Update
-

### Tasks Completed Today
-

### Browser Automation Running
-

### Blockers/Issues
-

### Questions for Claude
-

### Questions for Agent Zero
-

---

## AGENT ZERO → TEAM BRIEFING

*(Agent Zero fills this section automatically after each discovery sweep)*

### Discovery Stats (Last 24 Hours)
| Metric | Value |
|--------|-------|
| Prospects Found | - |
| Avg Lead Score | - |
| LINE Rooms Monitored | - |
| Facebook Groups Monitored | - |
| API Calls Made | - |

### Top Prospects Found
1.
2.
3.

### Buying Signals Detected
-

### Technical Status
- Uptime:
- Last Sweep:
- Errors:

### Questions/Blockers
-

---

## Shared Context

**Server Access**
- IP: 208.113.131.83
- Key: `~/Desktop/"botcraft key pair.pem"`
- User: ubuntu

**Agent Zero**
- Port: 50001
- Container: Docker
- Status: Running

**GitHub Repo**
- https://github.com/bbrysonelite-max/tiger-bot-scout

**Stripe Dashboard**
- Webhook URL to configure: `https://api.botcraftwrks.ai/webhooks/stripe`

**API Base URL**
- Production: `https://api.botcraftwrks.ai`
- Local: `http://localhost:4001`

---

## Protocol

### Daily Cadence

| Time (BKK) | Who | Action |
|------------|-----|--------|
| 08:00 | Birdie | Reads Claude's briefing, fills Birdie section, starts day tasks |
| Continuous | Agent Zero | Runs discovery sweeps, auto-updates Agent Zero section |
| 22:00-06:00 | Claude | Reads team briefings, does dev work, updates Claude section |

### How It Works

1. **One file, three sections** — All agents read and write to this same HANDOFF.md
2. **Git history** — Every update is committed, creating full audit trail
3. **Brent as relay** — Brent can relay urgent items between agents as needed
4. **No blocking** — Each agent works their shift independently, reads updates when available

### Update Commands

```bash
# After updating your section:
git add HANDOFF.md
git commit -m "Handoff update: [Agent Name] [Date]"
git push
```
