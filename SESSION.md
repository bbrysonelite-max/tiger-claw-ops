# SESSION.md — Tiger Claw Ops
## Read this FIRST at the start of every session. Update it throughout.

---

## Last Updated
2026-02-24 ~05:10 UTC
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
### Multi-Session Provisioner — PR pending
- **Branch:** `feat/multi-session-provisioner`
- **What changed:**
  - `userbot.ts`: `provisionNewBot()` accepts optional `sessionString` param; exports `getAvailableSessions()`; reads `TELEGRAM_SESSION_STRING_2` from env
  - `provision-worker.ts`: `selectAdminSession()` queries DB to count bots per session label; picks 'primary' (incl. NULL legacy bots) up to 18, then falls back to 'secondary'; sets `createdByAdminSession` on every new Tenant
- **Blocked on:** Brent must generate session string for second phone number and add to server `.env` as `TELEGRAM_SESSION_STRING_2`
- **To generate:** On local machine, run `npm run generate-session` and follow prompts with second phone number

**After Brent provides session string:**
```bash
ssh -i ~/.ssh/claude_autonomous root@209.97.168.251
echo "TELEGRAM_SESSION_STRING_2=<paste here>" >> /home/ubuntu/tiger-bot-api/.env
pm2 reload provision-worker
```

---

## Completed This Session
- ✅ Reprovision script (PID 1949734) killed — all 12 bots confirmed alive
- ✅ 8 delete/reprovision scripts removed from server
- ✅ Multi-session provisioner implemented in code (PR pending)
- ✅ MySudo ruled out: VoIP numbers blocked by Telegram. Two real SIM numbers is correct approach.

---

## Open To-Do List (Priority Order)
1. **`botTokenHash` inconsistency** — Debbie Cameron has 64-char SHA256; 11 others have 16-char truncated values. Mixed provisioning code. Verify routing works for both, then standardize. Do not fix by modifying data without testing first.
2. **Dev environment** — no `.env.development`, no dev PM2 setup exists. Build it before touching anything in production. See broken windows rule.
3. **Stan Store webhook env vars** — add RESEND_API_KEY, ADMIN_TELEGRAM_TOKEN, ADMIN_CHAT_ID to server .env (Brent must provide credentials)
4. **Prospect sources for Thai market** — currently r/sidehustle etc (US/English). Thai distributors need SE Asia sources (Line Open Chat, Thai Facebook groups). Wrong data = zero value from morning reports.
5. **Multi-session provisioner deploy** — code complete in `feat/multi-session-provisioner`; Brent must provide `TELEGRAM_SESSION_STRING_2`
6. **Claim page** (`claim.html`) — verify works end-to-end with InviteToken flow

## Completed This Session
- ✅ SESSION.md created (crash prevention)
- ✅ CLAUDE.md hardened with mandatory session discipline rules
- ✅ All 6 flavors updated in production DB (Tiger Claw Scout + 5 Alien Claw variants)
- ✅ Stan Store webhook built — PR #14 merged, deployed
- ✅ Tests: 114/114 passing (was 68/102) — zero failures
- ✅ Alien Claw branding — PR #16 merged, deployed (tiger-worker reloaded 03:56 UTC)

---

## Known Landmines — Read Before Touching Anything
| Landmine | Details |
|----------|---------|
| `pm2 restart` = hard kill | Always use `pm2 reload` for zero-downtime |
| Never commit to `main` directly | All work on `feat/` or `fix/` branch, PR required |
| `ubuntu` user SSH fails | Use `root` with `~/.ssh/claude_autonomous` |
| SSH config is stale | `~/.ssh/config` points to old dead IP (208.113.131.83). Use explicit `-i ~/.ssh/claude_autonomous root@209.97.168.251` |
| **BotFather rate limit = 5 MINUTES** | `BOTFATHER_MIN_INTERVAL_MS` must be 5 minutes (300,000ms). 90 seconds caused a 24-hour account ban. Brent explicitly specified 5 min. Never reduce without asking Brent first. |
| **Never delete bots without explicit written approval** | Claude deleted healthy bots (including the 4 being reprovisioned) based on incorrect math. Never delete a Tenant record or BotFather bot without Brent explicitly listing the names to delete. |
| **`botTokenHash` values are inconsistent** | Debbie Cameron = 64-char SHA256. All others = 16-char truncated. Different provisioning code ran at different times. Routing works for both currently. Do not "fix" the data without testing first. |
| **Tiger-poller clears webhooks** | `tiger-poller` runs `getUpdates` on all 12 bots continuously. This prevents webhooks from sticking. Current delivery method = long-poll via tiger-poller. Don't try to set webhooks while tiger-poller is running. |
| **No dev environment** | There is no `.env.development` or dev PM2 config. All testing happens against production. This must be fixed before any new development. |
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
- **Uptime Robot:** External uptime monitoring at https://uptimerobot.com — alerts when API goes down
- **Birdie posts flavor specs and coordination to ops bulletins** — check bulletins at session start

---

## Session Discipline Rules
1. **Commit every 30–60 minutes** — even WIP commits on feature branches
2. **Update this file** when something significant is done, discovered, or blocked
3. **Post a Birdie update every 30 minutes** — comprehensive state via ops bulletins: completed, in-progress, pending, blocked, server state, new landmines. Not just session start/end — every 30 minutes.
4. **Never leave a session mid-task** without committing current state and noting next step here
5. **Read this file first** — before touching any code, before asking any questions
