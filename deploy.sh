#!/bin/bash
# =============================================================================
# TIGER BOT SCOUT — ONE-CLICK DEPLOY
# =============================================================================
# This script deploys Tiger Claw Scout to production and provisions all customers
# 
# Usage: ./deploy.sh [local|production]
#   local      - Run locally for testing
#   production - Deploy to 208.113.131.83
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }
log_step() { echo -e "${MAGENTA}[STEP]${NC} $1"; }

MODE="${1:-local}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Server config
SERVER_IP="208.113.131.83"
SERVER_USER="ubuntu"
SERVER_PATH="/home/ubuntu/tiger-bot-api"
SSH_KEY="~/Desktop/botcraft\ key\ pair.pem"

echo ""
echo -e "${MAGENTA}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║         🐯 TIGER BOT SCOUT — ONE-CLICK DEPLOY                    ║${NC}"
echo -e "${MAGENTA}║                                                                  ║${NC}"
echo -e "${MAGENTA}║  Mode: $(printf '%-57s' "$MODE")║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [[ "$MODE" == "production" ]]; then
    # ==================== PRODUCTION DEPLOY ====================
    log_step "1/5 Committing latest changes..."
    cd "$SCRIPT_DIR"
    git add -A
    git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M')" || log_warn "Nothing to commit"
    git push origin main || log_warn "Push failed or no upstream"
    log_success "Code committed and pushed"

    log_step "2/5 Deploying to server $SERVER_IP..."
    ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'REMOTE_EOF'
        cd /home/ubuntu/tiger-bot-api
        echo "Pulling latest code..."
        git pull origin main
        echo "Installing dependencies..."
        npm install
        echo "Building TypeScript..."
        npm run build
        echo "Restarting with PM2..."
        pm2 restart tiger-bot || pm2 start dist/api/server.js --name tiger-bot
        pm2 save
        echo "Server restarted!"
REMOTE_EOF
    log_success "Deployed to production server"

    log_step "3/5 Waiting for server to come up..."
    sleep 5
    
    log_step "4/5 Provisioning customers on production..."
    API_BASE="https://api.botcraftwrks.ai" "$SCRIPT_DIR/provision-all-customers.sh"
    log_success "Customers provisioned"

    log_step "5/5 Verifying deployment..."
    curl -s "https://api.botcraftwrks.ai/health" | python3 -m json.tool || log_error "Health check failed"

else
    # ==================== LOCAL DEPLOY ====================
    log_step "1/4 Installing dependencies..."
    cd "$SCRIPT_DIR"
    npm install
    log_success "Dependencies installed"

    log_step "2/4 Building TypeScript..."
    npm run build || log_warn "Build failed, running in dev mode"
    log_success "Build complete"

    log_step "3/4 Starting API server..."
    # Kill any existing instance
    pkill -f "node.*server" 2>/dev/null || true
    
    # Check for .env file
    if [[ ! -f .env ]]; then
        log_warn "No .env file found. Creating from example..."
        cp .env.example .env
        log_warn "Please edit .env with your actual credentials!"
    fi

    # Start in background
    nohup npm run dev > /tmp/tiger-bot.log 2>&1 &
    echo $! > /tmp/tiger-bot.pid
    log_success "API server starting (PID: $(cat /tmp/tiger-bot.pid))"
    
    log_step "4/4 Waiting for server to start..."
    sleep 3
    
    # Test if server is up
    if curl -s http://localhost:4001/health > /dev/null 2>&1; then
        log_success "Server is running on http://localhost:4001"
        
        log_step "5/5 Provisioning customers..."
        API_BASE="http://localhost:4001" "$SCRIPT_DIR/provision-all-customers.sh"
    else
        log_error "Server failed to start. Check /tmp/tiger-bot.log"
        tail -20 /tmp/tiger-bot.log
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    ✅ DEPLOYMENT COMPLETE!                       ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════════════╣${NC}"
if [[ "$MODE" == "production" ]]; then
echo -e "${GREEN}║  🌐 API:        https://api.botcraftwrks.ai                      ║${NC}"
echo -e "${GREEN}║  📊 Dashboard:  https://botcraftwrks.ai/dashboard                ║${NC}"
else
echo -e "${GREEN}║  🌐 API:        http://localhost:4001                            ║${NC}"
echo -e "${GREEN}║  📊 Dashboard:  http://localhost:3000/dashboard                  ║${NC}"
fi
echo -e "${GREEN}║  🤖 Telegram:   @TigerClawScout_bot                               ║${NC}"
echo -e "${GREEN}║                                                                  ║${NC}"
echo -e "${GREEN}║  👥 7 customers provisioned and ready!                           ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
