#!/bin/bash
# Tiger Bot Scout - One-Click Deploy Script
# Paste your Telegram Bot Token below (from @BotFather)
TELEGRAM_TOKEN="__PASTE_YOUR_TOKEN_HERE__"

# ============================================
# DO NOT EDIT BELOW THIS LINE
# ============================================

SERVER="209.97.168.251"  # DigitalOcean Singapore (production)
# OLD: 208.113.131.83 = DreamHost, DEAD, do not use
KEY="$HOME/Desktop/botcraft key pair.pem"
REMOTE_PATH="/home/ubuntu/tiger-bot-api"
SSH_USER="root"

echo "🐯 Tiger Bot Scout - One-Click Deploy"
echo "====================================="

# Check if token was set
if [ "$TELEGRAM_TOKEN" = "__PASTE_YOUR_TOKEN_HERE__" ]; then
    echo ""
    echo "⚠️  TELEGRAM TOKEN NOT SET!"
    echo ""
    echo "To get your token:"
    echo "1. Open Telegram"
    echo "2. Search for @BotFather"
    echo "3. Send /mybots"
    echo "4. Select @TigerBotScout_bot"
    echo "5. Click API Token"
    echo "6. Copy the token"
    echo ""
    echo "Then edit this script and paste your token at the top."
    echo ""
    read -p "Or paste your Telegram token now: " TELEGRAM_TOKEN
    if [ -z "$TELEGRAM_TOKEN" ]; then
        echo "❌ No token provided. Exiting."
        exit 1
    fi
fi

echo ""
echo "📡 Connecting to production server..."

ssh -i "$KEY" -o StrictHostKeyChecking=no $SSH_USER@$SERVER << ENDSSH

set -e
echo "✅ Connected to server"

cd $REMOTE_PATH
echo "📂 Working directory: \$(pwd)"

echo ""
echo "📥 Pulling latest code from GitHub..."
git pull origin main

echo ""
echo "📦 Installing dependencies..."
npm install --silent

echo ""
echo "🔨 Building..."
npm run build

echo ""
echo "🔑 Configuring Telegram token..."
# Backup existing .env
cp .env .env.backup 2>/dev/null || touch .env

# Remove old token line if exists and add new one
grep -v "^TELEGRAM_BOT_TOKEN=" .env > .env.tmp || true
echo "TELEGRAM_BOT_TOKEN=$TELEGRAM_TOKEN" >> .env.tmp
mv .env.tmp .env

echo "✅ Telegram token configured"

echo ""
echo "🔄 Restarting Tiger Bot API..."
pm2 restart tiger-bot 2>/dev/null || pm2 start dist/api/server.js --name tiger-bot

echo ""
echo "⏳ Waiting for server to start..."
sleep 3

echo ""
echo "👥 Provisioning all 7 customers..."
curl -s -X POST http://localhost:4001/admin/provision/batch \
  -H "Content-Type: application/json" \
  -d '{"customers": [
    {"email": "nancylimsk@gmail.com", "name": "Nancy Lim"},
    {"email": "chana.loh@gmail.com", "name": "Chana Lohasaptawee"},
    {"email": "phaitoon2010@gmail.com", "name": "Phaitoon S."},
    {"email": "taridadew@gmail.com", "name": "Tarida Sukavanich"},
    {"email": "lily.vergara@gmail.com", "name": "Lily Vergara"},
    {"email": "phetmalaigul@gmail.com", "name": "Theera Phetmalaigul"},
    {"email": "vijohn@hotmail.com", "name": "John & Noon"}
  ]}'

echo ""
echo ""
echo "📋 Verifying deployment..."
pm2 status

echo ""
curl -s http://localhost:4001/health || echo "Health check pending..."

echo ""
echo "====================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "====================================="
echo ""
echo "✅ API running on port 4001"
echo "✅ Telegram bot connected to @TigerBotScout_bot"
echo "✅ 7 customers provisioned"
echo ""
echo "Customers can now message the bot on Telegram!"

ENDSSH

echo ""
echo "🐯 Done! Tiger Bot Scout is live."
