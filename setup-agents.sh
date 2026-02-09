#!/bin/bash
# Tiger Bot Scout - One-Click Agent Setup
# Run this on your Mac Pro

set -e
echo "🐯 Tiger Bot Scout - Agent Setup"
echo "================================"

# Find the repo
REPO=$(find ~ /Users -name "tiger-bot-scout" -type d 2>/dev/null | grep -v node_modules | head -1)
if [[ -z "$REPO" ]]; then
    echo "❌ tiger-bot-scout repo not found. Cloning..."
    cd ~/Desktop
    git clone https://github.com/bbrysonelite-max/tiger-bot-scout.git
    REPO=~/Desktop/tiger-bot-scout
fi

echo "📁 Found repo: $REPO"
cd "$REPO"
git pull

echo "📂 Creating directories..."
sudo mkdir -p /Users/Shared/openclaw/{agents,logs,pids}
sudo chown -R $(whoami) /Users/Shared/openclaw

echo "🔧 Checking jq..."
which jq || brew install jq

echo "🚀 Starting agents..."
cd multiagent/agent-manager
chmod +x agent-manager.sh
./agent-manager.sh start birdie
./agent-manager.sh start scout-ops

echo ""
./agent-manager.sh status
echo ""
echo "✅ Done! Birdie on 18001, Scout Ops on 18002"
