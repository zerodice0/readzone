#!/usr/bin/env bash
set -euo pipefail

DEV_CONVEX_DEPLOYMENT="dev:hardy-bobcat-646"
DEV_CONVEX_URL="https://hardy-bobcat-646.convex.cloud"
PROD_CONVEX_URL="https://laudable-blackbird-573.convex.cloud"
ROOT_ENV_FILE=".env.local"
FRONTEND_DEV_ENV_FILE="packages/frontend/.env.local"

read_env_file() {
  local name="$1"
  local env_file="$2"
  local value=""

  if [[ -f "$env_file" ]]; then
    value="$(grep -E "^${name}=" "$env_file" | tail -n 1 | cut -d= -f2- || true)"
  fi

  value="${value%%#*}"
  value="${value%$'\r'}"
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"
  printf '%s' "$value" | xargs
}

read_root_env() {
  local name="$1"
  local value="${!name:-}"

  if [[ -z "$value" ]]; then
    value="$(read_env_file "$name" "$ROOT_ENV_FILE")"
  fi

  printf '%s' "$value"
}

read_frontend_dev_env() {
  local name="$1"
  local value="${!name:-}"

  if [[ -z "$value" ]]; then
    value="$(read_env_file "$name" "$FRONTEND_DEV_ENV_FILE")"
  fi

  printf '%s' "$value"
}

verify_development_configuration() {
  echo "Verifying development Convex/Clerk configuration..."

  local convex_deployment
  convex_deployment="$(read_root_env CONVEX_DEPLOYMENT)"
  local convex_url
  convex_url="$(read_root_env CONVEX_URL)"
  local frontend_convex_url
  frontend_convex_url="$(read_frontend_dev_env VITE_CONVEX_URL)"
  local frontend_clerk_publishable_key
  frontend_clerk_publishable_key="$(read_frontend_dev_env VITE_CLERK_PUBLISHABLE_KEY)"
  local root_clerk_publishable_key
  root_clerk_publishable_key="$(read_root_env CLERK_PUBLISHABLE_KEY)"
  local root_clerk_secret_key
  root_clerk_secret_key="$(read_root_env CLERK_SECRET_KEY)"

  if [[ "$convex_deployment" != "$DEV_CONVEX_DEPLOYMENT" ]]; then
    echo "ERROR: CONVEX_DEPLOYMENT must be $DEV_CONVEX_DEPLOYMENT for development deploys." >&2
    echo "Current CONVEX_DEPLOYMENT: ${convex_deployment:-<empty>}" >&2
    exit 1
  fi

  if [[ "$convex_url" != "$DEV_CONVEX_URL" ]]; then
    echo "ERROR: CONVEX_URL must be the development Convex URL." >&2
    echo "Expected: $DEV_CONVEX_URL" >&2
    echo "Current: ${convex_url:-<empty>}" >&2
    exit 1
  fi

  if [[ "$frontend_convex_url" != "$DEV_CONVEX_URL" ]]; then
    echo "ERROR: VITE_CONVEX_URL must be the development Convex URL." >&2
    echo "Expected: $DEV_CONVEX_URL" >&2
    echo "Current: ${frontend_convex_url:-<empty>}" >&2
    exit 1
  fi

  if [[ "$convex_url" == "$PROD_CONVEX_URL" || "$frontend_convex_url" == "$PROD_CONVEX_URL" ]]; then
    echo "ERROR: Development deploy is pointing at the production Convex URL." >&2
    exit 1
  fi

  if [[ -z "$frontend_clerk_publishable_key" ]]; then
    echo "ERROR: VITE_CLERK_PUBLISHABLE_KEY is required for development." >&2
    exit 1
  fi

  if [[ "$frontend_clerk_publishable_key" != pk_test_* ]]; then
    echo "ERROR: Development frontend must use a Clerk test publishable key." >&2
    exit 1
  fi

  if [[ -n "$root_clerk_publishable_key" && "$root_clerk_publishable_key" != pk_test_* ]]; then
    echo "ERROR: Development root CLERK_PUBLISHABLE_KEY must be a Clerk test key when set." >&2
    exit 1
  fi

  if [[ -n "$root_clerk_secret_key" && "$root_clerk_secret_key" != sk_test_* ]]; then
    echo "ERROR: Development root CLERK_SECRET_KEY must be a Clerk test key when set." >&2
    exit 1
  fi

  echo "Development configuration verified."
}

push_convex_development() {
  echo "Pushing Convex functions to development deployment..."
  echo "Target deployment: $DEV_CONVEX_DEPLOYMENT"
  echo "Target URL: $DEV_CONVEX_URL"

  pnpm exec convex dev --once --env-file "$ROOT_ENV_FILE" --tail-logs disable
}

verify_development_configuration

if [[ "${DEPLOY_DEV_CHECK_ONLY:-}" == "1" ]]; then
  echo "Check-only mode complete. Skipped development Convex push."
  exit 0
fi

push_convex_development
