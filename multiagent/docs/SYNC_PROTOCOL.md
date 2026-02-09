# Multi-Agent Sync Protocol
> **Version:** 1.0  
> **Created:** 2026-02-09  
> **Owner:** Agent Zero

---

## 🎯 Purpose

This protocol ensures all agents (Agent Zero, Claude Code, Bertie/OpenClaw) stay synchronized without requiring the human (Brent) to manually relay information between them.

---

## 📁 Directory Structure

```
/usr/projects/tiger_bot_multiagent/
├── briefings/
│   ├── daily/
│   │   └── YYYY-MM-DD/
│   │       ├── agent_zero.md       # Orchestrator status
│   │       ├── claude_code.md       # Implementation agent status
│   │       └── bertie_openclaw.md   # Automation agent status
│   ├── handoff/
│   │   └── current_state.md         # Single source of truth
│   └── templates/
│       └── daily_briefing_template.md
├── tasks/
│   └── *.task.json                  # Task queue for agents
├── status/
│   └── *.status.json                # Task completion status
└── docs/
    └── blueprints/                  # Architecture docs
```

---

## ⏰ Sync Schedule

### Morning Sync (08:00 MST)
**Owner:** Agent Zero

1. Create new daily folder: `briefings/daily/YYYY-MM-DD/`
2. Write comprehensive status for all agents
3. Update `handoff/current_state.md` with overnight changes
4. Create task files for the day

### Midday Check (12:00 MST)
**Owner:** All Agents

1. Each agent updates their briefing file
2. Report progress on assigned tasks
3. Flag any blockers
4. Agent Zero reviews and adjusts priorities

### Evening Wrap (18:00 MST)
**Owner:** Agent Zero

1. Summarize day's accomplishments
2. Update `current_state.md`
3. Prepare overnight task queue
4. Brief human on key items needing attention

### Ad-Hoc Updates
**Owner:** Working Agent

- Immediately after completing a significant task
- When encountering a blocker
- When needing input from another agent

---

## 📝 Briefing Content Requirements

### Minimum Required Fields

```markdown
## Status: [date time]
**Working on:** Current task
**Completed:** List of done items
**Blocked by:** Any blockers
**Next:** What's coming up
```

### Full Briefing Template
See: `templates/daily_briefing_template.md`

---

## 🔄 Agent Communication Flow

```
┌─────────────────┐     writes     ┌─────────────────┐
│   Agent Zero    │───────────────►│    Briefings    │
│  (Orchestrator) │                │   & Tasks       │
└────────┬────────┘                └────────┬────────┘
         │                                  │
         │ coordinates                reads │
         │                                  │
         ▼                                  ▼
┌─────────────────┐                ┌─────────────────┐
│   Claude Code   │                │     Bertie      │
│ (Implementation)│                │   (Automation)  │
└────────┬────────┘                └────────┬────────┘
         │                                  │
         │ writes status                    │ writes status
         │                                  │
         └─────────────►┌───────┐◄──────────┘
                        │Status │
                        │ Files │
                        └───┬───┘
                            │
                            ▼
                     ┌─────────────┐
                     │ Agent Zero  │
                     │   Reviews   │
                     └─────────────┘
```

---

## 📋 Task Assignment Protocol

### Creating Tasks (Agent Zero)

1. Write task file: `tasks/<task-id>.task.json`
2. Include: description, steps, target agent, priority
3. Notify in daily briefing

### Picking Up Tasks (Claude Code / Bertie)

1. Read daily briefing for priorities
2. Check `tasks/` folder for `status: "queued"`
3. Update task status to `"running"`
4. Execute task
5. Write completion to `status/<task-id>.status.json`
6. Update briefing with results

---

## 🚨 Escalation Protocol

### Level 1: Agent-to-Agent
- Write question in briefing file with `QUESTION:` prefix
- Other agents check briefings during sync times

### Level 2: Urgent
- Write `URGENT:` prefix in briefing
- Agent Zero checks more frequently for urgent items

### Level 3: Human Required
- Write `HUMAN NEEDED:` prefix
- Agent Zero aggregates and presents to Brent

---

## ✅ Checklist for Each Agent

### Before Starting Work
- [ ] Read `handoff/current_state.md`
- [ ] Read your specific briefing in `daily/YYYY-MM-DD/`
- [ ] Check `tasks/` for assigned work

### During Work
- [ ] Update briefing every 2-4 hours
- [ ] Flag blockers immediately
- [ ] Document significant decisions

### After Completing Work
- [ ] Write status file for task
- [ ] Update briefing with summary
- [ ] Commit and push code changes (if applicable)

---

## 📊 Metrics to Track

| Metric | Target | Owner |
|--------|--------|-------|
| Briefing freshness | < 4 hours | All agents |
| Task completion rate | > 80% | Agent Zero tracks |
| Blocker resolution | < 24 hours | Agent Zero |
| Test pass rate | > 90% | Claude Code |

---

*This protocol eliminates the human bottleneck by enabling agents to communicate asynchronously through shared files.*
