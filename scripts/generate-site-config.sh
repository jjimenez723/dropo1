#!/usr/bin/env sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
ENV_FILE=${1:-"$ROOT_DIR/.env"}
OUTPUT_FILE="$ROOT_DIR/assets/js/site-config.local.js"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE" >&2
  echo "Copy .env.example to .env and try again." >&2
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

escape_js_string() {
  printf '%s' "${1:-}" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

normalize_webhook_url() {
  value=${1:-}

  case "$value" in
    "" | *your-n8n-domain*)
      printf '%s' ""
      return
      ;;
    http://* | https://*)
      printf '%s' "$value"
      return
      ;;
    *)
      printf '%s' ""
      return
      ;;
  esac
}

NEWSLETTER_URL=$(escape_js_string "$(normalize_webhook_url "${DROP01_N8N_NEWSLETTER_SUBSCRIBE_WEBHOOK_URL:-}")")
CONTACT_URL=$(escape_js_string "$(normalize_webhook_url "${DROP01_N8N_GENERAL_CONTACT_WEBHOOK_URL:-}")")
DESIGNER_URL=$(escape_js_string "$(normalize_webhook_url "${DROP01_N8N_DESIGNER_INTAKE_WEBHOOK_URL:-}")")
TIMEOUT_MS=${DROP01_FORM_SUBMIT_TIMEOUT_MS:-10000}

cat > "$OUTPUT_FILE" <<EOF
window.DROP01_SITE_CONFIG = {
  ...(window.DROP01_SITE_CONFIG || {}),
  submitTimeoutMs: $TIMEOUT_MS,
  webhooks: {
    ...(window.DROP01_SITE_CONFIG?.webhooks || {}),
    newsletterSubscribe: "$NEWSLETTER_URL",
    generalContact: "$CONTACT_URL",
    designerIntake: "$DESIGNER_URL",
  },
};
EOF

echo "Generated $OUTPUT_FILE"
