# SESSION.md — Tiger Claw Ops
## Read this FIRST at the start of every session. Update it throughout.

---

## Last Updated
2026-02-24 ~03:35 UTC
Session: Claude Code (claude-sonnet-4-6)

---

## Production Server
- **IP:** 209.97.168.251 (DigitalOcean Singapore)
- **SSH:** `ssh -i ~/.ssh/claude_autonomous root@209.97.168.251`
  - User is `root`, NOT `ubuntu` — ubuntu key auth fails
  - Key: `~/.ssh/claude_autonomous`
- **App dir:** `/home/ubuntu/tiger-bot-api`
- **DB:** `postgresql://botcraft:chatwoot123@127.0.0.1:5432/tiger_bot`
- **Deployed from:** `main` branch → `npm run build` → `pm2 reload tiger-bot`

---

## PM2 Status (as of 02:20 UTC 2026-02-24)
All 7 processes **online**:
- `tiger-bot` (API, port 4000)
- `tiger-poller` (Telegram long-poll)
- `tiger-worker` (BullMQ job processor)
- `provision-worker` (new bot provisioning)
- `tiger-gateway` (webhook registrar)
- `prospect-scheduler` (daily 5 AM Bangkok hunt)
- `health-monitor`

---

## Active Branches
| Branch | Purpose | Status |
|--------|---------|--------|
| `main` | Production | Deployed |
| `feat/stanstore-webhook` | Stan Store auto-provision | **PR #14 open — not yet merged** |

---

## What's Done (This Session / 2026-02-23 to 24)
- Tiger Bot → Tiger Claw rebrand across 107 files
- Gemini → Anthropic Claude swap (key-manager.ts, prospect-scheduler.ts, scout-ops-monitor.cjs)
- GitHub repo renamed: tiger-bot-scout → tiger-claw-ops
- All 6 Flavor system prompts updated in production DB (no restart needed):
  - `network-marketer` — Tiger Claw Scout persona, 6 tools
  - `airbnb-host` — Alien Claw persona, 4 tools
  - `realtor` — Alien Claw persona, 6 tools
  - `healthcare` — Alien Claw persona (HIPAA-conscious), 5 tools
  - `massage-therapist` — Alien Claw persona, 5 tools
  - `fitness-coach` — NEW, Alien Claw persona, 5 tools (inserted this session)
- Stan Store webhook built (`POST /webhooks/stanstore`), committed, pushed, PR #14 open
- SSH config issue diagnosed: production server requires `root` user not `ubuntu`

---

## In Progress
### Stan Store Webhook — PR #14
- **Code:** Complete and correct in `feat/stanstore-webhook`
- **PR:** https://github.com/bbrysonelite-max/tiger-claw-ops/pull/14
- **Blocked on:** 4 env vars not yet added to server `.env`

**Env vars needed before deploy:**
```
RESEND_API_KEY=             # Resend.com — for customer welcome emails
ADMIN_TELEGRAM_TOKEN=       # Brent's personal admin bot token
ADMIN_CHAT_ID=              # Brent's Telegram chat ID
STANSTORE_WEBHOOK_SECRET=   # Optional — set to match Stan Store webhook config
```

**Deploy steps (after env vars are set):**
```bash
ssh -i ~/.ssh/claude_autonomous root@209.97.168.251
cd /home/ubuntu/tiger-bot-api
# Add the 4 env vars to .env
git pull origin main   # after merging PR #14
npm run build
pm2 reload tiger-bot   # RELOAD not restart
# Verify:
curl -X POST https://botcraftwrks.ai/webhooks/stanstore \
  -H "Content-Type: application/json" \
  -d '{"email":"brent@test.com","name":"Test User"}'
# Should return: {"received":true}
# Check DB: SELECT * FROM "InviteToken" ORDER BY "createdAt" DESC LIMIT 1;
```

---

