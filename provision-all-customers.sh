#!/bin/bash
# =============================================================================
# TIGER BOT SCOUT — PROVISION ALL 7 CUSTOMERS
# =============================================================================
# Run this after the API is running to activate all seeded customers
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

API_BASE="${API_BASE:-http://localhost:4001}"

echo -e "${BLUE}🐯 Tiger Claw Scout — Batch Customer Provisioning${NC}"
echo "================================================="
echo ""

# The 7 seeded customers from HANDOFF.md
CUSTOMERS='[
  {"email": "nancylimsk@gmail.com", "name": "Nancy Lim", "plan": "scout"},
  {"email": "chana.loh@gmail.com", "name": "Chana Lohasaptawee", "plan": "scout"},
  {"email": "phaitoon2010@gmail.com", "name": "Phaitoon S.", "plan": "scout"},
  {"email": "taridadew@gmail.com", "name": "Tarida Sukavanich", "plan": "scout"},
  {"email": "lily.vergara@gmail.com", "name": "Lily Vergara", "plan": "scout"},
  {"email": "phetmalaigul@gmail.com", "name": "Theera Phetmalaigul", "plan": "scout"},
  {"email": "vijohn@hotmail.com", "name": "John & Noon", "plan": "scout"}
]'

echo "Provisioning 7 customers to $API_BASE..."
echo ""

curl -s -X POST "$API_BASE/admin/provision/batch" \
  -H "Content-Type: application/json" \
  -d "{\"customers\": $CUSTOMERS}" | python3 -m json.tool

echo ""
echo -e "${GREEN}✅ Done! All customers provisioned.${NC}"
echo ""
echo "Verify with: curl $API_BASE/admin/tenants/db | python3 -m json.tool"
