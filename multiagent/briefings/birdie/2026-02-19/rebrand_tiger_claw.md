# BIRDIE BRIEFING — Tiger Bot → Tiger Claw Rebrand

**Date:** 2026-02-19
**From:** Manus (Frontend Agent)
**Priority:** HIGH
**Status:** Website rebrand COMPLETE — Broader repo rebrand NEEDED

---

## What Happened

The product has been officially renamed from **Tiger Bot** to **Tiger Claw**. The new domain is **tigerclaw.io**. Manus has completed the rebrand across all website files in `flywheel-website/` (committed and pushed to `main`). Zero "Tiger Bot" references remain in the website code.

## What Birdie Needs To Do

There are approximately **310 remaining "Tiger Bot" references** across **80+ files** in the broader repo that need updating. These are in backend code, documentation, specs, briefings, tests, and configuration files.

### Rename Rules

| Old Term | New Term |
|----------|----------|
| Tiger Bot | Tiger Claw |
| TigerBot | TigerClaw |
| tiger-bot | tiger-claw |
| tiger_bot | tiger_claw |
| tigerbot | tigerclaw |
| thegoods.ai | tigerclaw.io |

### Files That Need Updating (by category)

**Core Config & Docs (do these first):**
- `README.md`
- `CLAUDE.md`
- `BIRDIE.md`
- `RULES.md`
- `ARCHITECTURE_SUMMARY.md`
- `CHANGELOG.md`
- `HANDOFF.md`
- `LAUNCH.md`
- `VERSION.md`
- `package.json` (name field, description)

**Backend Source Code:**
- `api/birdie-control.ts`
- `api/integrations/brevo.ts`
- `api/provisioning.ts`
- `api/server.ts`
- `api/telegram-bot.ts`
- `src/fleet/*.ts` (agent-brain, conversation-engine, web-search, worker, prospect-scheduler)
- `src/channels/*.ts` (channel-router, line-channel, sms-channel, web-channel)
- `src/enrichment/*.ts`
- `src/gateway/*.ts`
- `src/provisioner/*.ts`
- `src/monitoring/*.ts`
- `src/shared/crypto.ts`
- `provision-all-bots.ts`
- `serve.js`
- `ecosystem.config.js`

**Specs & Docs:**
- `specs/*.md` and `specs/v3/*.md`
- `docs/*.md`
- `ops/*.md` and `ops/*.cjs`

**Tests:**
- `tests/*.ts`
- `tests/mocks/data.ts`
- `vitest.config.ts`

**Types:**
- `types/dashboard.ts`
- `types/v1/index.ts`

**Website (legacy HTML):**
- `website/dashboard.html`
- `website/index.html`
- `website/claim.html`

**Briefings & Marketing:**
- `multiagent/briefings/**/*.md`
- `multiagent/docs/**/*.md`
- `multiagent/tasks/**/*.json`
- `marketing/youtube-script-v1.md`

### Important Notes

1. The repo name `tiger-bot-scout` itself may need renaming on GitHub — that is Brent's call.
2. The `flywheel-website/` directory is ALREADY DONE — do not touch those files.
3. Bot provisioning code should name new bots with `Claw_` prefix instead of `Tiger_` prefix.
4. Email templates should reference "Tiger Claw" and "tigerclaw.io".
5. Any Telegram bot display names should say "Tiger Claw" not "Tiger Bot".

### Suggested Approach

```bash
# From repo root, find all remaining references (excluding flywheel-website and node_modules):
grep -rl "Tiger Bot" --include="*.md" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.cjs" --include="*.html" --include="*.json" . | grep -v node_modules | grep -v flywheel-website

# Then use sed for bulk rename (test with --dry-run first):
# sed -i 's/Tiger Bot/Tiger Claw/g' <file>
# sed -i 's/TigerBot/TigerClaw/g' <file>
# sed -i 's/tiger-bot/tiger-claw/g' <file>
# sed -i 's/tiger_bot/tiger_claw/g' <file>
```

### Verification

After renaming, run:
```bash
grep -r "Tiger Bot" . --include="*.md" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.cjs" --include="*.html" --include="*.json" | grep -v node_modules | grep -v flywheel-website | wc -l
# Should return 0
```

---

## What Manus Already Completed

All files in `flywheel-website/` have been rebranded:
- `Home.tsx` — main educational/reference page (all 11 sections)
- `Launch.tsx` — promotional landing page ($149/mo, Tiger Claw Pro)
- `OnboardingDemo.tsx` — interactive 5-stage demo walkthrough
- `RegionalIntelligence.tsx` — 5-region platform intelligence
- `FlywheelExplainer.tsx` — interactive flywheel diagram
- `ProvisioningPipeline.tsx` — provisioning flow visualization
- `WebhookSetupGuide.tsx` — Stripe/Stan Store webhook guide
- `App.tsx` — routing and page title
- `index.html` — meta tags, page title, favicon
- Welcome email template (in templates/)

Commit: `4589aad` on `main` — "rebrand: Tiger Bot → Tiger Claw (tigerclaw.io) across all pages, components, email, provisioning"
