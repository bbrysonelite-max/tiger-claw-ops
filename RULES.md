# Tiger Claw Scout — Engineering Rules

**The mission is 100% uptime. Not 99%. 100%.**

If Amazon ran at 99% uptime, that would be 3.65 days of downtime per year. That is not a standard. That is a failure. Every minute this system is down, a paying customer's bot is silent.

---

## Rule 1: Always Use a Feature Branch

**NEVER commit directly to `main`.**

```bash
# Every piece of work starts here:
git checkout -b feat/descriptive-name   # new features
git checkout -b fix/descriptive-name    # bug fixes
git checkout -b hotfix/descriptive-name # emergency fixes only

# Work, commit, push
git push origin feat/descriptive-name

# Open a PR on GitHub. Merge to main only after review.
```

`main` is production. `main` must always be deployable. `main` must always be stable.

---

## Rule 2: Zero-Downtime Deployments Only

**NEVER use `pm2 restart`. Always use `pm2 reload`.**

- `pm2 restart` = hard kill → new process. Gap in service. Jobs dropped.
- `pm2 reload` = graceful reload. Old process finishes current jobs. New process starts. Zero gap.

```bash
# Wrong:
pm2 restart tiger-worker

# Right:
pm2 reload tiger-worker
```

For the API server (`tiger-bot`), it handles long-polling Telegram. A hard restart drops all in-flight connections. Use `pm2 reload` and verify the restart count does not increment unexpectedly.

---

## Rule 3: Migrations Before Code, Always

Database schema changes must be applied **before** new code that depends on them is deployed.

```
1. Apply DB migration (ALTER TABLE / CREATE TABLE)
2. Verify migration succeeded
3. Deploy new code
4. Reload services
```

Never deploy code and migrate simultaneously. If the migration fails, the old code still works. If you deploy new code first, the system breaks immediately.

---

## Rule 4: Test Before You Touch Production

1. Build passes locally: `npm run build` — zero errors
2. Changed endpoints tested against real data (not mock)
3. Error logs checked: `pm2 logs --err` shows nothing new after deploy
4. Smoke test the changed functionality with a real request

---

## Rule 5: No Direct SSH Edits to Production Files

All changes go through git. No `nano`, `vi`, or `sed` directly on server files.

If a file is edited on the server directly, it will be overwritten on the next `git pull` and the change is lost — and unreviewed.

---

## Rule 6: Post to Ops Center on Every Deploy

Before and after any production deploy, post a bulletin:

```bash
# Before:
./ops/post-bulletin.sh claude-code "Claude Code" update high "Deploying: feat/invite-system" "Starting deploy of invite gifting feature to production"

# After:
./ops/post-bulletin.sh claude-code "Claude Code" complete normal "Deployed: feat/invite-system" "Invite system live. Verified endpoints. All services healthy."
```

This keeps Birdie and Brent informed and creates an audit trail.

---

## Rule 7: Hotfixes Are Still Branched

Even in an emergency, branch first.

```bash
git checkout -b hotfix/provision-worker-crash
# fix
git push origin hotfix/provision-worker-crash
# PR → merge to main → deploy
```

The only exception: if the production server is actively down and every second counts, fix inline, but immediately create a matching commit to main with the exact same change afterward.

---

## Incident Log

| Date | What Happened | Agent | Impact |
|------|--------------|-------|--------|
| 2026-02-17 | Deployed SQL referencing non-existent columns; system fell back to mock data | Claude Opus 4.5 | Customers got no bot responses for hours |
| 2026-02-18 | Committed directly to `main`; used `pm2 restart` (hard kill) on live workers | Claude Sonnet 4.6 | Service gaps during worker restarts |

Every incident goes in this log. No exceptions. Own it.
