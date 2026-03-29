#!/usr/bin/env sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
ENV_FILE=${1:-"$ROOT_DIR/.env"}
OUTPUT_FILE=${2:-"$ROOT_DIR/assets/js/site-config.local.js"}

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

normalize_positive_integer() {
  value=${1:-}
  fallback=${2:-1}

  case "$value" in
    ''|*[!0-9]*)
      printf '%s' "$fallback"
      ;;
    0)
      printf '%s' "$fallback"
      ;;
    *)
      printf '%s' "$value"
      ;;
  esac
}

NEWSLETTER_URL=$(escape_js_string "$(normalize_webhook_url "${DROP01_N8N_NEWSLETTER_SUBSCRIBE_WEBHOOK_URL:-}")")
CONTACT_URL=$(escape_js_string "$(normalize_webhook_url "${DROP01_N8N_GENERAL_CONTACT_WEBHOOK_URL:-}")")
DESIGNER_URL=$(escape_js_string "$(normalize_webhook_url "${DROP01_N8N_DESIGNER_INTAKE_WEBHOOK_URL:-}")")
HERO_NOTE_URL=$(escape_js_string "$(normalize_webhook_url "${DROP01_N8N_HERO_NOTE_WEBHOOK_URL:-}")")
TIMEOUT_MS=${DROP01_FORM_SUBMIT_TIMEOUT_MS:-10000}
SHOPIFY_STORE_DOMAIN=$(escape_js_string "${DROP01_SHOPIFY_STORE_DOMAIN:-}")
SHOPIFY_STOREFRONT_ACCESS_TOKEN=$(escape_js_string "${DROP01_SHOPIFY_STOREFRONT_ACCESS_TOKEN:-}")
SHOPIFY_API_VERSION=$(escape_js_string "${DROP01_SHOPIFY_API_VERSION:-2026-01}")
SHOPIFY_COLLECTION_HANDLE=$(escape_js_string "${DROP01_SHOPIFY_COLLECTION_HANDLE:-}")
SHOPIFY_HOME_COLLECTION_HANDLE=$(escape_js_string "${DROP01_SHOPIFY_HOME_COLLECTION_HANDLE:-}")
SHOPIFY_SHOP_COLLECTION_HANDLE=$(escape_js_string "${DROP01_SHOPIFY_SHOP_COLLECTION_HANDLE:-}")
SHOPIFY_FEATURED_PRODUCT_HANDLE=$(escape_js_string "${DROP01_SHOPIFY_FEATURED_PRODUCT_HANDLE:-}")
SHOPIFY_HOME_PRODUCT_LIMIT=$(normalize_positive_integer "${DROP01_SHOPIFY_HOME_PRODUCT_LIMIT:-3}" 3)
SHOPIFY_SHOP_PRODUCT_LIMIT=$(normalize_positive_integer "${DROP01_SHOPIFY_SHOP_PRODUCT_LIMIT:-6}" 6)

cat > "$OUTPUT_FILE" <<EOF
window.DROP01_SITE_CONFIG = {
  ...(window.DROP01_SITE_CONFIG || {}),
  submitTimeoutMs: $TIMEOUT_MS,
  webhooks: {
    ...(window.DROP01_SITE_CONFIG?.webhooks || {}),
    newsletterSubscribe: "$NEWSLETTER_URL",
    generalContact: "$CONTACT_URL",
    designerIntake: "$DESIGNER_URL",
    heroNote: "$HERO_NOTE_URL",
  },
  shopify: {
    ...(window.DROP01_SITE_CONFIG?.shopify || {}),
    storeDomain: "$SHOPIFY_STORE_DOMAIN",
    storefrontAccessToken: "$SHOPIFY_STOREFRONT_ACCESS_TOKEN",
    apiVersion: "$SHOPIFY_API_VERSION",
    collectionHandle: "$SHOPIFY_COLLECTION_HANDLE",
    homeCollectionHandle: "$SHOPIFY_HOME_COLLECTION_HANDLE",
    shopCollectionHandle: "$SHOPIFY_SHOP_COLLECTION_HANDLE",
    featuredProductHandle: "$SHOPIFY_FEATURED_PRODUCT_HANDLE",
    homeProductLimit: $SHOPIFY_HOME_PRODUCT_LIMIT,
    shopProductLimit: $SHOPIFY_SHOP_PRODUCT_LIMIT,
  },
};
EOF

echo "Generated $OUTPUT_FILE"
