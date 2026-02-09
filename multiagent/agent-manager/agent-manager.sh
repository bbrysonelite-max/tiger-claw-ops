#!/bin/bash
# =============================================================================
# TIGER BOT SCOUT - MULTI-AGENT MANAGER
# =============================================================================
# Manages multiple OpenClaw agents on different ports
# Designed for Mac Pro - supports up to 80 agents
# =============================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REGISTRY_FILE="${SCRIPT_DIR}/agent-registry.json"
LOG_DIR="/Users/Shared/openclaw/logs"
AGENT_BASE_DIR="/Users/Shared/openclaw/agents"
PID_DIR="/Users/Shared/openclaw/pids"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Ensure directories exist
mkdir -p "$LOG_DIR" "$AGENT_BASE_DIR" "$PID_DIR" 2>/dev/null || true

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

get_agent_port() {
    jq -r ".agents[] | select(.id == \"$1\") | .port" "$REGISTRY_FILE"
}

get_agent_workspace() {
    jq -r ".agents[] | select(.id == \"$1\") | .workspace" "$REGISTRY_FILE"
}

is_agent_running() {
    local pid_file="${PID_DIR}/${1}.pid"
    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

start_agent() {
    local agent_id="$1"
    local port=$(get_agent_port "$agent_id")
    local workspace=$(get_agent_workspace "$agent_id")
    local pid_file="${PID_DIR}/${agent_id}.pid"
    local log_file="${LOG_DIR}/${agent_id}.log"
    
    if [[ -z "$port" || "$port" == "null" ]]; then
        log_error "Agent '$agent_id' not found in registry"
        return 1
    fi
    
    if is_agent_running "$agent_id"; then
        log_warn "Agent '$agent_id' is already running on port $port"
        return 0
    fi
    
    log_info "Starting agent '$agent_id' on port $port..."
    mkdir -p "$workspace" 2>/dev/null || true
    
    # Start OpenClaw gateway on the specified port
    nohup openclaw gateway --port "$port" > "$log_file" 2>&1 &
    local pid=$!
    echo "$pid" > "$pid_file"
    sleep 2
    
    if is_agent_running "$agent_id"; then
        log_success "Agent '$agent_id' started (PID: $pid, Port: $port)"
        # Update status in registry
        local tmp=$(mktemp)
        jq "(.agents[] | select(.id == \"$agent_id\") | .status) = \"active\"" "$REGISTRY_FILE" > "$tmp" && mv "$tmp" "$REGISTRY_FILE"
    else
        log_error "Failed to start agent '$agent_id' - check $log_file"
        rm -f "$pid_file"
        return 1
    fi
}

stop_agent() {
    local agent_id="$1"
    local pid_file="${PID_DIR}/${agent_id}.pid"
    
    if ! is_agent_running "$agent_id"; then
        log_warn "Agent '$agent_id' is not running"
        return 0
    fi
    
    local pid=$(cat "$pid_file")
    log_info "Stopping agent '$agent_id' (PID: $pid)..."
    kill "$pid" 2>/dev/null || true
    sleep 1
    ps -p "$pid" > /dev/null 2>&1 && kill -9 "$pid" 2>/dev/null || true
    rm -f "$pid_file"
    
    local tmp=$(mktemp)
    jq "(.agents[] | select(.id == \"$agent_id\") | .status) = \"stopped\"" "$REGISTRY_FILE" > "$tmp" && mv "$tmp" "$REGISTRY_FILE"
    log_success "Agent '$agent_id' stopped"
}

restart_agent() {
    stop_agent "$1"
    sleep 1
    start_agent "$1"
}

start_all() {
    log_info "Starting all auto-start agents..."
    for agent_id in $(jq -r '.agents[] | select(.auto_start == true) | .id' "$REGISTRY_FILE"); do
        start_agent "$agent_id"
    done
}

stop_all() {
    log_info "Stopping all agents..."
    for agent_id in $(jq -r '.agents[].id' "$REGISTRY_FILE"); do
        is_agent_running "$agent_id" && stop_agent "$agent_id"
    done
}

status() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "  🐯 TIGER BOT SCOUT - AGENT STATUS"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    printf "%-15s %-20s %-8s %-12s %s\n" "ID" "NAME" "PORT" "TYPE" "STATUS"
    printf "%-15s %-20s %-8s %-12s %s\n" "───────────" "────────────────" "──────" "──────────" "────────"
    
    jq -r '.agents[] | "\(.id)|\(.name)|\(.port)|\(.type)"' "$REGISTRY_FILE" | while IFS='|' read -r id name port type; do
        if is_agent_running "$id"; then
            printf "%-15s %-20s %-8s %-12s ${GREEN}● RUNNING${NC}\n" "$id" "$name" "$port" "$type"
        else
            printf "%-15s %-20s %-8s %-12s ${RED}○ STOPPED${NC}\n" "$id" "$name" "$port" "$type"
        fi
    done
    echo ""
}

