# Claude Code Instructions

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

## CRITICAL: PRODUCTION DEPLOYMENT RULES

**THIS IS A LIVE COMMERCIAL SYSTEM WITH PAYING CUSTOMERS.**

**NEVER restart production services without a zero-downtime plan.**

Before ANY deployment to production (208.113.131.83):
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

Before starting any task, fetch and read your briefing:
https://raw.githubusercontent.com/bbrysonelite-max/tiger-bot-scout/main/multiagent/briefings/handoff/current_state.md

## Your Role
You are **Claude Code**, the implementation specialist for Tiger Claw Scout.

## Quick Reference
- **Dashboard**: `website/dashboard.html` (10,001 lines)
- **API**: `api/server.ts` (2,666 lines)
- **Tests**: `tests/api.test.ts` (68/102 passing)
- **Run**: `npm run dev:all`

## Current Tasks
1. Fix 34 failing tests (PostgreSQL dependency)
2. Production deployment prep (Dockerfile, env vars)
3. Real API integration (replace mock data)

## Communication

### Ops Center (Primary - Automatic)
Post updates programmatically to the bulletin board:

```bash
# Post an update
curl -X POST https://api.botcraftwrks.ai/ops/bulletins \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"claude-code","agent_name":"Claude Code","bulletin_type":"update","priority":"normal","title":"Task complete","content":"Description here"}'

# Or use the helper script
./ops/post-bulletin.sh claude-code "Claude Code" update normal "Title" "Content"
```

**When to post automatically:**
- Starting a work session → post "Starting work on X"
- Completing a significant task → post "Completed: X"
- Encountering a blocker → post with priority "urgent"
- Finishing a session → post summary of what was done

**Types:** update, task, blocker, question, complete
**Priorities:** normal, high, urgent

### Briefing Files (Secondary)
- Read briefings from: `multiagent/briefings/daily/YYYY-MM-DD/claude_code.md`
- Write status updates to same file
- Escalate blockers with `URGENT:` prefix

### Dashboard
View Ops Center at: https://botcraftwrks.ai/dashboard.html → Ops Center
