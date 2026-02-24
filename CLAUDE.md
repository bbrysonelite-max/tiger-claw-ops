# Claude Code Instructions

## STEP ONE — READ THIS BEFORE ANYTHING ELSE

**Read `SESSION.md` in the project root immediately.**
It contains the current state, active branches, open tasks, known landmines, and exact next steps.
Do not ask Brent what to do. Do not start from scratch. Read SESSION.md and continue.

---

## MISSION: 100% UPTIME

**The only acceptable standard is 100% uptime. 99% is not acceptable. Paying customers in Thailand and elsewhere depend on this system around the clock.**

---

## CRITICAL: BRANCH POLICY — NO EXCEPTIONS

**ALL development happens on a feature branch. NEVER commit directly to `main`.**

```
# The only approved workflow:
git checkout -b feat/your-feature-name
# ... make changes, test locally ...
git push origin feat/your-feature-name
# Create PR on GitHub → review → merge to main
# Then deploy main to production
```

**On 2026-02-18, Claude Code committed the invite system directly to `main` and restarted live production workers without a branch or PR review. This caused service gaps for paying customers. This must NEVER happen again.**

---

## CRITICAL: BOTFATHER RULES — NO EXCEPTIONS

**On 2026-02-23, Claude Code used 90-second intervals between bot creation calls. Brent explicitly said 5 minutes. The account was banned for 24 hours.**

**On 2026-02-23, Claude Code calculated there were too many bots and deleted bots without authorization. The math was wrong. Healthy bots were deleted, including the 4 that were queued for reprovisioning.**

1. **BotFather rate limit = 5 MINUTES minimum.** `BOTFATHER_MIN_INTERVAL_MS = 300_000`. Never change this without Brent explicitly approving a new value.
2. **Never delete a bot or Tenant record.** Not ever. Not for any reason. Not to "clean up." Not to get under a limit. If you think something needs to be deleted, STOP and ask Brent. List exactly what you think should be deleted and wait for written confirmation of each item by name.
3. **Never run bot math without showing your work.** If you think there are N bots or you're approaching a limit, query the DB, show the count, and ask before acting.

---

## CRITICAL: PRODUCTION DEPLOYMENT RULES

**THIS IS A LIVE COMMERCIAL SYSTEM WITH PAYING CUSTOMERS.**

**NEVER restart production services without a zero-downtime plan.**

Before ANY deployment to production (209.97.168.251 — DigitalOcean Singapore):
1. **BRANCH FIRST** - All work on `feat/` or `fix/` branch, never directly on `main`
2. **VERIFY the database schema** - Check actual column names with `\d tablename`
3. **TEST locally first** - Run the code against a real database
4. **RUN the test suite** - `npm test` must pass
5. **DATABASE MIGRATIONS BEFORE CODE** - Apply DB changes before deploying new code
6. **ZERO-DOWNTIME RESTARTS** - Use `pm2 reload` (graceful) not `pm2 restart` (hard kill)
7. **TEST the endpoint after deployment** - Verify it returns real data, not mock data
8. **CHECK the error logs** - `pm2 logs --err` immediately after deploy
9. **VERIFY with a real request** - Don't assume it works

If you skip these steps and break production, you are failing paying customers.

**On 2026-02-17, Claude deployed untested SQL that referenced non-existent columns. Customers got no responses for hours.**
**On 2026-02-18, Claude committed directly to main and hard-restarted live workers. Service gaps resulted.**

---

## CRITICAL: SESSION DISCIPLINE — PREVENTS CONTEXT LOSS

Context window exhaustion causes sessions to auto-summarize. Summaries lose precision.
Every crash costs Brent hours of recovery and real business consequences.

**These rules are mandatory, not optional:**

1. **Commit every 30–60 minutes** — even WIP commits on a feature branch. Git log = crash recovery.
2. **Update SESSION.md** after every significant action: task done, blocker found, decision made.
3. **Post an ops bulletin** at session start ("Starting: X") and session end ("Completed: X / Next: Y").
4. **Never leave a session mid-task** without: (a) committing current state, (b) noting exact next step in SESSION.md.
5. **Read SESSION.md first** — always. Before touching code, before asking Brent, before anything.

---

## Production Server
- **SSH:** `ssh -i ~/.ssh/claude_autonomous root@209.97.168.251`
- **User is `root`** — `ubuntu` user SSH auth fails
- **App dir:** `/home/ubuntu/tiger-bot-api`
- **Note:** `~/.ssh/config` is stale (points to dead IP). Always use the explicit command above.

## Your Role
You are **Claude Code**, the implementation specialist for Tiger Claw Scout.

## Quick Reference
- **Dashboard**: `website/dashboard.html`
- **API**: `api/server.ts`
- **Tests**: `tests/api.test.ts` (68/102 passing — 34 failing due to PostgreSQL dependency)
- **Run**: `npm run dev:all`

## Current Tasks (see SESSION.md for full detail)
1. Deploy Stan Store webhook — PR #14 open, needs 4 env vars on server
2. Verify reprovision of 4 bots after 05:00 UTC 2026-02-24
3. Fix 34 failing tests (PostgreSQL dependency)
4. MySudo multi-session provisioner

## Communication

### Ops Center (Primary - Automatic)
Post updates programmatically to the bulletin board:

```bash
curl -X POST https://api.botcraftwrks.ai/ops/bulletins \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"claude-code","agent_name":"Claude Code","bulletin_type":"update","priority":"normal","title":"Task complete","content":"Description here"}'
```

**When to post automatically:**
- Starting a work session → post "Starting work on X"
- Completing a significant task → post "Completed: X"
- Encountering a blocker → post with priority "urgent"
- Finishing a session → post summary of what was done and exact next step

**Types:** update, task, blocker, question, complete
**Priorities:** normal, high, urgent

### Dashboard
View Ops Center at: https://botcraftwrks.ai/dashboard.html → Ops Center
