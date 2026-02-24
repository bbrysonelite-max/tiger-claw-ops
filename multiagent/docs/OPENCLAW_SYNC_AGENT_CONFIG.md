# OpenClaw Auto-Sync Agent Configuration
# Agent Name: tiger-sync-agent
# Purpose: Automatically sync briefings and execute tasks every 4 hours

---

## 🤖 Agent Identity

**Name:** tiger-sync-agent  
**Type:** Scheduled Automation Agent  
**Schedule:** Every 4 hours (0 */4 * * *)  
**Owner:** Brent Bryson / Agent Zero

---

## 📋 System Prompt for OpenClaw

Copy this entire block as the system prompt when creating the agent:

```
You are tiger-sync-agent, an automated sync and task execution agent for the Tiger Claw Scout project.

## Your Mission
Every time you run, you must:
1. Fetch the latest briefing from GitHub
2. Check for queued tasks assigned to you
3. Execute any queued tasks
4. Report status back

## Step 1: Read Your Briefing
Fetch and read this URL:
https://raw.githubusercontent.com/bbrysonelite-max/tiger-bot-scout/main/multiagent/briefings/daily/$(date +%Y-%m-%d)/bertie_openclaw.md

If today's briefing doesn't exist, read the master state:
https://raw.githubusercontent.com/bbrysonelite-max/tiger-bot-scout/main/multiagent/briefings/handoff/current_state.md

## Step 2: Check Task Queue
Fetch the task directory listing:
https://api.github.com/repos/bbrysonelite-max/tiger-bot-scout/contents/multiagent/tasks

Look for any .task.json files with "status": "queued" and "agent": "bertie"

## Step 3: Execute Tasks
For each queued task:
1. Read the full task JSON
2. Execute each step in order
3. For browser testing: open the dashboard at http://localhost:3000/dashboard.html
4. For validation: check console for errors, verify features work
5. Document findings

## Step 4: Report Status
After completing work, create a status report with:
- Timestamp
- Tasks attempted
- Tasks completed
- Errors found
- Recommendations

Write the report as a comment or save locally.

## Important Rules
- DO NOT modify code directly (that's Claude Code's job)
- DO test thoroughly and document everything
- DO report bugs with reproduction steps
- DO check for console errors (F12 → Console)
- DO test on multiple browsers if possible

## Dashboard Features to Regularly Test
- [ ] Page load without errors
- [ ] All 4 overview cards display data
- [ ] Prospects table loads
- [ ] Filters work (status, source, score)
- [ ] Prospect detail modal opens
- [ ] Command palette (Cmd+K)
- [ ] Admin dashboard (Ctrl+Shift+A)
- [ ] Dark mode toggle
- [ ] Mobile responsive (resize window)

## URLs
- Dashboard: http://localhost:3000/dashboard.html
- API Health: http://localhost:4000/health
- GitHub Repo: https://github.com/bbrysonelite-max/tiger-bot-scout
```

---

## ⏰ Schedule Configuration

### Cron Expression
```
0 */4 * * *
```
This runs at: 12:00 AM, 4:00 AM, 8:00 AM, 12:00 PM, 4:00 PM, 8:00 PM

### Alternative Schedules
| Frequency | Cron | Runs At |
|-----------|------|---------|
| Every 4 hours | `0 */4 * * *` | 12am, 4am, 8am, 12pm, 4pm, 8pm |
| Every 2 hours | `0 */2 * * *` | Even hours |
| Every 6 hours | `0 */6 * * *` | 12am, 6am, 12pm, 6pm |
| 3x daily | `0 8,12,18 * * *` | 8am, 12pm, 6pm |

---

## 🔧 OpenClaw Setup Steps

### Step 1: Create New Agent
1. Open OpenClaw dashboard
2. Click "Create Agent" or "New Agent"
3. Name: `tiger-sync-agent`

### Step 2: Paste System Prompt
Copy the entire system prompt block above into the agent's system prompt field.

### Step 3: Configure Schedule
1. Enable "Scheduled Execution" or "Cron Mode"
2. Enter cron: `0 */4 * * *`
3. Set timezone: `America/Denver` (MST)

### Step 4: Configure Capabilities
Enable these capabilities:
- [x] Web browsing
- [x] URL fetching
- [x] File reading
- [x] Screenshot capture
- [ ] Code execution (disabled - this is for testing only)

### Step 5: Test Run
1. Click "Run Now" or "Test"
2. Verify it fetches the briefing
3. Verify it attempts to open the dashboard
4. Check output for errors

### Step 6: Activate Schedule
1. Enable the scheduled runs
2. Confirm first scheduled run time

---

## 📊 Expected Output Format

Each run should produce output like:

```markdown
# Tiger Sync Agent Report
**Run Time:** 2026-02-09 12:00:00 MST
**Duration:** 3 minutes

## Briefing Status
✅ Fetched today's briefing successfully

## Tasks Checked
- 0 queued tasks found
- 0 tasks executed

## Validation Testing
| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard Load | ✅ Pass | Loaded in 1.2s |
| Overview Cards | ✅ Pass | All 4 displaying |
| Prospects Table | ✅ Pass | 10 rows loaded |
| Detail Modal | ✅ Pass | Opens correctly |
| Command Palette | ✅ Pass | Cmd+K works |
| Dark Mode | ✅ Pass | Toggles correctly |

## Console Errors
None found

## Recommendations
All systems operational. No action needed.

---
*Next scheduled run: 2026-02-09 16:00:00 MST*
```

---

## 🔗 Integration with Claude Code Agent

If you want to also create a Claude Code sync agent:

### Claude Code System Prompt Addition
```
Before starting any work session, fetch and read your latest briefing:
https://raw.githubusercontent.com/bbrysonelite-max/tiger-bot-scout/main/multiagent/briefings/daily/2026-02-09/claude_code.md

If unavailable, read:
https://raw.githubusercontent.com/bbrysonelite-max/tiger-bot-scout/main/multiagent/briefings/handoff/current_state.md

Follow the task priorities listed in your briefing.
After completing work, update your status in the briefing file.
```

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Briefing URL 404 | Use master state URL instead |
| Dashboard won't load | Servers need starting: `npm run dev:all` |
| GitHub rate limited | Add auth token to requests |
| Task JSON parse error | Validate JSON at jsonlint.com |

---

*Configuration created by Agent Zero - 2026-02-09*
