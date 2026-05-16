#!/usr/bin/env bash
set -euo pipefail

PROD_CONVEX_URL="https://laudable-blackbird-573.convex.cloud"
BLOCKED_DEV_CONVEX_HOST="hardy-bobcat-646.convex.cloud"
DIST_DIR="packages/frontend/dist"
ASSETS_DIR="$DIST_DIR/assets"

load_cloudflare_token() {
  if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    return
  fi

  if [[ ! -f ".env.local" ]]; then
    return
  fi

  local token
  token="$(awk -F= '$1 == "CLOUDFLARE_API_TOKEN" { print substr($0, index($0, "=") + 1); exit }' .env.local)"

  if [[ -n "$token" ]]; then
    export CLOUDFLARE_API_TOKEN="$token"
  fi
}

build_frontend() {
  echo "Building frontend with production Convex URL..."
  VITE_CONVEX_URL="$PROD_CONVEX_URL" pnpm --filter @geuldarak/frontend build
}

verify_frontend_bundle() {
  echo "Verifying production bundle..."

  shopt -s nullglob
  local index_files=("$ASSETS_DIR"/index-*.js)
  shopt -u nullglob

  if (( ${#index_files[@]} == 0 )); then
    echo "ERROR: No built frontend index bundle found in $ASSETS_DIR." >&2
    exit 1
  fi

  if grep -R "$BLOCKED_DEV_CONVEX_HOST" "${index_files[@]}" >/dev/null; then
    echo "ERROR: Built bundle contains dev Convex host: $BLOCKED_DEV_CONVEX_HOST" >&2
    exit 1
  fi

  if ! grep -R "$PROD_CONVEX_URL" "${index_files[@]}" >/dev/null; then
    echo "ERROR: Built bundle does not contain prod Convex URL: $PROD_CONVEX_URL" >&2
    exit 1
  fi

  echo "Bundle verified: production Convex URL is present and dev URL is absent."
}

deploy_worker() {
  load_cloudflare_token

  if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    echo "ERROR: CLOUDFLARE_API_TOKEN is required. Set it in .env.local or the shell environment." >&2
    exit 1
  fi

  echo "Deploying to Cloudflare Workers..."
  npx wrangler deploy
}

build_frontend
verify_frontend_bundle

if [[ "${DEPLOY_PROD_CHECK_ONLY:-}" == "1" ]]; then
  echo "Check-only mode complete. Skipped Cloudflare deployment."
  exit 0
fi

deploy_worker
