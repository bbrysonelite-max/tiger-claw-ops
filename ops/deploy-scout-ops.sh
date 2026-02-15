#!/bin/bash
# Deploy Scout Ops monitoring to the server
# This sets up enterprise-grade health monitoring with auto-recovery

set -e

SERVER="ubuntu@208.113.131.83"
SSH_KEY="/Users/brentbryson/Desktop/botcraft key pair.pem"
REMOTE_DIR="/home/ubuntu/tiger-bot-api"

echo "=== Deploying Scout Ops Monitor ==="

# Upload the monitor script
echo "Uploading scout-ops-monitor.cjs..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
  "$(dirname "$0")/scout-ops-monitor.cjs" \
  "$SERVER:$REMOTE_DIR/scout-ops-monitor.cjs"

# Upload the advanced health check script
echo "Creating server-side health monitor..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" << 'REMOTE_SCRIPT'
cd /home/ubuntu/tiger-bot-api

# Create the advanced health check script
cat > health-monitor.sh << 'EOF'
#!/bin/bash
# Scout Ops Health Monitor - Enterprise Edition
# Runs every 5 minutes via cron

LOG_FILE="/var/log/scout-ops/health.log"
LOCK_FILE="/tmp/scout-ops-health.lock"
ALERT_THRESHOLD=3  # Alert after 3 consecutive failures

# Ensure log directory exists
mkdir -p /var/log/scout-ops

# Prevent concurrent runs
if [ -f "$LOCK_FILE" ]; then
  if [ $(($(date +%s) - $(stat -c %Y "$LOCK_FILE" 2>/dev/null || echo 0))) -lt 300 ]; then
    echo "$(date -Iseconds) [SKIP] Previous check still running" >> "$LOG_FILE"
    exit 0
  fi
fi
touch "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT

log() {
  echo "$(date -Iseconds) [$1] $2" >> "$LOG_FILE"
  echo "$(date -Iseconds) [$1] $2"
}

# Track consecutive failures
FAILURE_COUNT_FILE="/tmp/scout-ops-failures"
get_failure_count() {
  cat "$FAILURE_COUNT_FILE" 2>/dev/null || echo 0
}
increment_failures() {
  echo $(($(get_failure_count) + 1)) > "$FAILURE_COUNT_FILE"
}
reset_failures() {
  echo 0 > "$FAILURE_COUNT_FILE"
}

# Check 1: Gateway API Health
check_gateway() {
  log "CHECK" "Gateway health..."
  response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://localhost:4000/health)
  if [ "$response" != "200" ]; then
    log "FAIL" "Gateway returned $response"
    return 1
  fi
  log "OK" "Gateway healthy"
  return 0
}

# Check 2: Redis Health
check_redis() {
  log "CHECK" "Redis health..."
  if ! redis-cli ping > /dev/null 2>&1; then
    log "FAIL" "Redis not responding"
    return 1
  fi
  log "OK" "Redis healthy"
  return 0
}

# Check 3: PM2 Processes
check_pm2() {
  log "CHECK" "PM2 processes..."
  gateway_status=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="tiger-gateway") | .pm2_env.status')
  worker_status=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="tiger-worker") | .pm2_env.status')

  if [ "$gateway_status" != "online" ]; then
    log "FAIL" "tiger-gateway not online (status: $gateway_status)"
    return 1
  fi
  if [ "$worker_status" != "online" ]; then
    log "FAIL" "tiger-worker not online (status: $worker_status)"
    return 1
  fi
  log "OK" "PM2 processes healthy"
  return 0
}

# Check 4: Queue depth
check_queue() {
  log "CHECK" "Queue depth..."
  queue_size=$(redis-cli LLEN bull:tiger-inbound:wait 2>/dev/null || echo 0)
  if [ "$queue_size" -gt 100 ]; then
    log "WARN" "Queue depth high: $queue_size"
    # Not a failure, just a warning
  fi
  log "OK" "Queue depth: $queue_size"
  return 0
}

# Auto-recovery: Restart services
auto_recover() {
  log "RECOVER" "Attempting auto-recovery..."

  # Restart PM2 services
  pm2 restart tiger-gateway tiger-worker 2>/dev/null

  # Wait for startup
  sleep 10

  # Verify recovery
  if check_gateway && check_pm2; then
    log "RECOVER" "Auto-recovery successful!"
    reset_failures
    return 0
  else
    log "RECOVER" "Auto-recovery FAILED"
    return 1
  fi
}

# Send Telegram alert
send_alert() {
  local message="$1"
  local bot_token="${SCOUT_OPS_BOT_TOKEN:-}"
  local chat_id="${BRENT_CHAT_ID:-5008108505}"

  if [ -z "$bot_token" ]; then
    log "WARN" "No SCOUT_OPS_BOT_TOKEN - cannot send alert"
    return
  fi

  curl -s -X POST "https://api.telegram.org/bot${bot_token}/sendMessage" \
    -H "Content-Type: application/json" \
    -d "{\"chat_id\": \"$chat_id\", \"text\": \"🚨 Scout Ops Alert\\n\\n$message\", \"parse_mode\": \"Markdown\"}" \
    > /dev/null

  log "ALERT" "Sent Telegram alert"
}

# Main health check
main() {
  log "START" "=== Scout Ops Health Check ==="

  all_healthy=true

  check_gateway || all_healthy=false
  check_redis || all_healthy=false
  check_pm2 || all_healthy=false
  check_queue

  if [ "$all_healthy" = true ]; then
    log "OK" "All systems healthy"
    reset_failures
  else
    increment_failures
    failures=$(get_failure_count)
    log "FAIL" "Health check failed (consecutive: $failures)"

    # Attempt auto-recovery
    auto_recover

    # Alert if threshold exceeded
    if [ "$failures" -ge "$ALERT_THRESHOLD" ]; then
      send_alert "System unhealthy for $failures consecutive checks. Auto-recovery attempted."
    fi
  fi

  log "END" "=== Health Check Complete ==="
}

main
EOF

chmod +x health-monitor.sh

# Update crontab with the new health monitor
(crontab -l 2>/dev/null | grep -v 'health-check.sh\|health-monitor.sh') | crontab -
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/ubuntu/tiger-bot-api/health-monitor.sh >> /var/log/scout-ops/cron.log 2>&1") | crontab -

# Create log rotation config
sudo tee /etc/logrotate.d/scout-ops > /dev/null << 'LOGROTATE'
/var/log/scout-ops/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 ubuntu ubuntu
}
LOGROTATE

# Create log directory
sudo mkdir -p /var/log/scout-ops
sudo chown ubuntu:ubuntu /var/log/scout-ops

echo "Scout Ops health monitor deployed!"
crontab -l | grep health-monitor
REMOTE_SCRIPT

echo ""
echo "=== Scout Ops Deployed Successfully ==="
echo "Health checks run every 5 minutes"
echo "Logs at: /var/log/scout-ops/"
echo "Auto-recovery enabled"
echo ""
