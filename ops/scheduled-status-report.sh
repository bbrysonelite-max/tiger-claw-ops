#!/bin/bash
# Scheduled Status Report - Run via cron
# Crontab example: 0 8 * * * /path/to/scheduled-status-report.sh birdie
#
# This posts a daily status summary to the Ops Center

API_BASE="${API_BASE:-https://api.botcraftwrks.ai}"
AGENT_ID="${1:-scout-ops}"
AGENT_NAME="${2:-Scout Ops}"

# Gather system stats
HEALTH=$(curl -s "$API_BASE/health" 2>/dev/null)
UPTIME=$(echo "$HEALTH" | jq -r '.uptime // "unknown"')
PROJECT_STATE=$(curl -s "$API_BASE/ops/project-state" 2>/dev/null)
LEADS=$(echo "$PROJECT_STATE" | jq -r '.live_stats.leads // 0')
TENANTS=$(echo "$PROJECT_STATE" | jq -r '.live_stats.tenants // 0')
BOTS=$(echo "$PROJECT_STATE" | jq -r '.live_stats.bots // 0')

# Check integrations
INTEGRATIONS=$(echo "$PROJECT_STATE" | jq -r '.live_stats.integrations | to_entries | map(select(.value == true) | .key) | join(", ")')

# Build status report
STATUS_CONTENT="**Daily System Status**

📊 **Stats:**
- Uptime: $UPTIME
- Active Tenants: $TENANTS
- Total Leads: $LEADS
- Active Bots: $BOTS

🔌 **Integrations Online:** $INTEGRATIONS

⏰ Report generated: $(date '+%Y-%m-%d %H:%M %Z')"

# Post to bulletin board
curl -s -X POST "$API_BASE/ops/bulletins" \
  -H "Content-Type: application/json" \
  -d "{
    \"agent_id\": \"$AGENT_ID\",
    \"agent_name\": \"$AGENT_NAME\",
    \"bulletin_type\": \"update\",
    \"priority\": \"normal\",
    \"title\": \"Daily Status Report - $(date '+%Y-%m-%d')\",
    \"content\": $(echo "$STATUS_CONTENT" | jq -Rs .),
    \"expires_in_hours\": 24
  }" | jq -r 'if .success then "✅ Daily report posted" else "❌ Error: \(.error)" end'
