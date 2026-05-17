#!/usr/bin/env bash
set -euo pipefail

DEV_CONVEX_DEPLOYMENT="dev:hardy-bobcat-646"
DEV_CONVEX_URL="https://hardy-bobcat-646.convex.cloud"
PROD_CONVEX_URL="https://laudable-blackbird-573.convex.cloud"
BLOCKED_DEV_CONVEX_HOST="hardy-bobcat-646.convex.cloud"

ROOT_ENV_FILE=".env.local"
FRONTEND_DEV_ENV_FILE="packages/frontend/.env.local"
FRONTEND_PROD_ENV_FILE="packages/frontend/.env.production"
FRONTEND_LOCAL_ENV_FILE="packages/frontend/.env.local"
DIST_DIR="packages/frontend/dist"
ASSETS_DIR="$DIST_DIR/assets"

MEMBER_NUMBER_MIGRATION_ADMIN_IDS_ENV="MEMBER_NUMBER_MIGRATION_ADMIN_IDS"
MEMBER_NUMBER_MIGRATION_BATCH_SIZE="${MEMBER_NUMBER_MIGRATION_BATCH_SIZE:-500}"

usage() {
  echo "Usage: pnpm deploy:dev | pnpm deploy:prod"
  echo "       bash scripts/deploy.sh dev|prod"
}

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

read_frontend_prod_env() {
  local name="$1"
  local value="${!name:-}"

  if [[ -z "$value" ]]; then
    value="$(read_env_file "$name" "$FRONTEND_PROD_ENV_FILE")"
  fi

  printf '%s' "$value"
}

read_convex_prod_env() {
  local name="$1"
  local value="${!name:-}"

  if [[ -z "$value" ]]; then
    value="$(pnpm exec convex env get "$name" --prod)"
  fi

  if [[ "$value" == "undefined" ]]; then
    value=""
  fi

  printf '%s' "$value"
}

json_string() {
  node - "$1" <<'NODE'
console.log(JSON.stringify(process.argv[2]));
NODE
}

