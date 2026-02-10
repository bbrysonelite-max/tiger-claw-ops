#!/bin/bash
# =============================================================================
# TIGER BOT SCOUT — 2-CLICK CUSTOMER PROVISIONING
# =============================================================================
# Usage: ./provision-customer.sh <email> [name] [telegram_chat_id]
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
API_BASE="${API_BASE:-http://localhost:4001}"

show_help() {
    echo ""
    echo "🐯 Tiger Bot Scout — Customer Provisioning"
    echo "============================================"
    echo ""
    echo "Usage: $0 <email> [name] [telegram_chat_id]"
    echo ""
    echo "Arguments:"
    echo "  email            Customer's email (required)"
    echo "  name             Customer's name (optional, defaults to email prefix)"
    echo "  telegram_chat_id Telegram chat ID if known (optional)"
    echo ""
    echo "Examples:"
    echo "  $0 nancy@gmail.com \"Nancy Lim\""
    echo "  $0 john@example.com \"John Doe\" 123456789"
    echo ""
    echo "Environment:"
    echo "  API_BASE    API URL (default: http://localhost:4001)"
    echo ""
}

# Check arguments
if [[ $# -lt 1 || "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

EMAIL="$1"
NAME="${2:-$(echo $EMAIL | cut -d@ -f1)}"
TELEGRAM_CHAT_ID="${3:-}"

echo ""
log_info "🐯 Tiger Bot Scout — Customer Provisioning"
log_info "============================================"
log_info "Email: $EMAIL"
log_info "Name: $NAME"
[[ -n "$TELEGRAM_CHAT_ID" ]] && log_info "Telegram: $TELEGRAM_CHAT_ID"
echo ""

# Build JSON payload
JSON_PAYLOAD=$(cat <<ENDJSON
{
    "email": "$EMAIL",
    "name": "$NAME",
    "plan": "scout"$([ -n "$TELEGRAM_CHAT_ID" ] && echo ", \"telegram_chat_id\": \"$TELEGRAM_CHAT_ID\"")
}
ENDJSON
)

log_info "Calling API: POST $API_BASE/admin/provision"

# Call provisioning API
RESPONSE=$(curl -s -X POST "$API_BASE/admin/provision" \
    -H "Content-Type: application/json" \
    -d "$JSON_PAYLOAD" 2>&1)

# Check if curl succeeded
if [[ $? -ne 0 ]]; then
    log_error "API call failed. Is the server running?"
    log_error "Response: $RESPONSE"
    exit 1
fi

# Check for error in response
if echo "$RESPONSE" | grep -q '"error"'; then
    log_error "Provisioning failed!"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    exit 1
fi

log_success "Customer provisioned successfully!"
echo ""
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""
log_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_success "Customer is now active in Tiger Bot Scout!"
log_success "They should receive a welcome email shortly."
log_success "Direct Telegram link: https://t.me/TigerBotScout_bot"
log_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
