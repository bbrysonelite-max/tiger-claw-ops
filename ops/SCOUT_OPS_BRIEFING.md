# Scout Ops - Customer Service Layer

**Purpose:** Keep Tiger Bot Scout running 24/7 so Brent can focus on sales.

---

## Scout Ops Responsibilities

### 1. System Health (Every 5 Minutes)
- ✅ Check API Gateway (api.botcraftwrks.ai)
- ✅ Check Redis queue health
- ✅ Check PM2 processes (tiger-gateway, tiger-worker)
- ✅ Monitor queue depth for backlogs
- ✅ Auto-restart services if unhealthy
- ✅ Alert Brent via Telegram only if auto-recovery fails

### 2. API Key Management
- ✅ Validate OpenAI API key daily
- ✅ Validate Gemini fallback key daily
- ⏳ Track usage/billing (coming soon)
- ⏳ Auto-rotate keys before expiration (coming soon)

### 3. Customer Bot Health
- ✅ Verify all 10 bot webhooks are configured
- ✅ Track which customers have active chat_ids
- ⏳ Alert if a customer bot stops responding (coming soon)
- ⏳ Weekly report on bot usage (coming soon)

### 4. Brain Health (AI System)
- ✅ Monitor OpenAI response times
- ✅ Auto-fallback to Gemini if OpenAI fails
- ✅ Log all AI errors for debugging
- ⏳ Quality monitoring (coming soon)

---

## Deployment

Run from local machine:
```bash
chmod +x ops/deploy-scout-ops.sh
./ops/deploy-scout-ops.sh
```

This will:
1. Upload health monitor to server
2. Set up 5-minute cron job
3. Configure log rotation
4. Enable auto-recovery

---

## Monitoring Locations

| Item | Location |
|------|----------|
| Health Logs | `/var/log/scout-ops/health.log` |
| Cron Logs | `/var/log/scout-ops/cron.log` |
| Latest Check | `/tmp/scout-ops-logs/latest-check.json` |
| PM2 Logs | `pm2 logs` |

---

## Alert Flow

```
Health Check Fails
       ↓
Auto-Recovery Attempt (restart PM2)
       ↓
Wait 10 seconds
       ↓
Re-check Health
       ↓
If still failing after 3 checks → Alert Brent via Telegram
```

---

## Environment Variables Needed

On server (`/home/ubuntu/tiger-bot-api/.env`):
```
OPENAI_API_KEY=sk-...
FALLBACK_GEMINI_KEY=AI...
SCOUT_OPS_BOT_TOKEN=...     # Optional: for Telegram alerts
BRENT_CHAT_ID=5008108505    # Brent's Telegram chat ID
```

---

## What Brent Sees

**When everything is healthy:** Nothing. Silence is golden.

**When there's a problem:**
```
🚨 Scout Ops Alert

System unhealthy for 3 consecutive checks. Auto-recovery attempted.

2026-02-15T13:30:00.000Z
```

---

## Integration with Agent Zero

Scout Ops reports to Agent Zero for:
- Daily health summaries
- Escalation of persistent issues
- Coordination with other agents (Birdie, Manus)

Agent Zero can request Scout Ops to:
- Run immediate health check
- Force restart services
- Generate diagnostic report

---

## Coming Soon

1. **Billing Alerts** - Warn when OpenAI credits low
2. **Customer Dashboards** - Show bot usage stats
3. **Proactive Outreach** - Ping inactive customers
4. **Performance Reports** - Weekly summaries for Brent

---

*Scout Ops: The silent guardian of Tiger Bot Scout.*
