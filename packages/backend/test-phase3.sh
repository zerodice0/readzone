#!/bin/bash

# Phase 3 Integration Tests: Password Reset Flow
# Tests T050 (request) and T051 (confirm) endpoints

set -e

API_BASE="http://localhost:3001/api/v1"
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo "=== Phase 3: Password Reset Integration Tests ==="
echo

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test helper function
run_test() {
  local test_name="$1"
  local test_command="$2"

  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  echo -n "[$TOTAL_TESTS] $test_name... "

  if eval "$test_command" > /dev/null 2>&1; then
    echo "✅ PASS"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    return 0
  else
    echo "❌ FAIL"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    return 1
  fi
}

# Extract JSON field helper
extract_json() {
  local json="$1"
  local field="$2"
  echo "$json" | grep -o "\"$field\":\"[^\"]*\"" | cut -d'"' -f4
}

echo "Step 1: Setup - Register a new user"
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "resettest@example.com",
    "password": "OldPass123!",
    "name": "Reset Test User"
  }')

USER_ID=$(extract_json "$REGISTER_RESPONSE" "id")
echo "✅ User registered (ID: $USER_ID)"
echo

echo "Step 2: Test 1 - Request password reset (existing user)"
RESET_REQUEST=$(curl -s -X POST "$API_BASE/auth/password-reset/request" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "resettest@example.com"
  }')

run_test "Request password reset for existing user" \
  "echo '$RESET_REQUEST' | grep -q 'password reset link'"

echo "Step 3: Extract reset token from database"
# Get the reset token from PostgreSQL
RESET_TOKEN=$(docker exec readzone-postgres psql -U postgres -d readzone -t -c \
  "SELECT token FROM \"PasswordResetToken\" WHERE \"userId\"='$USER_ID' ORDER BY \"createdAt\" DESC LIMIT 1;" \
  | tr -d ' ')

echo "✅ Reset token extracted: ${RESET_TOKEN:0:20}..."
echo

echo "Step 4: Test 2 - Verify token stored in database"
run_test "Verify token exists in database" \
  "[ ! -z '$RESET_TOKEN' ]"

echo "Step 5: Test 3 - Confirm password reset with token"
RESET_CONFIRM=$(curl -s -X POST "$API_BASE/auth/password-reset/confirm" \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$RESET_TOKEN\",
    \"newPassword\": \"NewPass456!\"
  }")

run_test "Confirm password reset" \
  "echo '$RESET_CONFIRM' | grep -q 'successfully'"

echo "Step 6: Test 4 - Verify password updated (login with new password)"
LOGIN_NEW=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "resettest@example.com",
    "password": "NewPass456!",
    "rememberMe": false
  }')

run_test "Login with new password" \
  "echo '$LOGIN_NEW' | grep -q 'accessToken'"

echo "Step 7: Test 5 - Verify old password rejected"
LOGIN_OLD=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "resettest@example.com",
    "password": "OldPass123!",
    "rememberMe": false
  }')

run_test "Old password rejected" \
  "echo '$LOGIN_OLD' | grep -q 'Invalid credentials'"

echo "Step 8: Test 6 - Token replay prevention"
RESET_REPLAY=$(curl -s -X POST "$API_BASE/auth/password-reset/confirm" \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$RESET_TOKEN\",
    \"newPassword\": \"AnotherPass789!\"
  }")

run_test "Token replay rejected" \
  "echo '$RESET_REPLAY' | grep -q 'already used'"

echo "Step 9: Test 7 - Invalid token rejection"
RESET_INVALID=$(curl -s -X POST "$API_BASE/auth/password-reset/confirm" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "invalid-token-12345",
    "newPassword": "NewPass456!"
  }')

run_test "Invalid token rejected" \
  "echo '$RESET_INVALID' | grep -q 'Invalid or expired'"

echo "Step 10: Test 8 - Request reset for non-existent email (security)"
RESET_NONEXISTENT=$(curl -s -X POST "$API_BASE/auth/password-reset/request" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com"
  }')

run_test "Non-existent email returns success (no enumeration)" \
  "echo '$RESET_NONEXISTENT' | grep -q 'password reset link'"

echo
echo "=== Test Summary ==="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS ✅"
echo "Failed: $FAILED_TESTS ❌"
echo

if [ $FAILED_TESTS -eq 0 ]; then
  echo "🎉 All Phase 3 tests passed!"
  exit 0
else
  echo "⚠️  Some tests failed. Please review the output above."
  exit 1
fi