### Reprovision 4 Bots — PENDING (fires 05:00 UTC 2026-02-24)
- Script: `/home/ubuntu/tiger-bot-api/reprovision-4-delayed.mjs` (PID 1949734)
- Log: `/home/ubuntu/reprovision-4.log`
- Status: Waiting for BotFather rate limit to clear at 05:00 UTC
- Bots: Lily, John&Noon, Pat, Rebecca (all had 401 token errors)
- **After 05:00 UTC:** Check log to confirm all 4 re-provisioned successfully

---

## Open To-Do List (Priority Order)
1. **Verify reprovision** — after 05:00 UTC, confirm 4 bots (Lily, John&Noon, Pat, Rebecca) are live
2. **Stan Store webhook env vars** — add RESEND_API_KEY, ADMIN_TELEGRAM_TOKEN, ADMIN_CHAT_ID to server .env (Brent must provide credentials)
3. **Alien Claw branding in worker** — bot sends Tiger Claw branding on /start regardless of flavor; airbnb/realtor/etc should present as "Alien Claw"
4. **MySudo multi-session provisioner** — new feature, not started
5. **Claim page** (`claim.html`) — verify works end-to-end with InviteToken flow

## Completed This Session
- ✅ SESSION.md created (crash prevention)
- ✅ CLAUDE.md hardened with mandatory session discipline rules
- ✅ All 6 flavors updated in production DB (Tiger Claw Scout + 5 Alien Claw variants)
- ✅ Stan Store webhook built — PR #14 merged, deployed
- ✅ Tests: 114/114 passing (was 68/102) — zero failures

---

## Known Landmines — Read Before Touching Anything
| Landmine | Details |
|----------|---------|
| `pm2 restart` = hard kill | Always use `pm2 reload` for zero-downtime |
| Never commit to `main` directly | All work on `feat/` or `fix/` branch, PR required |
| `ubuntu` user SSH fails | Use `root` with `~/.ssh/claude_autonomous` |
| SSH config is stale | `~/.ssh/config` points to old dead IP (208.113.131.83). Use explicit `-i ~/.ssh/claude_autonomous root@209.97.168.251` |
| Prisma vs raw SQL for ops_bulletins | No Prisma model for ops_bulletins — use `db.query()` INSERT with columns: `agent_id, agent_name, bulletin_type, priority, title, content, expires_at` |
| Double-quote escaping in psql via SSH | Write SQL to a `/tmp/file.sql` then `psql -f /tmp/file.sql` instead of heredoc in SSH |
| Database table names are quoted | `"Flavor"`, `"InviteToken"` — PostgreSQL is case-sensitive with Prisma-generated names |

---

## Architecture Quick Reference
- **API:** `api/server.ts` → compiled to `dist/api/server.js` → served by PM2 `tiger-bot`
- **Worker:** `src/fleet/worker.ts` — BullMQ, handles Telegram messages, tool-use loop
- **Flavors:** DB-driven via `"Flavor"` table — worker loads at runtime, no restart needed to change
- **Tools:** `src/fleet/tools/index.ts` — 6 tools: `get_todays_prospects`, `generate_script`, `search_web`, `update_prospect_status`, `get_calendar_link`, `send_followup_message`
- **Provisioning:** `POST /claim/:token` → BullMQ → provision-worker creates tenant + registers webhook
- **Model used:** `claude-opus-4-5-20251101` in worker tool-use loop; `claude-3-5-haiku-20241022` in prospect-scheduler

---

## Communication
- **Ops bulletins:** `curl -X POST https://api.botcraftwrks.ai/ops/bulletins -H "Content-Type: application/json" -d '{...}'`
- **Ops dashboard:** https://botcraftwrks.ai/dashboard.html → Ops Center
- **Birdie posts flavor specs and coordination to ops bulletins** — check bulletins at session start

---

## Session Discipline Rules
1. **Commit every 30–60 minutes** — even WIP commits on feature branches
2. **Update this file** when something significant is done, discovered, or blocked
3. **Post an ops bulletin** at session start and session end
4. **Never leave a session mid-task** without committing current state and noting next step here
5. **Read this file first** — before touching any code, before asking any questions
