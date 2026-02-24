# Claude Code Terminal Daily Briefing - 2026-02-11

## Role: Technical Implementation Specialist

## Status: 🟡 STANDBY - After Customer Delivery

## Context
Tiger Claw Scout v3.1.0 (Virtual Fleet Architecture). Agent Zero is handling immediate customer delivery (9 customers overdue). Your tasks begin AFTER bots are delivered.

## Current Infrastructure Status
| Component | Location | Status |
|-----------|----------|--------|
| Gateway | 208.113.131.83 (cloud) | ✅ Running on PM2 |
| Redis | Trash Can #1 | ✅ Running |
| Fleet Worker | Trash Can #1 | ✅ Running |
| PostgreSQL | Trash Can #1 | ✅ Running |
| Telegram Session | Trash Can #1 | ✅ Generated (needs deployment to cloud) |

## Your Tasks (Execute After Delivery)

### Task CC-001: Implement Provision Job Processor
**Priority**: 🔴 CRITICAL
**File**: `src/fleet/worker.ts`

**Current State**: Worker only handles 'inbound' message jobs. Missing 'provision' job handler.

**Required Changes**:
```typescript
// Add to worker.ts
case 'provision':
  // 1. Create Telegram bot via BotFather (using userbot.ts)
  // 2. Register webhook with Gateway
  // 3. Store bot credentials in database
  // 4. Send welcome email via Brevo
  break;
```

**Files to reference**:
- `src/provisioner/userbot.ts` - BotFather automation
- `api/integrations/brevo.ts` - Email sending
- `prisma/schema.prisma` - Database models

### Task CC-002: Fix Stripe Webhook → Provision Flow
**Priority**: 🔴 CRITICAL
**File**: `src/gateway/router.ts`

**Current State**: /stripe/webhook endpoint queues provision jobs but jobs expire.

**Required Changes**:
1. Add retry logic to provision jobs
2. Implement dead letter queue for failed provisions
3. Add Slack/email notification on provision failure

### Task CC-003: Add LINE Integration
**Priority**: 🟡 HIGH (Thailand market)
**Files**: New file `src/channels/line-bot.ts`

**Context**: 7 of 9 customers are in Thailand. LINE is dominant messaging platform there.

**Required**:
1. LINE Bot SDK integration
2. Webhook endpoint: /line/webhook
3. Message routing to Fleet Worker
4. Update provisioning to create LINE bots

### Task CC-004: Add pgvector Support
**Priority**: 🟡 HIGH (Hive Learning)
**File**: `prisma/schema.prisma`

**Current State**: HivePattern model has `embedding` field but pgvector extension not enabled.

**Required Changes**:
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector]
}
```

### Task CC-005: OpenClaw Update System
**Priority**: 🟢 NORMAL
**File**: `api/birdie-control.ts`

**Current State**: Has /update, /restart, /status, /logs endpoints.

**Verify**:
1. Test /update endpoint works
2. Add rollback capability
3. Add version tracking

## Code Standards
- TypeScript strict mode
- Vitest for tests
- Prisma for database
- BullMQ for job queues

## Repository
- **GitHub**: github.com/bbrysonelite-max/tiger-bot-scout
- **Branch**: main
- **Push directly** - no PR required

## Communication
- Report progress to: `multiagent/briefings/daily/2026-02-11/`
- Tag files with `claude_code_progress.md`

## Dependencies Installed
- telegram (gramjs) 2.22.2
- node-telegram-bot-api 0.66.0
- bullmq 5.34.5
- @prisma/client 6.3.1
- express 5.0.1
- ioredis 5.4.2
