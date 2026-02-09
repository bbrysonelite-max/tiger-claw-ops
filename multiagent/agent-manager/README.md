# 🐯 Tiger Bot Scout - Multi-Agent Manager

Enterprise-grade multi-agent management system for running 70-80 OpenClaw agents on a single Mac Pro.

## Overview

This system solves the **port conflict problem** by assigning each agent its own port (18001-18080) and managing them through a central registry.

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                    MAC PRO                             │
│                                                        │
│   ┌────────────────────────────────────────────────┐   │
│   │          agent-manager.sh (Control)            │   │
│   └────────────────────────────────────────────────┘   │
│                         │                              │
│           ┌─────────────┼─────────────┐                │
│           ▼             ▼             ▼                │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│   │   Birdie    │ │  Scout Ops  │ │ Pat Sullivan│      │
│   │  Port 18001 │ │  Port 18002 │ │  Port 18003 │      │
│   └─────────────┘ └─────────────┘ └─────────────┘      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **OpenClaw installed** (`openclaw` command available)
2. **jq installed** (`brew install jq`)
3. **Bash 4+** (macOS default or `brew install bash`)

## Quick Start

### 1. Setup Directories
```bash
sudo mkdir -p /Users/Shared/openclaw/{agents,logs,pids}
sudo chown -R $(whoami) /Users/Shared/openclaw
```

### 2. Check Status
```bash
./agent-manager.sh status
```

### 3. Start Birdie (Your Personal Assistant)
```bash
./agent-manager.sh start birdie
```

### 4. Start Scout Ops (Maintenance Bot)
```bash
./agent-manager.sh start scout-ops
```

### 5. Start All Auto-Start Agents
```bash
./agent-manager.sh start-all
```

## Commands

| Command | Description |
|---------|-------------|
| `status` | Show status of all agents |
| `start <id>` | Start a specific agent |
| `stop <id>` | Stop a specific agent |
| `restart <id>` | Restart a specific agent |
| `start-all` | Start all agents with auto_start=true |
| `stop-all` | Stop all running agents |
| `add <name> <type> [owner] [trial_days]` | Add a new agent |
| `remove <id>` | Remove an agent |
| `logs <id>` | Tail logs for an agent |

## Agent Types

| Type | Description |
|------|-------------|
| `personal-assistant` | User's personal AI assistant (e.g., Birdie) |
| `maintenance` | System maintenance bots (e.g., Scout Ops) |
| `tiger-bot` | Customer product - what you sell |
| `demo` | Demo agents for sales presentations |
| `trial` | 7-day trial agents for prospects |

## Examples

### Add a Customer Bot
```bash
./agent-manager.sh add "Pat Sullivan" tiger-bot pat
```

### Add a Trial Bot (7-day expiry)
```bash
./agent-manager.sh add "Demo Prospect" trial demo 7
```

### View Logs
```bash
./agent-manager.sh logs birdie
```

## Directory Structure

```
/Users/Shared/openclaw/
├── agents/           # Agent workspaces
│   ├── birdie/
│   ├── scout-ops/
│   └── pat-sullivan/
├── logs/             # Agent logs
│   ├── birdie.log
│   └── scout-ops.log
└── pids/             # Process ID files
    ├── birdie.pid
    └── scout-ops.pid
```

## Port Allocation

- Base port: 18001
- Max agents: 80 (ports 18001-18080)
- Ports auto-assigned when adding agents

## Auto-Start on Boot

To start agents automatically when Mac boots:

```bash
# Create a LaunchAgent
cat > ~/Library/LaunchAgents/com.tigerbot.agents.plist << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.tigerbot.agents</string>
    <key>ProgramArguments</key>
    <array>
        <string>/path/to/agent-manager.sh</string>
        <string>start-all</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
PLIST

# Load it
launchctl load ~/Library/LaunchAgents/com.tigerbot.agents.plist
```

## Troubleshooting

### Port Already in Use
```bash
lsof -i :18001  # Check what's using the port
kill -9 <PID>   # Kill the process
```

### Agent Won't Start
```bash
./agent-manager.sh logs <agent-id>  # Check logs
openclaw doctor                      # Run OpenClaw diagnostics
```

### Reset Everything
```bash
./agent-manager.sh stop-all
rm -rf /Users/Shared/openclaw/pids/*
./agent-manager.sh start-all
```

## Integration with Dashboard

The agent registry (`agent-registry.json`) can be read by the Tiger Bot Scout Dashboard to display agent status in the UI. Future dashboard updates will include:

- Agent Manager panel
- Create/Start/Stop agents from UI
- Trial expiry management
- Customer assignment

---

**Built for Tiger Bot Scout** | Supports 80 agents | Enterprise Ready
