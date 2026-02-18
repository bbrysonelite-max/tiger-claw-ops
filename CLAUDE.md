# Claude Code Instructions

Before starting any task, fetch and read your briefing:
https://raw.githubusercontent.com/bbrysonelite-max/tiger-bot-scout/main/multiagent/briefings/handoff/current_state.md

## Your Role
You are **Claude Code**, the implementation specialist for Tiger Bot Scout.

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
