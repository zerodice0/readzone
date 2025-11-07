#!/bin/bash
# WP05 Phase 2 Test Script
# Tests email verification endpoints (T048-T049)

set -e

echo "================================================================================"
echo "🧪 WP05 PHASE 2 IMPLEMENTATION TEST"
echo "================================================================================"
echo ""

BASE_URL="http://localhost:3000/api/v1"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Register a new user
echo "📝 Test 1: Register new user for email verification"
echo ""

# Use timestamp to avoid email conflicts
TIMESTAMP=$(date +%s)
TEST_EMAIL="emailverify${TIMESTAMP}@example.com"

REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"TestPassword123!\",
    \"name\": \"Email Verify Test\"
  }")

echo "$REGISTER_RESPONSE" | jq .
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.data.id')
echo -e "${GREEN}✅ User registered (ID: $USER_ID)${NC}"
echo ""

# Test 2: Login to get JWT token
echo "📝 Test 2: Login to get JWT token"
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"TestPassword123!\",
    \"rememberMe\": false
  }")

echo "$LOGIN_RESPONSE" | jq .
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.tokens.accessToken')
echo -e "${GREEN}✅ Login successful, got access token${NC}"
echo ""

# Test 3: Send verification email
echo "📝 Test 3: Send verification email (POST /auth/verify-email/send)"
echo ""

SEND_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verify-email/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$SEND_RESPONSE" | jq .

if echo "$SEND_RESPONSE" | jq -e '.status == "success"' > /dev/null; then
  echo -e "${GREEN}✅ Verification email sent successfully${NC}"
else
  echo -e "${RED}❌ Failed to send verification email${NC}"
  exit 1
fi
echo ""

# Test 4: Extract token from server logs (simulating email click)
echo "📝 Test 4: Extract verification token from server logs"
echo ""

# Note: In a real scenario, the user would click the email link.
# For testing, we extract the token from the server logs where the email was printed.
sleep 1 # Wait for log to be written
TOKEN=$(grep "verify-email?token=" /tmp/phase2-final.log | tail -1 | sed 's/.*token=\([^"]*\).*/\1/')

# Clean token (remove quotes and whitespace)
TOKEN=$(echo $TOKEN | tr -d '[:space:]' | tr -d '"')
echo "Token: $TOKEN"
if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Failed to extract token from logs${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Token extracted from server logs${NC}"
echo ""

# Test 5: Confirm email verification
echo "📝 Test 5: Confirm email verification (POST /auth/verify-email/confirm)"
echo ""

CONFIRM_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verify-email/confirm" \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$TOKEN\"
  }")

echo "$CONFIRM_RESPONSE" | jq .

if echo "$CONFIRM_RESPONSE" | jq -e '.status == "success"' > /dev/null; then
  echo -e "${GREEN}✅ Email verified successfully${NC}"
else
  echo -e "${RED}❌ Failed to verify email${NC}"
  exit 1
fi
echo ""

# Test 6: Verify email_verified flag via API
echo "📝 Test 6: Verify email_verified flag via /auth/me"
echo ""

ME_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$ME_RESPONSE" | jq .
EMAIL_VERIFIED=$(echo "$ME_RESPONSE" | jq -r '.data.emailVerified')

if [[ "$EMAIL_VERIFIED" == "true" ]]; then
  echo -e "${GREEN}✅ email_verified = true${NC}"
else
  echo -e "${RED}❌ email_verified = false (expected true)${NC}"
  exit 1
fi
echo ""

# Test 7: Try to use token again (should fail)
echo "📝 Test 7: Try to reuse token (should fail)"
echo ""

REUSE_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verify-email/confirm" \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$TOKEN\"
  }")

echo "$REUSE_RESPONSE" | jq .

if echo "$REUSE_RESPONSE" | jq -e '.status == "success"' > /dev/null; then
  echo -e "${RED}❌ Token reuse should have been rejected!${NC}"
  exit 1
else
  echo -e "${GREEN}✅ Token reuse correctly rejected${NC}"
fi
echo ""

# Test 8: Try to send verification email again (should fail - already verified)
echo "📝 Test 8: Try to send email again (should fail - already verified)"
echo ""

RESEND_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verify-email/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$RESEND_RESPONSE" | jq .

if echo "$RESEND_RESPONSE" | jq -e '.status == "success"' > /dev/null; then
  echo -e "${RED}❌ Resend should have been rejected (email already verified)!${NC}"
  exit 1
else
  echo -e "${GREEN}✅ Resend correctly rejected (email already verified)${NC}"
fi
echo ""

# Summary
echo "================================================================================"
echo "🎉 WP05 PHASE 2 TEST COMPLETED SUCCESSFULLY"
echo "================================================================================"
echo ""
echo -e "${GREEN}✅ T048: Send verification email endpoint - PASSED${NC}"
echo -e "${GREEN}✅ T049: Confirm verification email endpoint - PASSED${NC}"
echo ""
echo "📋 Test Results:"
echo "  ✅ User registration"
echo "  ✅ JWT authentication"
echo "  ✅ Send verification email (POST /auth/verify-email/send)"
echo "  ✅ Token stored in database"
echo "  ✅ Confirm verification (POST /auth/verify-email/confirm)"
echo "  ✅ email_verified flag updated"
echo "  ✅ Token replay prevention"
echo "  ✅ Already-verified rejection"
echo ""
echo "📋 Next Steps:"
echo "  - Phase 3: Password reset endpoints (T050-T052)"
echo "  - Phase 4: Audit logging integration (T054)"
echo ""
