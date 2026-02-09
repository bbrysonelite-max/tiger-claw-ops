# Claude Code Agent Briefing
> **Date:** 2026-02-09  
> **Time:** 11:53 MST  
> **From:** Agent Zero (Orchestrator)  
> **Priority:** HIGH - Read before starting any work

---

## 🎯 Your Role

You are **Claude Code**, the implementation specialist for the Tiger Bot Scout project. Your job is to write, edit, and refactor code in the repository based on task specifications.

---

## 📍 Current Project State

### What Exists
The Tiger Bot Scout Dashboard has been built. Here's what's done:

| Component | Location | Lines | Status |
|-----------|----------|-------|--------|
| Dashboard UI | `website/dashboard.html` | 10,001 | ✅ Complete |
| API Server | `api/server.ts` | 2,666 | ✅ Complete |
| Test Suite | `tests/api.test.ts` | 1,383 | ⚠️ 68/102 passing |
| Types | `types/dashboard.ts` | ~500 | ✅ Complete |

### What Was Built (Phases 1-5)
1. **Overview Page**: 4 metric cards (Prospects, Scripts, Funnel, Hive Pulse)
2. **Prospects Page**: Filterable table, detail modal with tabs
3. **Scripts Page**: History, AI generator, winning gallery
4. **Hive Learnings**: Leaderboard, source performance, trends
5. **Analytics**: Funnel viz, timeline, response rates, ROI calc
6. **Settings**: Bot config, notifications, integrations
7. **Bonus**: Admin dashboard, command palette, achievements, onboarding

---

## 🔧 Repository Details

### GitHub
```
Repo: https://github.com/bbrysonelite-max/tiger-bot-scout
Branch: main
Latest Commit: f0b0038 (2026-02-09)
```

### Local Paths
- **Agent Zero container**: `/usr/projects/tiger-bot-scout`
- **User Mac**: `~/Desktop/tiger-bot-website/tiger-bot-scout`

### Key Files You'll Work With
```
tiger-bot-scout/
├── api/
│   └── server.ts          # Express API - ADD endpoints here
├── website/
│   └── dashboard.html      # SPA dashboard - ADD features here
├── tests/
│   └── api.test.ts         # Jest tests - ADD tests here
├── types/
│   └── dashboard.ts        # TypeScript types
├── serve.js                # Static server (port 3000)
└── package.json            # Scripts: dev, serve, dev:all, test
```

---

## 🏃 How to Run

```bash
# Clone/pull latest
git clone https://github.com/bbrysonelite-max/tiger-bot-scout
cd tiger-bot-scout

# Install
npm install

# Run both servers
npm run dev:all

# Or separately:
npm run dev      # API on port 4000
node serve.js    # Static on port 3000

# Tests
npm test
```

---

## 📋 Immediate Tasks Available

Check the task queue at:
```
/usr/projects/tiger_bot_multiagent/tasks/
```

### Current Priority Tasks:

1. **Fix Remaining 34 Tests**
   - Tests fail due to PostgreSQL dependency
   - Need to add more mock fallbacks or skip DB-dependent tests
   - File: `tests/api.test.ts`

2. **Production Deployment Prep**
   - Add environment variable handling
   - Create Dockerfile
   - Add health check endpoint improvements

3. **Real API Integration**
   - Replace mock data with actual Tiger Bot network calls
   - Implement proper authentication

---

## ⚠️ Important Guidelines

### DO:
- ✅ Read the full context before making changes
- ✅ Follow existing code patterns in the files
- ✅ Test your changes with `npm test`
- ✅ Write descriptive commit messages
- ✅ Update this briefing after completing work

### DON'T:
- ❌ Rewrite large sections without approval
- ❌ Change the API contract without updating frontend
- ❌ Remove mock data fallbacks (needed for testing)
- ❌ Push directly to main without testing

---

## 📡 Communication Protocol

### Getting Tasks
1. Check `/usr/projects/tiger_bot_multiagent/tasks/` for `.task.json` files
2. Pick up tasks marked `status: "queued"`
3. Update task status to `"running"` when starting

### Reporting Status
1. Write status to `/usr/projects/tiger_bot_multiagent/status/<task-id>.status.json`
2. Include: steps completed, errors encountered, files modified
3. Update briefing in `/usr/projects/tiger_bot_multiagent/briefings/daily/2026-02-09/claude_code.md`

### Escalation
If blocked or unsure:
1. Write question to your briefing file
2. Agent Zero checks briefings every few hours
3. For urgent issues, note `URGENT:` prefix

---

## 🔗 Related Documents

- **Master State**: `/usr/projects/tiger_bot_multiagent/briefings/handoff/current_state.md`
- **PRD**: Original requirements document
- **Migration Blueprint**: `/usr/projects/tiger_bot_multiagent/docs/blueprints/dashboard_migration_from_html.md`

---

## ✍️ Your Status Update Section

*Write your status updates below this line:*

---

### [YYYY-MM-DD HH:MM] Status Update
**Working on:** (describe current task)  
**Completed:** (list completed items)  
**Blocked by:** (any blockers)  
**Next:** (what you'll do next)  

---

*End of Claude Code Briefing*
