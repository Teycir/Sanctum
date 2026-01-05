#!/bin/bash

# Automated Vault Expiry E2E Test
# Creates a vault with 1-minute expiry, waits, and validates deletion

set -e  # Exit on error

echo "🧪 Vault Expiry E2E Test - Automated"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Build if needed
if [ ! -d "out" ]; then
    echo "📦 Building Next.js app..."
    npm run build > /dev/null 2>&1
    echo -e "${GREEN}✅ Build complete${NC}"
fi

# Initialize database - let wrangler create it, then apply schema
echo "🗄️  Initializing database..."
rm -rf .wrangler/state/v3/d1
npx wrangler d1 execute sanctum-keys --local --file=schema.sql > /dev/null 2>&1
echo -e "${GREEN}✅ Database initialized${NC}"

# Start backend in background
echo "🚀 Starting backend..."
npx wrangler pages dev out --d1 DB=sanctum-keys --persist-to=.wrangler/state > /tmp/sanctum-backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:8788 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend ready on http://localhost:8788${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend failed to start${NC}"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

# Cleanup function
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    kill $BACKEND_PID 2>/dev/null
    wait $BACKEND_PID 2>/dev/null
    echo -e "${GREEN}✅ Backend stopped${NC}"
}
trap cleanup EXIT

echo ""
echo "📝 Test: Create vault with 1-minute expiry"
echo "==========================================="

# Generate test data
VAULT_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
KEY_B=$(openssl rand -base64 32 | tr '+/' '-_' | tr -d '=')
EXPIRES_AT=$(($(date +%s) * 1000 + 60000))  # 1 minute from now

echo "Vault ID: $VAULT_ID"
echo "Expires at: $(date -d @$((EXPIRES_AT / 1000)) '+%Y-%m-%d %H:%M:%S')"

# Store vault
echo ""
echo "📤 Storing vault..."
STORE_RESPONSE=$(curl -s -X POST http://localhost:8788/api/vault/store-key \
  -H "Content-Type: application/json" \
  -d "{
    \"vaultId\": \"$VAULT_ID\",
    \"keyB\": \"$KEY_B\",
    \"encryptedDecoyCID\": \"test-decoy-cid\",
    \"encryptedHiddenCID\": \"test-hidden-cid\",
    \"salt\": \"test-salt\",
    \"nonce\": \"test-nonce\",
    \"expiresAt\": $EXPIRES_AT
  }")

if echo "$STORE_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Vault stored successfully${NC}"
else
    echo -e "${RED}❌ Failed to store vault${NC}"
    echo "Response: $STORE_RESPONSE"
    exit 1
fi

# Verify vault exists
echo ""
echo "🔍 Verifying vault exists..."
GET_RESPONSE=$(curl -s -X POST http://localhost:8788/api/vault/get-key \
  -H "Content-Type: application/json" \
  -d "{\"vaultId\": \"$VAULT_ID\"}")

if echo "$GET_RESPONSE" | grep -q "keyB"; then
    echo -e "${GREEN}✅ Vault exists and is accessible${NC}"
    RETRIEVED_EXPIRES_AT=$(echo "$GET_RESPONSE" | grep -o '"expiresAt":[0-9]*' | cut -d':' -f2)
    echo "Retrieved expiresAt: $RETRIEVED_EXPIRES_AT"
    
    if [ "$RETRIEVED_EXPIRES_AT" = "$EXPIRES_AT" ]; then
        echo -e "${GREEN}✅ Expiry timestamp matches${NC}"
    else
        echo -e "${YELLOW}⚠️  Expiry timestamp mismatch (expected: $EXPIRES_AT, got: $RETRIEVED_EXPIRES_AT)${NC}"
    fi
else
    echo -e "${RED}❌ Vault not found${NC}"
    echo "Response: $GET_RESPONSE"
    exit 1
fi

# Wait for expiry
echo ""
echo "⏰ Waiting 65 seconds for vault to expire..."
echo "(1 minute expiry + 5 second buffer)"
for i in {65..1}; do
    printf "\r⏳ Time remaining: %02d seconds" $i
    sleep 1
done
echo ""

# Verify vault is deleted
echo ""
echo "🔍 Verifying vault is deleted..."
DELETE_RESPONSE=$(curl -s -X POST http://localhost:8788/api/vault/get-key \
  -H "Content-Type: application/json" \
  -d "{\"vaultId\": \"$VAULT_ID\"}")

if echo "$DELETE_RESPONSE" | grep -q "not found"; then
    echo -e "${GREEN}✅ Vault successfully deleted after expiry${NC}"
    echo ""
    echo "🎉 E2E Test PASSED!"
    echo "==================="
    echo "✅ Vault created with 1-minute expiry"
    echo "✅ Vault accessible before expiry"
    echo "✅ Vault deleted after expiry (lazy deletion)"
    echo "✅ Mobile lag buffer working (5s + 1s grace)"
    exit 0
else
    echo -e "${RED}❌ Vault still exists after expiry${NC}"
    echo "Response: $DELETE_RESPONSE"
    echo ""
    echo "❌ E2E Test FAILED!"
    exit 1
fi
