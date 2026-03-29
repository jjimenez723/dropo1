window.DROP01_SITE_CONFIG = {
  ...(window.DROP01_SITE_CONFIG || {}),
  submitTimeoutMs: 10000,
  webhooks: {
    ...(window.DROP01_SITE_CONFIG?.webhooks || {}),
    newsletterSubscribe: "https://n8n.bitesites.org/webhook/Email-Newsletter",
    generalContact: "https://n8n.bitesites.org/webhook/General-Contact-Form",
    designerIntake: "https://n8n.bitesites.org/webhook/Multi-Step-Designer",
    heroNote: "",
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
