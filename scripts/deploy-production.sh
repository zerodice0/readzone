#!/usr/bin/env bash
set -euo pipefail

PROD_CONVEX_URL="https://laudable-blackbird-573.convex.cloud"
BLOCKED_DEV_CONVEX_HOST="hardy-bobcat-646.convex.cloud"
DIST_DIR="packages/frontend/dist"
ASSETS_DIR="$DIST_DIR/assets"
FRONTEND_PROD_ENV_FILE="packages/frontend/.env.production"
FRONTEND_LOCAL_ENV_FILE="packages/frontend/.env.local"
MEMBER_NUMBER_MIGRATION_ADMIN_IDS_ENV="MEMBER_NUMBER_MIGRATION_ADMIN_IDS"
MEMBER_NUMBER_MIGRATION_BATCH_SIZE="${MEMBER_NUMBER_MIGRATION_BATCH_SIZE:-500}"

read_env_file() {
  local name="$1"
  local env_file="$2"
  local value=""

  if [[ -f "$env_file" ]]; then
    value="$(grep -E "^${name}=" "$env_file" | tail -n 1 | cut -d= -f2- || true)"
  fi

  value="${value%$'\r'}"
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"
  printf '%s' "$value"
}

read_frontend_env() {
  local name="$1"
  local value="${!name:-}"

  if [[ -z "$value" && -f "$FRONTEND_PROD_ENV_FILE" ]]; then
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
  local clerk_publishable_key
  clerk_publishable_key="$(read_frontend_env VITE_CLERK_PUBLISHABLE_KEY)"

  VITE_CONVEX_URL="$PROD_CONVEX_URL" \
    VITE_CLERK_PUBLISHABLE_KEY="$clerk_publishable_key" \
    pnpm --filter @geuldarak/frontend build
}

deploy_convex() {
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

verify_clerk_configuration() {
  echo "Verifying Clerk production configuration..."

  local clerk_publishable_key
  clerk_publishable_key="$(read_frontend_env VITE_CLERK_PUBLISHABLE_KEY)"

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

verify_frontend_bundle() {
  echo "Verifying production bundle..."
  local clerk_publishable_key
  clerk_publishable_key="$(read_frontend_env VITE_CLERK_PUBLISHABLE_KEY)"
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

deploy_worker() {
  load_cloudflare_token

  if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    echo "ERROR: CLOUDFLARE_API_TOKEN is required. Set it in .env.local or the shell environment." >&2
    exit 1
  fi

  echo "Deploying to Cloudflare Workers..."
  npx wrangler deploy
}

verify_clerk_configuration
build_frontend
verify_frontend_bundle

if [[ "${DEPLOY_PROD_CHECK_ONLY:-}" == "1" ]]; then
  echo "Check-only mode complete. Skipped Convex and Cloudflare deployment."
  exit 0
fi

deploy_convex
run_member_number_migration
deploy_worker
