window.DROP01_SITE_CONFIG = {
  ...(window.DROP01_SITE_CONFIG || {}),
  submitTimeoutMs: 10000,
  hideImages:
    typeof window.DROP01_SITE_CONFIG?.hideImages === "boolean"
      ? window.DROP01_SITE_CONFIG.hideImages
      : false,
  webhooks: {
    ...(window.DROP01_SITE_CONFIG?.webhooks || {}),
    newsletterSubscribe: "",
    generalContact: "",
    designerIntake: "",
  },
  shopify: {
    ...(window.DROP01_SITE_CONFIG?.shopify || {}),
    storeDomain: "",
    storefrontAccessToken: "",
    apiVersion: "2026-01",
    collectionHandle: "",
    homeCollectionHandle: "",
    shopCollectionHandle: "",
    featuredProductHandle: "",
    homeProductLimit: 3,
    shopProductLimit: 6,
  },
};