decode_clerk_issuer_domain() {
  local publishable_key="$1"

  node - "$publishable_key" <<'NODE'
const publishableKey = process.argv[2];
const [prefix, environment, encodedDomain] = publishableKey.split('_');

if (prefix !== 'pk' || !['live', 'test'].includes(environment) || !encodedDomain) {
  throw new Error('Invalid Clerk publishable key format.');
}

const decodedDomain = Buffer.from(encodedDomain, 'base64').toString('utf8');
if (!decodedDomain.endsWith('$')) {
  throw new Error('Invalid Clerk publishable key domain.');
}

console.log(`https://${decodedDomain.slice(0, -1)}`);
NODE
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

deploy_development() {
  verify_development_configuration

  if [[ "${DEPLOY_DEV_CHECK_ONLY:-}" == "1" ]]; then
    echo "Check-only mode complete. Skipped development Convex push."
    return
  fi

  echo "Pushing Convex functions to development deployment..."
  echo "Target deployment: $DEV_CONVEX_DEPLOYMENT"
  echo "Target URL: $DEV_CONVEX_URL"

  pnpm exec convex dev --once --env-file "$ROOT_ENV_FILE" --tail-logs disable
}

load_cloudflare_token() {
  if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    return
  fi

  if [[ ! -f "$ROOT_ENV_FILE" ]]; then
    return
  fi

  local token
  token="$(awk -F= '$1 == "CLOUDFLARE_API_TOKEN" { print substr($0, index($0, "=") + 1); exit }' "$ROOT_ENV_FILE")"

  if [[ -n "$token" ]]; then
    export CLOUDFLARE_API_TOKEN="$token"
  fi
}

verify_production_clerk_configuration() {
  echo "Verifying Clerk production configuration..."

  local clerk_publishable_key
  clerk_publishable_key="$(read_frontend_prod_env VITE_CLERK_PUBLISHABLE_KEY)"

  if [[ -z "$clerk_publishable_key" ]]; then
    echo "ERROR: VITE_CLERK_PUBLISHABLE_KEY is required for production builds." >&2
    exit 1
  fi

  if [[ "$clerk_publishable_key" == pk_test_* ]]; then
    echo "ERROR: Production build is using a Clerk test publishable key." >&2
    echo "Set VITE_CLERK_PUBLISHABLE_KEY to the production Clerk key before deploying." >&2
    exit 1
  fi

  local clerk_issuer_domain
  clerk_issuer_domain="$(decode_clerk_issuer_domain "$clerk_publishable_key")"

  local convex_issuer_domain
  convex_issuer_domain="$(pnpm exec convex env get CLERK_ISSUER_DOMAIN --prod)"

  if [[ "$convex_issuer_domain" != "$clerk_issuer_domain" ]]; then
    echo "ERROR: Clerk issuer mismatch." >&2
    echo "Frontend Clerk issuer: $clerk_issuer_domain" >&2
    echo "Convex CLERK_ISSUER_DOMAIN: $convex_issuer_domain" >&2
    exit 1
  fi

  echo "Clerk configuration verified."
}

build_production_frontend() {
  echo "Building frontend with production Convex URL..."
  local clerk_publishable_key
  clerk_publishable_key="$(read_frontend_prod_env VITE_CLERK_PUBLISHABLE_KEY)"

  VITE_CONVEX_URL="$PROD_CONVEX_URL" \
    VITE_CLERK_PUBLISHABLE_KEY="$clerk_publishable_key" \
    pnpm --filter @geuldarak/frontend build
}

verify_production_bundle() {
  echo "Verifying production bundle..."
  local clerk_publishable_key
  clerk_publishable_key="$(read_frontend_prod_env VITE_CLERK_PUBLISHABLE_KEY)"
  local local_clerk_publishable_key
  local_clerk_publishable_key="$(read_env_file VITE_CLERK_PUBLISHABLE_KEY "$FRONTEND_LOCAL_ENV_FILE")"

  shopt -s nullglob
  local index_files=("$ASSETS_DIR"/index-*.js)
  local js_files=("$ASSETS_DIR"/*.js)
  shopt -u nullglob

  if (( ${#index_files[@]} == 0 )); then
    echo "ERROR: No built frontend index bundle found in $ASSETS_DIR." >&2
    exit 1
  fi

  if (( ${#js_files[@]} == 0 )); then
    echo "ERROR: No built frontend JavaScript files found in $ASSETS_DIR." >&2
    exit 1
  fi

  if grep -R -F "$BLOCKED_DEV_CONVEX_HOST" "${js_files[@]}" >/dev/null; then
    echo "ERROR: Built bundle contains dev Convex host: $BLOCKED_DEV_CONVEX_HOST" >&2
    exit 1
  fi

  if ! grep -R -F "$PROD_CONVEX_URL" "${js_files[@]}" >/dev/null; then
    echo "ERROR: Built bundle does not contain prod Convex URL: $PROD_CONVEX_URL" >&2
    exit 1
  fi

  if ! grep -R -F "$clerk_publishable_key" "${js_files[@]}" >/dev/null; then
    echo "ERROR: Built bundle does not contain the expected Clerk publishable key." >&2
    exit 1
  fi

  if [[ -n "$local_clerk_publishable_key" && "$local_clerk_publishable_key" != "$clerk_publishable_key" ]]; then
    if grep -R -F "$local_clerk_publishable_key" "${js_files[@]}" >/dev/null; then
      echo "ERROR: Built bundle contains the local Clerk publishable key." >&2
      exit 1
    fi
  fi

  echo "Bundle verified: production Convex URL and Clerk key are present."
}

deploy_production_convex() {
  echo "Deploying Convex functions..."
  pnpm exec convex deploy --yes
}

run_member_number_migration() {
  if [[ "${DEPLOY_PROD_SKIP_MEMBER_NUMBER_MIGRATION:-}" == "1" ]]; then
    echo "Skipping member number migration by request."
    return
  fi

  if ! [[ "$MEMBER_NUMBER_MIGRATION_BATCH_SIZE" =~ ^[0-9]+$ ]] || (( MEMBER_NUMBER_MIGRATION_BATCH_SIZE < 1 )); then
    echo "ERROR: MEMBER_NUMBER_MIGRATION_BATCH_SIZE must be a positive integer." >&2
    exit 1
  fi

  local admin_ids
  admin_ids="$(read_convex_prod_env "$MEMBER_NUMBER_MIGRATION_ADMIN_IDS_ENV")"

  if [[ -z "$admin_ids" ]]; then
    echo "Skipping member number migration: $MEMBER_NUMBER_MIGRATION_ADMIN_IDS_ENV is not set."
    return
  fi

  local migration_subject
  migration_subject="${admin_ids%%,*}"
  migration_subject="$(printf '%s' "$migration_subject" | xargs)"

  if [[ -z "$migration_subject" ]]; then
    echo "ERROR: $MEMBER_NUMBER_MIGRATION_ADMIN_IDS_ENV does not contain a valid Clerk user id." >&2
    exit 1
  fi

  local identity
  local subject_json
  subject_json="$(json_string "$migration_subject")"
  identity="{\"subject\":${subject_json}}"

  echo "Running member number migration..."

  while true; do
    local result
    result="$(pnpm exec convex run users:backfillMemberNumbers "{\"batchSize\":$MEMBER_NUMBER_MIGRATION_BATCH_SIZE}" --prod --identity "$identity")"
    echo "$result"

    local remaining
    remaining="$(node - "$result" <<'NODE'
const input = process.argv[2] || "";
const result = JSON.parse(input);
console.log(Number(result.remaining ?? 0));
NODE
)"

    if (( remaining <= 0 )); then
      break
    fi
  done
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

deploy_production() {
  verify_production_clerk_configuration
  build_production_frontend
  verify_production_bundle

  if [[ "${DEPLOY_PROD_CHECK_ONLY:-}" == "1" ]]; then
    echo "Check-only mode complete. Skipped Convex and Cloudflare deployment."
    return
  fi

  deploy_production_convex
  run_member_number_migration
  deploy_worker
}

case "${1:-}" in
  dev | development)
    deploy_development
    ;;
  prod | production)
    deploy_production
    ;;
  *)
    usage >&2
    exit 1
    ;;
esac
