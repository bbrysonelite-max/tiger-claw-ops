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
- Read briefings from: `multiagent/briefings/daily/YYYY-MM-DD/claude_code.md`
- Write status updates to same file
- Escalate blockers with `URGENT:` prefix
