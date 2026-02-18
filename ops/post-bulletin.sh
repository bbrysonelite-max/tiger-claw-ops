#!/bin/bash
# Post to Ops Center Bulletin Board
# Usage: ./post-bulletin.sh <agent_id> <agent_name> <type> <priority> <title> <content>
#
# Examples:
#   ./post-bulletin.sh birdie "Birdie" update normal "Task complete" "Finished sending customer emails"
#   ./post-bulletin.sh claude-code "Claude Code" blocker urgent "Build failing" "TypeScript errors in conversation-engine.ts"

API_BASE="${API_BASE:-https://api.botcraftwrks.ai}"

AGENT_ID="${1:-birdie}"
AGENT_NAME="${2:-Birdie}"
TYPE="${3:-update}"        # update, task, blocker, question, complete
PRIORITY="${4:-normal}"    # normal, high, urgent
TITLE="${5:-Status update}"
CONTENT="${6:-No details provided}"

curl -s -X POST "$API_BASE/ops/bulletins" \
  -H "Content-Type: application/json" \
  -d "{
    \"agent_id\": \"$AGENT_ID\",
    \"agent_name\": \"$AGENT_NAME\",
    \"bulletin_type\": \"$TYPE\",
    \"priority\": \"$PRIORITY\",
    \"title\": \"$TITLE\",
    \"content\": \"$CONTENT\"
  }" | jq -r 'if .success then "✅ Posted: \(.bulletin.title)" else "❌ Error: \(.error)" end'