add_agent() {
    local name="$1"
    local type="$2"
    local owner="${3:-system}"
    local trial_days="${4:-0}"
    
    if [[ -z "$name" || -z "$type" ]]; then
        echo "Usage: $0 add <name> <type> [owner] [trial_days]"
        echo "Types: personal-assistant, maintenance, tiger-bot, demo, trial"
        return 1
    fi
    
    local id=$(echo "$name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-')
    local max_port=$(jq '.agents | max_by(.port) | .port' "$REGISTRY_FILE")
    local new_port=$((max_port + 1))
    
    local trial_expires="null"
    if [[ "$trial_days" -gt 0 ]]; then
        if [[ "$(uname)" == "Darwin" ]]; then
            trial_expires="\"$(date -v+${trial_days}d +%Y-%m-%d)\""
        else
            trial_expires="\"$(date -d "+${trial_days} days" +%Y-%m-%d)\""
        fi
    fi
    
    local tmp=$(mktemp)
    jq ".agents += [{
        \"id\": \"$id\",
        \"name\": \"$name\",
        \"type\": \"$type\",
        \"port\": $new_port,
        \"workspace\": \"${AGENT_BASE_DIR}/${id}\",
        \"owner\": \"$owner\",
        \"status\": \"stopped\",
        \"auto_start\": false,
        \"created\": \"$(date +%Y-%m-%d)\",
        \"trial_expires\": $trial_expires
    }]" "$REGISTRY_FILE" > "$tmp" && mv "$tmp" "$REGISTRY_FILE"
    
    log_success "Added agent '$name' (id: $id, port: $new_port)"
}

remove_agent() {
    local agent_id="$1"
    if is_agent_running "$agent_id"; then
        stop_agent "$agent_id"
    fi
    local tmp=$(mktemp)
    jq "del(.agents[] | select(.id == \"$agent_id\"))" "$REGISTRY_FILE" > "$tmp" && mv "$tmp" "$REGISTRY_FILE"
    log_success "Removed agent '$agent_id' from registry"
}

logs() {
    local agent_id="$1"
    local log_file="${LOG_DIR}/${agent_id}.log"
    if [[ -f "$log_file" ]]; then
        tail -f "$log_file"
    else
        log_error "No log file for agent '$agent_id'"
    fi
}

usage() {
    echo ""
    echo "🐯 Tiger Bot Scout - Multi-Agent Manager"
    echo ""
    echo "Usage: $0 <command> [args]"
    echo ""
    echo "Commands:"
    echo "  status              Show status of all agents"
    echo "  start <id>          Start a specific agent"
    echo "  stop <id>           Stop a specific agent"
    echo "  restart <id>        Restart a specific agent"
    echo "  start-all           Start all auto-start agents"
    echo "  stop-all            Stop all running agents"
    echo "  add <name> <type>   Add a new agent (types: tiger-bot, demo, trial)"
    echo "  remove <id>         Remove an agent"
    echo "  logs <id>           Tail logs for an agent"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 start birdie"
    echo "  $0 add 'Pat Sullivan' tiger-bot pat 0"
    echo "  $0 add 'Demo User' trial demo 7"
    echo ""
}

# Main
case "${1:-}" in
    status)     status ;;
    start)      start_agent "$2" ;;
    stop)       stop_agent "$2" ;;
    restart)    restart_agent "$2" ;;
    start-all)  start_all ;;
    stop-all)   stop_all ;;
    add)        add_agent "$2" "$3" "${4:-}" "${5:-}" ;;
    remove)     remove_agent "$2" ;;
    logs)       logs "$2" ;;
    *)          usage ;;
esac
