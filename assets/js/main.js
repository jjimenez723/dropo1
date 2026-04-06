import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/+esm";
import { gsap } from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm";
import { ScrollTrigger } from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger/+esm";

gsap.registerPlugin(ScrollTrigger);

// Shared motion and UI helpers still power the inner pages, while the
// home page boots an isolated Three.js scene for the physical notice board.
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const mediaQueries = {
  coarsePointer: window.matchMedia("(pointer: coarse)"),
  hover: window.matchMedia("(hover: hover)"),
  compactViewport: window.matchMedia("(max-width: 800px)"),
};
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
const siteConfig = window.DROP01_SITE_CONFIG || {};
const hideImages = Boolean(siteConfig.hideImages);
const webhookConfig = siteConfig.webhooks || {};
const submitTimeoutMs =
  Number(siteConfig.submitTimeoutMs || siteConfig.formSubmitTimeoutMs) > 0
    ? Number(siteConfig.submitTimeoutMs || siteConfig.formSubmitTimeoutMs)
    : 10000;
const pendingSubmissionStorageKey = "drop01.pendingWebhookSubmissions";
const formDraftStorageKey = "drop01.formDrafts";
const webhookMap = {
  "newsletter-subscribe": normalizeWebhookUrl(webhookConfig.newsletterSubscribe),
  "general-contact": normalizeWebhookUrl(webhookConfig.generalContact),
  "designer-intake": normalizeWebhookUrl(webhookConfig.designerIntake),
  "hero-note": normalizeWebhookUrl(webhookConfig.heroNote),
};
const shopifyConfig = normalizeShopifyConfig(siteConfig.shopify || {});

// The SVG notes live in /dropo1. Using import.meta.url keeps the paths correct
// even though the module itself sits under assets/js.
const assetUrls = {
  d: new URL("../../dropo1/1.svg", import.meta.url).href,
  r: new URL("../../dropo1/2.svg", import.meta.url).href,
  o: new URL("../../dropo1/3.svg", import.meta.url).href,
  p: new URL("../../dropo1/4.svg", import.meta.url).href,
  zero: new URL("../../dropo1/5.svg", import.meta.url).href,
  one: new URL("../../dropo1/6.svg", import.meta.url).href,
  orange: new URL("../../dropo1/7.svg", import.meta.url).href,
  pink: new URL("../../dropo1/8.svg", import.meta.url).href,
  // Keep a cache-busted URL here so flyer artwork updates show up immediately
  // in the Three.js background layer instead of hanging onto an older texture.
  poster: new URL("../../dropo1/9.svg?rev=flyer-v2", import.meta.url).href,
  fallbackProduct: new URL("../../logo.png", import.meta.url).href,
};

init();

function hasCoarsePointer() {
  return mediaQueries.coarsePointer.matches;
}

function canHover() {
  return mediaQueries.hover.matches;
}

function isCompactViewport() {
  return mediaQueries.compactViewport.matches;
}

function init() {
  applyImageVisibilityMode();
  setupHeaderMotion();
  setupRevealAnimations();
  setupButtonMotion();
  setupPanelMediaMotion();
  setupForms();
  hydrateSavedFormDrafts();
  replayPendingWebhookSubmissions();
  setupShopMotion();
  void setupShopifyStorefront();
  setupModal();
  setupFloatingSubscribeCard();
  setupMultiStepForm();
  setupNoticeBoardHero();
}

function applyImageVisibilityMode() {
  document.body.classList.toggle("images-hidden", hideImages);
}

function setupHeaderMotion() {
  const header = document.querySelector(".site-header");
  if (!header) {
    return;
  }

  header.classList.remove("is-hidden");
  gsap.set(header, {
    yPercent: 0,
    autoAlpha: 1,
    backgroundColor: "#ffffff",
    boxShadow: "0 16px 36px rgba(0, 0, 0, 0.08)",
  });
}

function setupRevealAnimations() {
  const revealItems = $$(".reveal");
  if (!revealItems.length) {
    return;
  }

  if (prefersReducedMotion) {
    revealItems.forEach((item) => {
      item.style.opacity = "1";
      item.style.transform = "none";
    });
    return;
  }

  revealItems.forEach((item, index) => {
    gsap.fromTo(
      item,
      { autoAlpha: 0, y: 36 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        delay: index % 3 === 0 ? 0 : 0.05,
        scrollTrigger: {
          trigger: item,
          start: "top 84%",
        },
      }
    );
  });
}

function setupButtonMotion(scope = document) {
  if (prefersReducedMotion) {
    return;
  }

  const hoverEnabled = canHover() && !hasCoarsePointer();

  $$("[data-hover-lift]", scope).forEach((button) => {
    if (button.dataset.hoverLiftReady === "true") {
      return;
    }

    button.dataset.hoverLiftReady = "true";

    if (hoverEnabled) {
      button.addEventListener("mouseenter", () => {
        gsap.to(button, { y: -3, duration: 0.22, ease: "power2.out" });
      });
      button.addEventListener("mouseleave", () => {
        gsap.to(button, { y: 0, duration: 0.22, ease: "power2.out" });
      });
    }

    button.addEventListener("focus", () => {
      gsap.to(button, { y: -2, duration: 0.22, ease: "power2.out" });
    });
    button.addEventListener("blur", () => {
      gsap.to(button, { y: 0, duration: 0.22, ease: "power2.out" });
    });
  });
}

function setupPanelMediaMotion() {
  const panels = $$(".panel-media");
  if (!panels.length) {
    return;
  }

  const hoverEnabled = canHover() && !hasCoarsePointer();

  panels.forEach((panel) => {
    const cover = panel.querySelector(".panel-media__cover");
    if (!cover || panel.dataset.panelMediaReady === "true") {
      return;
    }

    panel.dataset.panelMediaReady = "true";

    if (prefersReducedMotion) {
      gsap.set(cover, { autoAlpha: 1, scale: 1 });
      return;
    }

    gsap.set(cover, { autoAlpha: 1, scale: 1.02, transformOrigin: "center center" });

    gsap.fromTo(
      cover,
      { autoAlpha: 0.72, scale: 0.99 },
      {
        autoAlpha: 1,
        scale: 1.04,
        duration: 1.1,
        ease: "power4.out",
        scrollTrigger: {
          trigger: panel,
          start: "top 86%",
        },
      }
    );

    const zoomIn = () => {
      gsap.to(cover, {
        scale: 1.08,
        duration: 0.34,
        ease: "power4.out",
        overwrite: "auto",
      });
    };

    const zoomOut = () => {
      gsap.to(cover, {
        scale: 1.02,
        duration: 0.62,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    if (hoverEnabled) {
      panel.addEventListener("pointerenter", zoomIn);
      panel.addEventListener("pointerleave", zoomOut);
    }
    panel.addEventListener("focusin", zoomIn);
    panel.addEventListener("focusout", zoomOut);
  });
}

function setFormFeedback(form, message, state = "success") {
  let slot = form.querySelector("[data-form-feedback]");
  if (!slot) {
    slot = document.createElement("p");
    slot.className = "form-feedback";
    slot.setAttribute("data-form-feedback", "");
    slot.setAttribute("aria-live", "polite");
    form.appendChild(slot);
  }

  slot.className = `form-feedback is-${state}`;
  slot.textContent = message;
}

function setupForms() {
  $$("form[data-webhook-form]").forEach((form) => {
    const saveDraft = () => {
      persistFormDraft(form);
    };

    form.addEventListener("input", saveDraft);
    form.addEventListener("change", saveDraft);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await submitWebhookForm(form);
    });
  });
}

async function submitWebhookForm(form) {
  const webhookKey = form.getAttribute("data-webhook-form");
  const webhookUrl = webhookMap[webhookKey];
  const submitButton = form.querySelector("[type='submit']");
  const idleLabel = submitButton?.dataset.idleLabel || submitButton?.textContent || "Submit";
  const successMessage =
    form.getAttribute("data-success-message") || "Submission received successfully.";

  if (!webhookUrl) {
    setFormFeedback(
      form,
      "This form is not configured yet. Add the matching n8n webhook URL in your site config.",
      "error"
    );
    return;
  }

  syncCustomFieldValidation(form);
  if (!form.reportValidity()) {
    return;
  }

  const payload = buildFormPayload(form, webhookKey);

  clearFormFeedback(form);
  toggleFormSubmitting(form, submitButton, true, idleLabel);

  try {
    persistFormDraft(form);
    await postJson(webhookUrl, payload);
    setFormFeedback(form, successMessage, "success");
    form.reset();
    clearFormDraft(form);
  } catch (error) {
    console.error(`DROP 01 form submission failed for ${webhookKey}.`, error);
    const isWorkflowError = error instanceof Error && error.message.includes("Error in workflow");
    const draftWasSaved = webhookKey !== "newsletter-subscribe" ? persistFormDraft(form) : false;

    if (webhookKey === "newsletter-subscribe") {
      queuePendingWebhookSubmission(webhookKey, webhookUrl, payload);
    }

    const message = getSubmissionErrorMessage(webhookKey, isWorkflowError, draftWasSaved);
    setFormFeedback(
      form,
      message,
      "error"
    );
  } finally {
    toggleFormSubmitting(form, submitButton, false, idleLabel);
  }
}

function toggleFormSubmitting(form, submitButton, isSubmitting, idleLabel) {
  form.classList.toggle("is-submitting", isSubmitting);

  $$("input, select, textarea, button", form).forEach((element) => {
    if (element instanceof HTMLButtonElement && element.type === "button") {
      return;
    }

    element.disabled = isSubmitting;
  });

  if (submitButton) {
    submitButton.dataset.idleLabel = idleLabel;
    submitButton.textContent = isSubmitting ? "Sending..." : idleLabel;
  }
}

function clearFormFeedback(form) {
  const slot = form.querySelector("[data-form-feedback]");
  if (slot) {
    slot.remove();
  }
}

function getSubmissionErrorMessage(webhookKey, isWorkflowError, draftWasSaved) {
  if (webhookKey === "newsletter-subscribe") {
    return isWorkflowError
      ? "The signup service is having a workflow issue. Your email was saved on this device and will retry automatically."
      : "The signup did not complete, but your email was saved on this device and will retry automatically.";
  }

  if (webhookKey === "general-contact") {
    if (isWorkflowError) {
      return draftWasSaved
        ? "The contact service is currently having a server issue. Your message draft was saved on this device, and you can also reach us at studio@drop01atelier.com."
        : "The contact service is currently having a server issue. Please try again shortly or email studio@drop01atelier.com.";
    }

    return draftWasSaved
      ? "The message did not go through. Your draft was saved on this device so you can retry in a moment."
      : "The message did not go through. Please try again in a moment.";
  }

  if (webhookKey === "designer-intake") {
    if (isWorkflowError) {
      return draftWasSaved
        ? "The designer application service is currently having a server issue. Your application draft was saved on this device so you can retry shortly."
        : "The designer application service is currently having a server issue. Please try again shortly.";
    }

    return draftWasSaved
      ? "The application did not go through. Your draft was saved on this device so you can retry in a moment."
      : "The application did not go through. Please try again in a moment.";
  }

  return draftWasSaved
    ? "The submission did not go through. Your draft was saved on this device so you can retry in a moment."
    : "The submission did not go through. Please try again in a moment.";
}

function normalizeWebhookUrl(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("your-n8n-domain")) {
    return "";
  }

  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }

    return trimmed;
  } catch {
    return "";
  }
}

function normalizeShopifyConfig(config) {
  const normalized = config && typeof config === "object" ? config : {};
  const storeDomain = normalizeShopifyStoreDomain(normalized.storeDomain);
  const storefrontAccessToken =
    typeof normalized.storefrontAccessToken === "string"
      ? normalized.storefrontAccessToken.trim()
      : "";
  const apiVersion =
    typeof normalized.apiVersion === "string" && normalized.apiVersion.trim()
      ? normalized.apiVersion.trim()
      : "2026-01";

  return {
    storeDomain,
    storefrontAccessToken,
    apiVersion,
    collectionHandle: normalizeHandle(normalized.collectionHandle),
    homeCollectionHandle: normalizeHandle(normalized.homeCollectionHandle),
    shopCollectionHandle: normalizeHandle(normalized.shopCollectionHandle),
    featuredProductHandle: normalizeHandle(normalized.featuredProductHandle),
    homeProductLimit: getPositiveInteger(normalized.homeProductLimit, 3),
    shopProductLimit: getPositiveInteger(normalized.shopProductLimit, 6),
    enabled: Boolean(storeDomain && storefrontAccessToken),
  };
}

function normalizeShopifyStoreDomain(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed = trimmed.includes("://") ? new URL(trimmed) : new URL(`https://${trimmed}`);
    return parsed.hostname.replace(/\/+$/, "");
  } catch {
    return "";
  }
}

function normalizeHandle(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getPositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] || character
  );
}

function sanitizeUrl(value, fallback = "#") {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  try {
    const parsed = new URL(value, window.location.href);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return fallback;
    }

    return parsed.href;
  } catch {
    return fallback;
  }
}

function truncateText(value, maxLength = 150) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function formatMoney(money) {
  const amount = Number(money?.amount);
  const currencyCode =
    typeof money?.currencyCode === "string" && money.currencyCode ? money.currencyCode : "USD";

  if (!Number.isFinite(amount)) {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function formatPriceRange(priceRange) {
  const minimum = formatMoney(priceRange?.minVariantPrice);
  const maximum = formatMoney(priceRange?.maxVariantPrice);

  if (!minimum && !maximum) {
    return "";
  }

  if (!maximum || minimum === maximum) {
    return minimum || maximum;
  }

  return `${minimum} - ${maximum}`;
}

function getProductUrl(product) {
  return sanitizeUrl(
    typeof product?.onlineStoreUrl === "string" && product.onlineStoreUrl
      ? product.onlineStoreUrl
      : `https://${shopifyConfig.storeDomain}/products/${product?.handle || ""}`
  );
}

function getProductSummary(product) {
  const description = truncateText(product?.description || "", 150);
  if (description) {
    return description;
  }

  return "Limited-run designer piece synced directly from the connected Shopify storefront.";
}

function getProductImages(product) {
  const images = Array.isArray(product?.images?.nodes) ? product.images.nodes : [];
  const featuredImage = product?.featuredImage ? [product.featuredImage] : [];
  const deduped = [...featuredImage, ...images].filter(
    (image, index, source) =>
      image?.url &&
      source.findIndex((candidate) => candidate?.url === image.url) === index
  );

  return deduped.slice(0, 2);
}

function getProductBadgeCopy(product) {
  const availability = product?.availableForSale ? "Available now" : "Currently sold out";
  const compareAt = formatMoney(product?.compareAtPriceRange?.maxVariantPrice);
  const price = formatPriceRange(product?.priceRange);

  if (compareAt && price && compareAt !== price) {
    return [availability, `Compare at ${compareAt}`];
  }

  return [availability, "Synced from Shopify"];
}

function validateSimpleUrlField(field) {
  if (!(field instanceof HTMLInputElement) || !field.hasAttribute("data-simple-url")) {
    return true;
  }

  const trimmed = field.value.trim();
  const isValid = trimmed === "" || trimmed.includes(".");

  field.setCustomValidity(isValid ? "" : "Enter a link with a dot, like studio.com.");
  return isValid;
}

function syncCustomFieldValidation(scope = document) {
  $$("[data-simple-url]", scope).forEach((field) => {
    validateSimpleUrlField(field);
  });
}

function buildFormPayload(form, webhookKey) {
  const formData = new FormData(form);
  const fields = Object.fromEntries(
    Array.from(formData.entries(), ([key, value]) => [key, typeof value === "string" ? value.trim() : value])
  );
  const email = typeof fields.email === "string" ? fields.email : "";
  const name = typeof fields.name === "string" ? fields.name : "";
  const message = typeof fields.message === "string" ? fields.message : "";
  const inquiryType = typeof fields.type === "string" ? fields.type : "";
  const context = buildSubmissionContext();
  const normalizedSubmission = {
    formType: webhookKey,
    email,
    name,
    message,
    inquiryType,
    ...context,
  };

  const flatFields = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, typeof value === "string" ? value : String(value ?? "")])
  );

  return {
    ...flatFields,
    email,
    Email: email,
    emailAddress: email,
    email_address: email,
    name,
    Name: name,
    fullName: name,
    message,
    Message: message,
    inquiryType,
    ...context,
    formType: webhookKey,
    "Date Sent": context.dateSent,
    fieldsJson: JSON.stringify(flatFields),
    submissionJson: JSON.stringify(normalizedSubmission),
    metadataJson: JSON.stringify(context),
  };
}

function buildHeroNotePayload(note) {
  const trimmedNote = note.trim();
  const context = buildSubmissionContext();
  const normalizedSubmission = {
    formType: "hero-note",
    note: trimmedNote,
    message: trimmedNote,
    ...context,
  };

  return {
    note: trimmedNote,
    Note: trimmedNote,
    message: trimmedNote,
    Message: trimmedNote,
    ...context,
    formType: "hero-note",
    "Date Sent": context.dateSent,
    metadataJson: JSON.stringify(context),
    submissionJson: JSON.stringify(normalizedSubmission),
  };
}

function buildFormDraftData(form) {
  const formData = new FormData(form);

  return Object.fromEntries(
    Array.from(formData.entries(), ([key, value]) => [key, typeof value === "string" ? value : String(value ?? "")])
  );
}

function getFormDraftKey(form) {
  const webhookKey = form.getAttribute("data-webhook-form") || "form";
  const page = window.location.pathname.split("/").pop() || "index.html";
  const formId = form.id || form.getAttribute("name") || form.getAttribute("data-form-id") || "";

  return `${page}::${webhookKey}::${formId}`;
}

function persistFormDraft(form) {
  const drafts = readFormDrafts();
  const draftKey = getFormDraftKey(form);
  const fields = buildFormDraftData(form);
  const hasAnyValue = Object.values(fields).some((value) => value.trim() !== "");

  if (!hasAnyValue) {
    if (!(draftKey in drafts)) {
      return false;
    }

    delete drafts[draftKey];
    writeFormDrafts(drafts);
    return false;
  }

  drafts[draftKey] = {
    fields,
    updatedAt: new Date().toISOString(),
  };
  writeFormDrafts(drafts);
  return true;
}

function clearFormDraft(form) {
  const drafts = readFormDrafts();
  const draftKey = getFormDraftKey(form);

  if (!(draftKey in drafts)) {
    return;
  }

  delete drafts[draftKey];
  writeFormDrafts(drafts);
}

function hydrateSavedFormDrafts() {
  const drafts = readFormDrafts();

  $$("form[data-webhook-form]").forEach((form) => {
    const draft = drafts[getFormDraftKey(form)];
    if (!draft || typeof draft !== "object" || !draft.fields || typeof draft.fields !== "object") {
      return;
    }

    applyFormDraft(form, draft.fields);
  });
}

function applyFormDraft(form, fields) {
  Array.from(form.elements).forEach((element) => {
    if (
      !(element instanceof HTMLInputElement) &&
      !(element instanceof HTMLTextAreaElement) &&
      !(element instanceof HTMLSelectElement)
    ) {
      return;
    }

    if (!element.name || !(element.name in fields)) {
      return;
    }

    if ((element.type === "checkbox" || element.type === "radio") && typeof fields[element.name] === "string") {
      element.checked = fields[element.name] === element.value;
      return;
    }

    element.value = String(fields[element.name] ?? "");
  });
}

function formatLocalDate(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildSubmissionContext(now = new Date()) {
  const url = new URL(window.location.href);
  const utmParams = url.searchParams;
  const timezone = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
      return "";
    }
  })();
  const screenWidth =
    typeof window.screen?.width === "number" && Number.isFinite(window.screen.width)
      ? window.screen.width
      : 0;
  const screenHeight =
    typeof window.screen?.height === "number" && Number.isFinite(window.screen.height)
      ? window.screen.height
      : 0;
  const viewportWidth = Number.isFinite(window.innerWidth) ? window.innerWidth : 0;
  const viewportHeight = Number.isFinite(window.innerHeight) ? window.innerHeight : 0;

  return {
    page: window.location.pathname.split("/").pop() || "index.html",
    sourceUrl: window.location.href,
    referrer: document.referrer || "",
    language: navigator.language || "",
    timezone,
    submittedAt: now.toISOString(),
    dateSent: formatLocalDate(now),
    viewportWidth,
    viewportHeight,
    screenWidth,
    screenHeight,
    utmSource: utmParams.get("utm_source") || "",
    utmMedium: utmParams.get("utm_medium") || "",
    utmCampaign: utmParams.get("utm_campaign") || "",
    utmContent: utmParams.get("utm_content") || "",
    utmTerm: utmParams.get("utm_term") || "",
  };
}

function isCrossOriginRequest(url) {
  try {
    return new URL(url, window.location.href).origin !== window.location.origin;
  } catch {
    return false;
  }
}

function buildWebhookBody(payload) {
  const body = new URLSearchParams();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    body.append(key, typeof value === "string" ? value : String(value));
  });

  return body;
}

async function postJson(url, payload) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), submitTimeoutMs);
  const isCrossOrigin = isCrossOriginRequest(url);
  const body = buildWebhookBody(payload);

  try {
    let response;

    try {
      response = await fetch(url, {
        method: "POST",
        mode: "cors",
        body,
        signal: controller.signal,
      });
    } catch (error) {
      if (!isCrossOrigin) {
        throw error;
      }

      response = await fetch(url, {
        method: "POST",
        mode: "no-cors",
        body,
        signal: controller.signal,
      });
    }

    if (response.type === "opaque") {
      return;
    }

    const rawBody = await response.text();
    let responseMessage = "";

    if (rawBody) {
      try {
        const parsed = JSON.parse(rawBody);
        if (parsed && typeof parsed.message === "string") {
          responseMessage = parsed.message;
        }
      } catch {
        responseMessage = rawBody.trim();
      }
    }

    if (!response.ok) {
      throw new Error(
        responseMessage
          ? `Webhook responded with ${response.status}: ${responseMessage}`
          : `Webhook responded with ${response.status}`
      );
    }
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function queuePendingWebhookSubmission(webhookKey, webhookUrl, payload) {
  const queue = readPendingWebhookSubmissions();
  const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";

  if (!email) {
    return;
  }

  const duplicateIndex = queue.findIndex(
    (entry) =>
      entry?.webhookKey === webhookKey &&
      entry?.webhookUrl === webhookUrl &&
      typeof entry?.payload?.email === "string" &&
      entry.payload.email.trim().toLowerCase() === email
  );

  const nextEntry = {
    webhookKey,
    webhookUrl,
    payload,
    queuedAt: new Date().toISOString(),
  };

  if (duplicateIndex >= 0) {
    queue[duplicateIndex] = nextEntry;
  } else {
    queue.push(nextEntry);
  }

  writePendingWebhookSubmissions(queue);
}

async function replayPendingWebhookSubmissions() {
  const queue = readPendingWebhookSubmissions();
  if (!queue.length) {
    return;
  }

  const remaining = [];

  for (const entry of queue) {
    const webhookUrl =
      normalizeWebhookUrl(entry?.webhookUrl) || normalizeWebhookUrl(webhookMap[entry?.webhookKey]);

    if (!webhookUrl || !entry?.payload) {
      continue;
    }

    try {
      await postJson(webhookUrl, entry.payload);
      console.info(`DROP 01 replayed queued ${entry.webhookKey} submission successfully.`);
    } catch (error) {
      console.warn(`DROP 01 replay failed for queued ${entry.webhookKey} submission.`, error);
      remaining.push(entry);
    }
  }

  writePendingWebhookSubmissions(remaining);
}

function readPendingWebhookSubmissions() {
  try {
    const raw = window.localStorage.getItem(pendingSubmissionStorageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePendingWebhookSubmissions(queue) {
  try {
    if (!queue.length) {
      window.localStorage.removeItem(pendingSubmissionStorageKey);
      return;
    }

    window.localStorage.setItem(pendingSubmissionStorageKey, JSON.stringify(queue));
  } catch (error) {
    console.warn("DROP 01 could not persist pending webhook submissions.", error);
  }
}

function readFormDrafts() {
  try {
    const raw = window.localStorage.getItem(formDraftStorageKey);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeFormDrafts(drafts) {
  try {
    if (!Object.keys(drafts).length) {
      window.localStorage.removeItem(formDraftStorageKey);
      return;
    }

    window.localStorage.setItem(formDraftStorageKey, JSON.stringify(drafts));
  } catch (error) {
    console.warn("DROP 01 could not persist form drafts.", error);
  }
}

async function setupShopifyStorefront() {
  if (!shopifyConfig.enabled) {
    return;
  }

  const homeGrid = document.querySelector('[data-shopify-grid="home"]');
  const shopGrid = document.querySelector('[data-shopify-grid="shop"]');
  const featuredBanner = document.querySelector("[data-shopify-featured]");

  if (!homeGrid && !shopGrid && !featuredBanner) {
    return;
  }

  const sharedCollectionHandle = shopifyConfig.collectionHandle;
  const homeCollectionHandle = shopifyConfig.homeCollectionHandle || sharedCollectionHandle;
  const shopCollectionHandle = shopifyConfig.shopCollectionHandle || sharedCollectionHandle;
  const homeLimit = getPositiveInteger(
    homeGrid?.getAttribute("data-shopify-limit"),
    shopifyConfig.homeProductLimit
  );
  const shopLimit = getPositiveInteger(
    shopGrid?.getAttribute("data-shopify-limit"),
    shopifyConfig.shopProductLimit
  );
  const feedCache = new Map();
  const loadFeed = (collectionHandle, limit) => {
    const key = `${collectionHandle || "all"}::${limit}`;
    if (!feedCache.has(key)) {
      feedCache.set(key, fetchShopifyFeed({ collectionHandle, limit }));
    }

    return feedCache.get(key);
  };

  try {
    const [homeFeed, shopFeed, explicitFeaturedProduct] = await Promise.all([
      homeGrid ? loadFeed(homeCollectionHandle, homeLimit) : Promise.resolve(null),
      shopGrid || featuredBanner ? loadFeed(shopCollectionHandle, shopLimit) : Promise.resolve(null),
      shopifyConfig.featuredProductHandle
        ? fetchShopifyProductByHandle(shopifyConfig.featuredProductHandle)
        : Promise.resolve(null),
    ]);

    if (homeGrid && homeFeed?.products?.length) {
      renderShopifyGrid(homeGrid, homeFeed.products.slice(0, homeLimit));
    }

    if (shopGrid && shopFeed?.products?.length) {
      renderShopifyGrid(shopGrid, shopFeed.products.slice(0, shopLimit));
    }

    if (featuredBanner) {
      const featuredProduct =
        explicitFeaturedProduct ||
        selectFeaturedProduct(shopFeed?.products) ||
        selectFeaturedProduct(homeFeed?.products);

      if (featuredProduct) {
        renderFeaturedProductBanner(featuredBanner, {
          product: featuredProduct,
          collectionTitle: shopFeed?.title || homeFeed?.title || "",
          productCount: shopFeed?.products?.length || homeFeed?.products?.length || 0,
        });
      }
    }
  } catch (error) {
    console.error("DROP 01 Shopify storefront sync failed.", error);
  }
}

async function fetchShopifyFeed({ collectionHandle = "", limit = 6 }) {
  if (collectionHandle) {
    const data = await postShopifyStorefrontQuery(
      `
        query Drop01CollectionProducts($handle: String!, $limit: Int!) {
          collection(handle: $handle) {
            title
            handle
            products(first: $limit) {
              nodes {
                id
                title
                handle
                vendor
                description
                tags
                availableForSale
                onlineStoreUrl
                featuredImage {
                  url
                  altText
                }
                images(first: 2) {
                  nodes {
                    url
                    altText
                  }
                }
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                  maxVariantPrice {
                    amount
                    currencyCode
                  }
                }
                compareAtPriceRange {
                  maxVariantPrice {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      `,
      { handle: collectionHandle, limit }
    );

    return {
      title: data?.collection?.title || "",
      handle: data?.collection?.handle || collectionHandle,
      products: Array.isArray(data?.collection?.products?.nodes) ? data.collection.products.nodes : [],
    };
  }

  const data = await postShopifyStorefrontQuery(
    `
      query Drop01Products($limit: Int!) {
        products(first: $limit, sortKey: UPDATED_AT, reverse: true) {
          nodes {
            id
            title
            handle
            vendor
            description
            tags
            availableForSale
            onlineStoreUrl
            featuredImage {
              url
              altText
            }
            images(first: 2) {
              nodes {
                url
                altText
              }
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
              maxVariantPrice {
                amount
                currencyCode
              }
            }
            compareAtPriceRange {
              maxVariantPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    `,
    { limit }
  );

  return {
    title: "Storefront",
    handle: "",
    products: Array.isArray(data?.products?.nodes) ? data.products.nodes : [],
  };
}

async function fetchShopifyProductByHandle(handle) {
  const data = await postShopifyStorefrontQuery(
    `
      query Drop01FeaturedProduct($handle: String!) {
        product(handle: $handle) {
          id
          title
          handle
          vendor
          description
          tags
          availableForSale
          onlineStoreUrl
          featuredImage {
            url
            altText
          }
          images(first: 2) {
            nodes {
              url
              altText
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          compareAtPriceRange {
            maxVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    `,
    { handle }
  );

  return data?.product || null;
}

async function postShopifyStorefrontQuery(query, variables = {}) {
  const response = await fetch(
    `https://${shopifyConfig.storeDomain}/api/${shopifyConfig.apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": shopifyConfig.storefrontAccessToken,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  if (!response.ok) {
    throw new Error(`Shopify responded with ${response.status}`);
  }

  const payload = await response.json();
  if (Array.isArray(payload?.errors) && payload.errors.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  return payload?.data || {};
}

function selectFeaturedProduct(products) {
  if (!Array.isArray(products) || !products.length) {
    return null;
  }

  return (
    products.find((product) =>
      Array.isArray(product?.tags) &&
      product.tags.some((tag) => ["featured", "drop-featured"].includes(String(tag).toLowerCase()))
    ) || products[0]
  );
}

function renderShopifyGrid(grid, products) {
  if (!Array.isArray(products) || !products.length) {
    return;
  }

  grid.innerHTML = products.map((product) => renderProductCard(product)).join("");
  setupButtonMotion(grid);

  const cards = $$(".drop-card", grid);
  if (!prefersReducedMotion && cards.length) {
    gsap.fromTo(
      cards,
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 0.58, ease: "power3.out", stagger: 0.08 }
    );
  }

  ScrollTrigger.refresh();
}

function renderProductCard(product) {
  const productUrl = getProductUrl(product);
  const [primaryImage, secondaryImage] = getProductImages(product);
  const primaryImageUrl = sanitizeUrl(primaryImage?.url, assetUrls.fallbackProduct);
  const secondaryImageUrl = sanitizeUrl(secondaryImage?.url || primaryImage?.url, primaryImageUrl);
  const primaryAlt = escapeHtml(primaryImage?.altText || product?.title || "DROP 01 product");
  const secondaryAlt = escapeHtml(secondaryImage?.altText || product?.title || "DROP 01 product detail");
  const badges = getProductBadgeCopy(product);
  const price = formatPriceRange(product?.priceRange) || "See store";
  const compareAt = formatMoney(product?.compareAtPriceRange?.maxVariantPrice);
  const compareMarkup =
    compareAt && compareAt !== price
      ? `<span class="drop-card__compare-price">${escapeHtml(compareAt)}</span>`
      : "";
  const mediaMarkup = hideImages
    ? ""
    : `
      <a class="drop-card__media" href="${escapeHtml(productUrl)}" target="_blank" rel="noreferrer">
        <img src="${escapeHtml(primaryImageUrl)}" alt="${primaryAlt}" loading="lazy" />
        <img src="${escapeHtml(secondaryImageUrl)}" alt="${secondaryAlt}" loading="lazy" />
      </a>
    `;

  return `
    <article class="drop-card" data-shopify-product-card>
      ${mediaMarkup}
      <div class="drop-card__body">
        <div class="drop-card__meta">
          <span>${escapeHtml(product?.vendor || "Independent designer")}</span>
          <div class="drop-card__price-stack">
            <strong>${escapeHtml(price)}</strong>
            ${compareMarkup}
          </div>
        </div>
        <h3>${escapeHtml(product?.title || "Untitled piece")}</h3>
        <p>${escapeHtml(getProductSummary(product))}</p>
        <div class="pill-row drop-card__status">
          ${badges.map((badge) => `<span>${escapeHtml(badge)}</span>`).join("")}
        </div>
        <div class="drop-actions">
          <a class="button" href="${escapeHtml(productUrl)}" target="_blank" rel="noreferrer" data-hover-lift>
            ${product?.availableForSale ? "Shop Now" : "View Product"}
          </a>
        </div>
      </div>
    </article>
  `;
}

function renderFeaturedProductBanner(banner, { product, collectionTitle, productCount }) {
  const label = banner.querySelector("[data-shopify-featured-label]");
  const title = banner.querySelector("[data-shopify-featured-title]");
  const body = banner.querySelector("[data-shopify-featured-body]");
  const primaryLink = banner.querySelector("[data-shopify-featured-primary]");
  const primaryMetricLabel = banner.querySelector('[data-shopify-featured-metric-label="primary"]');
  const primaryMetricValue = banner.querySelector('[data-shopify-featured-metric-value="primary"]');
  const primaryMetricCopy = banner.querySelector('[data-shopify-featured-metric-copy="primary"]');
  const secondaryMetricLabel = banner.querySelector('[data-shopify-featured-metric-label="secondary"]');
  const secondaryMetricValue = banner.querySelector('[data-shopify-featured-metric-value="secondary"]');
  const secondaryMetricCopy = banner.querySelector('[data-shopify-featured-metric-copy="secondary"]');
  const productUrl = getProductUrl(product);
  const price = formatPriceRange(product?.priceRange) || "See store";

  if (label) {
    label.textContent = collectionTitle ? `${collectionTitle} / Shopify sync` : "Featured drop";
  }

  if (title) {
    title.textContent = `${product?.vendor || "Designer"} / ${product?.title || "Featured product"}`;
  }

  if (body) {
    body.textContent = getProductSummary(product);
  }

  if (primaryLink) {
    primaryLink.textContent = product?.availableForSale ? "Shop Featured Piece" : "View Featured Piece";
    primaryLink.href = productUrl;
    primaryLink.target = "_blank";
    primaryLink.rel = "noreferrer";
  }

  if (primaryMetricLabel) {
    primaryMetricLabel.textContent = "Store sync";
  }

  if (primaryMetricValue) {
    primaryMetricValue.textContent = `${Math.max(productCount, 1)} live product${Math.max(productCount, 1) === 1 ? "" : "s"}`;
  }

  if (primaryMetricCopy) {
    primaryMetricCopy.textContent = "Cards and imagery now refresh from the connected Shopify storefront on page load.";
  }

  if (secondaryMetricLabel) {
    secondaryMetricLabel.textContent = "Featured price";
  }

  if (secondaryMetricValue) {
    secondaryMetricValue.textContent = price;
  }

  if (secondaryMetricCopy) {
    secondaryMetricCopy.textContent = product?.availableForSale
      ? "Available now in Shopify with live imagery, title, and pricing."
      : "Product remains visible here even when Shopify marks it unavailable.";
  }
}

function updateCountdown(element) {
  const targetDate = element.getAttribute("data-countdown");
  if (!targetDate) {
    return;
  }

  const end = new Date(targetDate).getTime();
  if (Number.isNaN(end)) {
    return;
  }

  const slots = {
    days: element.querySelector("[data-unit='days']"),
    hours: element.querySelector("[data-unit='hours']"),
    minutes: element.querySelector("[data-unit='minutes']"),
    seconds: element.querySelector("[data-unit='seconds']"),
  };

  const render = () => {
    const now = Date.now();
    const diff = Math.max(end - now, 0);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    if (slots.days) slots.days.textContent = String(days).padStart(2, "0");
    if (slots.hours) slots.hours.textContent = String(hours).padStart(2, "0");
    if (slots.minutes) slots.minutes.textContent = String(minutes).padStart(2, "0");
    if (slots.seconds) slots.seconds.textContent = String(seconds).padStart(2, "0");
  };

  render();
  window.setInterval(render, 1000);
}

function setupShopMotion() {
  $$("[data-countdown]").forEach(updateCountdown);

  $$("[data-progress]").forEach((block) => {
    const fill = block.querySelector(".progress-fill");
    const value = Number(block.getAttribute("data-progress")) || 0;
    if (!fill) {
      return;
    }

    if (prefersReducedMotion) {
      fill.style.width = `${value}%`;
      return;
    }

    gsap.to(fill, {
      width: `${value}%`,
      duration: 1.2,
      ease: "power3.out",
      scrollTrigger: {
        trigger: block,
        start: "top 88%",
      },
    });
  });
}

function setupModal() {
  const modal = document.querySelector("[data-subscribe-modal]");
  if (!modal) {
    return;
  }

  const openButtons = $$("[data-open-modal]");
  const closeButtons = $$("[data-close-modal]", modal);
  const stateKey = "drop01-modal-dismissed";

  const openModal = ({ force = false } = {}) => {
    if (modal.getAttribute("aria-hidden") === "false") {
      return;
    }

    if (!force && sessionStorage.getItem(stateKey) === "true") {
      return;
    }

    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    if (!prefersReducedMotion) {
      gsap.fromTo(
        modal.querySelector(".subscribe-modal__panel"),
        { autoAlpha: 0, y: 24, scale: 0.98 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out" }
      );
    }
  };

  const closeModal = () => {
    sessionStorage.setItem(stateKey, "true");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  openButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      openModal({ force: true });
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.classList.contains("subscribe-modal__scrim")) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
      closeModal();
    }
  });

  if (document.body.classList.contains("page-home") && sessionStorage.getItem(stateKey) !== "true") {
    window.setTimeout(() => openModal(), 3200);
    const onScroll = () => {
      const threshold = window.innerHeight * 0.45;
      if (window.scrollY > threshold) {
        openModal();
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
  }
}

function setupFloatingSubscribeCard() {
  const card = document.querySelector("[data-delayed-subscribe]");
  if (!card) {
    return;
  }

  let shown = false;

  const showCard = () => {
    if (shown) {
      return;
    }

    shown = true;
    card.hidden = false;
    card.classList.add("is-visible");

    if (!prefersReducedMotion) {
      gsap.fromTo(
        card,
        { autoAlpha: 0, y: 24, rotation: 2.5 },
        { autoAlpha: 1, y: 0, rotation: 0, duration: 0.72, ease: "power3.out" }
      );
    }

    window.removeEventListener("scroll", onScroll);
  };

  const onScroll = () => {
    if (window.scrollY > window.innerHeight * 0.12) {
      showCard();
    }
  };

  window.setTimeout(showCard, 1600);
  window.addEventListener("scroll", onScroll, { passive: true });
}

function setupMultiStepForm() {
  const form = document.querySelector("[data-multistep-form]");
  if (!form) {
    return;
  }

  const steps = $$(".form-step", form);
  const indicators = $$("[data-step-marker]");
  let currentStep = 0;

  form.addEventListener("input", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      validateSimpleUrlField(target);
    }
  });

  function renderStep(nextStep) {
    currentStep = Math.max(0, Math.min(nextStep, steps.length - 1));
    steps.forEach((step, index) => {
      const active = index === currentStep;
      step.classList.toggle("is-active", active);
      step.setAttribute("aria-hidden", String(!active));
    });
    indicators.forEach((marker, index) => {
      marker.classList.toggle("is-active", index === currentStep);
    });

    const activeStep = steps[currentStep];
    if (activeStep && !prefersReducedMotion) {
      gsap.fromTo(
        activeStep,
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.42, ease: "power2.out" }
      );
    }
  }

  form.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.hasAttribute("data-next")) {
      event.preventDefault();
      const currentStepFields = $$("input, select, textarea", steps[currentStep]).filter(
        (field) => !field.disabled
      );

      currentStepFields.forEach((field) => {
        validateSimpleUrlField(field);
      });
      const isValid = currentStepFields.every((field) => field.checkValidity());
      if (!isValid) {
        const firstInvalid = currentStepFields.find((field) => !field.checkValidity());
        firstInvalid?.reportValidity();
        return;
      }

      renderStep(currentStep + 1);
    }

    if (target.hasAttribute("data-prev")) {
      event.preventDefault();
      renderStep(currentStep - 1);
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  form.addEventListener("reset", () => {
    window.setTimeout(() => renderStep(0), 0);
  });

  renderStep(0);
}

async function setupNoticeBoardHero() {
  const hero = document.querySelector("[data-notice-board]");
  const canvas = document.querySelector("#notice-board-canvas");
  if (!hero || !canvas) {
    return;
  }

  const boardShell = hero.querySelector(".hero__board-shell");
  const mobileLogoSlot = hero.querySelector(".hero__logo-slot");
  const noteForm = hero.querySelector("[data-note-form]");
  const noteInput = hero.querySelector("[data-note-input]");
  const noteStatus = hero.querySelector("[data-note-status]");
  let heroQuality = getHeroQualityProfile();

  function getNavigatorCapability(name) {
    const value = Number(window.navigator?.[name]);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  function isLowEndHeroDevice() {
    const deviceMemory = getNavigatorCapability("deviceMemory");
    const hardwareConcurrency = getNavigatorCapability("hardwareConcurrency");

    return (
      (deviceMemory !== null && deviceMemory <= 4) ||
      (hardwareConcurrency !== null && hardwareConcurrency <= 4)
    );
  }

  function getHeroQualityProfile() {
    const width = window.innerWidth;

    if (width <= 800) {
      const lowEndProfile = isLowEndHeroDevice();

      return {
        antialias: !lowEndProfile,
        pixelRatioCap: lowEndProfile ? 1.25 : 2,
        shadows: false,
        shadowMapSize: 0,
        posterCount: 40,
        posterHeight: 1.5,
        motionScale: width <= 560 ? 0.58 : 0.74,
        frameInterval: lowEndProfile ? 1000 / 30 : 1000 / 40,
        textureSize: lowEndProfile
          ? { width: 768, height: 576 }
          : { width: 1024, height: 768 },
        maxAnisotropy: lowEndProfile ? 4 : 8,
      };
    }

    return {
      antialias: true,
      pixelRatioCap: 1.8,
      shadows: true,
      shadowMapSize: 2048,
      posterCount: 70,
      posterHeight: 2,
      motionScale: 1,
      frameInterval: 1000 / 60,
      textureSize: { width: 1024, height: 768 },
      maxAnisotropy: 8,
    };
  }

  // The orthographic camera keeps the board feeling flat and graphic, while
  // the note meshes still get real Z-depth for shadows and subtle flutter.
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: heroQuality.antialias,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, heroQuality.pixelRatioCap));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = heroQuality.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  camera.position.set(0, 0, 28);
  camera.lookAt(0, 0, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.45);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
  keyLight.position.set(6, 10, 18);
  keyLight.castShadow = heroQuality.shadows;
  if (heroQuality.shadows) {
    keyLight.shadow.mapSize.set(heroQuality.shadowMapSize, heroQuality.shadowMapSize);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -18;
    keyLight.shadow.camera.right = 18;
    keyLight.shadow.camera.top = 18;
    keyLight.shadow.camera.bottom = -18;
    keyLight.shadow.bias = -0.0003;
  }
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xa1bace, 0.52);
  fillLight.position.set(-8, -6, 14);
  scene.add(fillLight);

  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShadowMaterial({
      transparent: true,
      opacity: 0.24,
    })
  );
  board.position.set(0, 0, -8);
  board.receiveShadow = heroQuality.shadows;
  board.visible = heroQuality.shadows;
  scene.add(board);

  const textureLoader = new THREE.TextureLoader();
  const textureCache = new Map();
  const noteMeshes = [];
  const heroNoteMeshes = new Map();
  const scrollState = { progress: 0, gust: 0 };
  const scrollResponse = {
    progressMultiplier: 1.45,
    scrub: 0.28,
    gustVelocityDivisor: 1650,
    gustMultiplier: 1.2,
    gustResetDelay: 160,
    xProgressInfluence: 0.28,
    yProgressInfluence: 1.22,
    yGustInfluence: 0.4,
  };
  const view = { halfHeight: 8, halfWidth: 8, height: 16, width: 16 };
  const heroLineKeys = ["d", "r", "o", "p", "zero", "one", "orange", "pink"];
  const heroLogoKeys = new Set(heroLineKeys);
  const heroDetachThresholdMultiplier = 0.52;
  const heroNoteRotations = {
    d: -0.04,
    r: 0.03,
    o: -0.03,
    p: 0.03,
    zero: -0.02,
    one: 0.02,
    orange: -0.04,
    pink: 0.03,
  };
  const heroLayoutPresets = {
    desktop: {
      lineY: 0.5,
      maxHeight: 0.28,
      widthFill: 0.9,
      gap: 0.022,
    },
    laptop: {
      lineY: 0.5,
      maxHeight: 0.24,
      widthFill: 0.98,
      gap: 0.018,
    },
    tablet: {
      lineY: 0.16,
      maxHeight: 0.18,
      widthFill: 0.94,
      gap: 0.012,
      slotRows: 2,
      slotHeightFill: 0.92,
      slotRowGap: 0.08,
    },
    mobile: {
      lineY: 0.14,
      maxHeight: 0.11,
      widthFill: 0.95,
      gap: 0.012,
      slotRows: 2,
      slotHeightFill: 0.94,
      slotRowGap: 0.08,
    },
  };

  // Dragging works by raycasting the pointer into the scene, then intersecting
  // that ray with a plane locked to the selected note's Z position.
  const pointer = new THREE.Vector2();
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const dragPoint = new THREE.Vector3();
  const dragOffset = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const swipeHistory = [];

  let activeNote = null;
  const boardFrontStartZ = 9;
  const logoFrontStartZ = 12.6;
  let boardFrontZ = boardFrontStartZ;
  let logoFrontZ = logoFrontStartZ;
  let rafId = 0;
  let gustResetId = 0;
  let resizeRafId = 0;
  let visibilityObserver = null;
  let heroInView = true;
  let pageVisible = !document.hidden;
  let lastRenderTime = 0;

  const setGust = gsap.quickTo(scrollState, "gust", {
    duration: 0.45,
    ease: "power2.out",
  });

  if (noteInput) {
    noteInput.disabled = true;
  }

  if (noteStatus) {
    noteStatus.textContent = "Preparing the wall...";
  }

  try {
    const textures = await loadTextures();
    resizeScene();
    buildBackgroundLayer(textures.poster);
    buildHeroNotes(textures);
    setupScrollWind();
    bindPointerEvents();
    bindNoteForm();
    revealHeroOverlay();
    observeHeroVisibility();

    if (noteInput) {
      noteInput.disabled = false;
    }
    if (noteStatus) {
<<<<<<< HEAD
      noteStatus.textContent = "Type a thought and pin it to the wall.";
=======
      noteStatus.textContent = " ";
>>>>>>> 129d1545f101b8c04b95141f0ca2929739cd73d5
    }

    window.addEventListener("resize", requestResizeScene, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    syncRenderLoop();
    ScrollTrigger.refresh();
  } catch (error) {
    console.error("DROP 01 notice board failed to initialize.", error);
    if (noteStatus) {
      noteStatus.textContent = "The wall could not load right now. Refresh and try again.";
    }
  }

  function loadTexture(url) {
    if (textureCache.has(url)) {
      return textureCache.get(url);
    }

    const promise = new Promise((resolve, reject) => {
      textureLoader.load(
        url,
        (texture) => {
          resolve(applyHeroTextureQuality(texture));
        },
        undefined,
        reject
      );
    });

    textureCache.set(url, promise);
    return promise;
  }

  async function loadTextures() {
    const loaded = await Promise.all(
      Object.entries(assetUrls).map(async ([key, url]) => [key, await loadTexture(url)])
    );

    return Object.fromEntries(loaded);
  }

  function textureAspect(texture) {
    const image = texture.image;
    const width = image?.naturalWidth || image?.videoWidth || image?.width || 1;
    const height = image?.naturalHeight || image?.videoHeight || image?.height || 1;
    return width / height;
  }

  function getTextureDimensions(texture) {
    const image = texture?.image;

    return {
      width: image?.naturalWidth || image?.videoWidth || image?.width || 0,
      height: image?.naturalHeight || image?.videoHeight || image?.height || 0,
    };
  }

  function canUseTextureMipmaps(texture) {
    const { width, height } = getTextureDimensions(texture);
    if (!width || !height) {
      return false;
    }

    return (
      renderer.capabilities.isWebGL2 ||
      (THREE.MathUtils.isPowerOfTwo(width) && THREE.MathUtils.isPowerOfTwo(height))
    );
  }

  function applyHeroTextureQuality(texture) {
    if (!texture) {
      return texture;
    }

    const useMipmaps = canUseTextureMipmaps(texture);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = useMipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
    texture.generateMipmaps = useMipmaps;
    texture.anisotropy = Math.min(
      renderer.capabilities.getMaxAnisotropy(),
      heroQuality.maxAnisotropy
    );
    texture.needsUpdate = true;
    return texture;
  }

  function refreshHeroTextureQuality() {
    const activeTextures = new Set();

    noteMeshes.forEach((note) => {
      if (note.material?.map) {
        activeTextures.add(note.material.map);
      }
    });

    activeTextures.forEach((texture) => {
      applyHeroTextureQuality(texture);
    });
  }

  function refreshUserNoteTexture(note) {
    const motion = note.userData.motion;
    if (!motion?.userNote || !motion.noteText || !motion.ownsTexture) {
      return;
    }

    const currentTexture = note.material?.map;
    const { width, height } = getTextureDimensions(currentTexture);
    if (width === heroQuality.textureSize.width && height === heroQuality.textureSize.height) {
      return;
    }

    note.material.map = buildCanvasNoteTexture(motion.noteText);
    note.material.needsUpdate = true;
    currentTexture?.dispose();
  }

  function randomBetween(min, max) {
    return THREE.MathUtils.randFloat(min, max);
  }

  function updateNoteStatus(message) {
    if (!noteStatus) {
      return;
    }

    noteStatus.textContent = message;
    noteStatus.classList.add("is-live");
    window.clearTimeout(updateNoteStatus.timeoutId);
    updateNoteStatus.timeoutId = window.setTimeout(() => {
      noteStatus.classList.remove("is-live");
    }, 1400);
  }

  function createNoteMesh({
    texture,
    height,
    x,
    y,
    z,
    rotationZ = 0,
    ownsTexture = false,
    userNote = false,
  }) {
    const width = height * textureAspect(texture);
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      color: 0xffffff,
      roughness: 1,
      metalness: 0,
      transparent: true,
      alphaTest: 0.08,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = heroQuality.shadows;
    mesh.receiveShadow = heroQuality.shadows;
    mesh.position.set(x, y, z);
    mesh.rotation.z = rotationZ;
    mesh.renderOrder = Math.round(z * 10);
    const motionScale = heroQuality.motionScale;

    mesh.userData.motion = {
      restX: x,
      restY: y,
      restZ: z,
      homeX: x,
      homeY: y,
      homeZ: z,
      anchorX: x / Math.max(view.halfWidth, 1),
      anchorY: y / Math.max(view.halfHeight, 1),
      restRotationX: 0,
      restRotationY: 0,
      restRotationZ: rotationZ,
      homeRotationZ: rotationZ,
      width,
      height,
      flutterAmplitude: prefersReducedMotion ? 0 : randomBetween(0.006, 0.028) * motionScale,
      flutterSpeed: randomBetween(0.6, 1.4),
      flutterOffset: randomBetween(0, Math.PI * 2),
      bobAmplitude: prefersReducedMotion ? 0 : randomBetween(0.01, 0.08) * motionScale,
      bobSpeed: randomBetween(0.55, 1.1),
      driftAmplitude: prefersReducedMotion ? 0 : randomBetween(0.01, 0.06) * motionScale,
      driftSpeed: randomBetween(0.4, 0.85),
      liftRange: randomBetween(0.4, userNote ? 1.4 : 2.2) * motionScale,
      windDrift: randomBetween(-0.28, 0.28) * motionScale,
      rollRange: randomBetween(-0.05, 0.08) * motionScale,
      pitchRange: randomBetween(0.01, 0.12) * motionScale,
      yawRange: randomBetween(-0.08, 0.08) * motionScale,
      gustRoll: randomBetween(-0.14, 0.14) * motionScale,
      gustPitch: randomBetween(0.01, 0.12) * motionScale,
      gustYaw: randomBetween(-0.08, 0.08) * motionScale,
      logoFloatAmplitudeX: 0,
      logoFloatAmplitudeY: 0,
      logoFloatSpeedX: 0,
      logoFloatSpeedY: 0,
      logoFloatOffset: randomBetween(0, Math.PI * 2),
      logoRollRange: 0,
      logoPitchRange: 0,
      logoYawRange: 0,
      logoDepthAmplitude: 0,
      isDragging: false,
      isThrowing: false,
      keepOnTop: false,
      detachedFromLogo: false,
      heroLogo: false,
      heroKey: null,
      responsive: !userNote,
      ownsTexture,
      userNote,
      baseHeight: height,
    };

    noteMeshes.push(mesh);
    scene.add(mesh);
    return mesh;
  }

  function buildBackgroundLayer(posterTexture) {
    // The poster field should feel dense and imperfect, like a real board that
    // has been layered over time rather than algorithmically tiled.
    const posterCount = heroQuality.posterCount;

    for (let index = 0; index < posterCount; index += 1) {
      createNoteMesh({
        texture: posterTexture,
        height: heroQuality.posterHeight,
        x: randomBetween(-view.halfWidth * 1.08, view.halfWidth * 1.08),
        y: randomBetween(-view.halfHeight * 1.04, view.halfHeight * 1.06),
        z: randomBetween(-5.5, -0.6),
        rotationZ: randomBetween(-0.7, 0.7),
      });
    }
  }

  function getHeroLayoutPreset() {
    const width = window.innerWidth;
    if (width <= 560) {
      return heroLayoutPresets.mobile;
    }

    if (width <= 800) {
      return heroLayoutPresets.tablet;
    }

    if (width <= 1300) {
      return heroLayoutPresets.laptop;
    }

    return heroLayoutPresets.desktop;
  }

  function getHeroStageRect() {
    const mobileLogoStage = getMobileLogoStageRect();
    if (mobileLogoStage) {
      return mobileLogoStage;
    }

    const bounds = boardShell?.getBoundingClientRect() ?? hero.getBoundingClientRect();
    const styles = window.getComputedStyle(boardShell || hero);
    const maxInsetX = Math.max(bounds.width * 0.48, 0);
    const maxInsetY = Math.max(bounds.height * 0.7, 0);
    const topInset = THREE.MathUtils.clamp(
      Number.parseFloat(styles.getPropertyValue("--hero-stage-top")) || 0,
      0,
      maxInsetY
    );
    const rightInset = THREE.MathUtils.clamp(
      Number.parseFloat(styles.getPropertyValue("--hero-stage-right")) || 0,
      0,
      maxInsetX
    );
    const bottomInset = THREE.MathUtils.clamp(
      Number.parseFloat(styles.getPropertyValue("--hero-stage-bottom")) || 0,
      0,
      maxInsetY
    );
    const leftInset = THREE.MathUtils.clamp(
      Number.parseFloat(styles.getPropertyValue("--hero-stage-left")) || 0,
      0,
      maxInsetX
    );

    const left = -view.halfWidth + (leftInset / Math.max(bounds.width, 1)) * view.width;
    const right = view.halfWidth - (rightInset / Math.max(bounds.width, 1)) * view.width;
    const top = view.halfHeight - (topInset / Math.max(bounds.height, 1)) * view.height;
    const bottom = -view.halfHeight + (bottomInset / Math.max(bounds.height, 1)) * view.height;

    if (right - left < 4 || top - bottom < 3.5) {
      return {
        left: -view.halfWidth * 0.82,
        right: view.halfWidth * 0.82,
        top: view.halfHeight * 0.44,
        bottom: -view.halfHeight * 0.44,
        width: view.width * 0.82 * 2,
        height: view.height * 0.44 * 2,
      };
    }

    return {
      left,
      right,
      top,
      bottom,
      width: right - left,
      height: top - bottom,
    };
  }

  function getMobileLogoStageRect() {
    if (!isCompactViewport() || !mobileLogoSlot) {
      return null;
    }

    const shellBounds = boardShell?.getBoundingClientRect() ?? hero.getBoundingClientRect();
    const slotBounds = mobileLogoSlot.getBoundingClientRect();
    if (
      shellBounds.width <= 0 ||
      shellBounds.height <= 0 ||
      slotBounds.width < 40 ||
      slotBounds.height < 24
    ) {
      return null;
    }

    const insetX = Math.min(slotBounds.width * 0.05, 18);
    const insetY = Math.min(slotBounds.height * 0.16, 14);
    const leftPx = THREE.MathUtils.clamp(slotBounds.left - shellBounds.left + insetX, 0, shellBounds.width);
    const rightPx = THREE.MathUtils.clamp(
      slotBounds.right - shellBounds.left - insetX,
      0,
      shellBounds.width
    );
    const topPx = THREE.MathUtils.clamp(slotBounds.top - shellBounds.top + insetY, 0, shellBounds.height);
    const bottomPx = THREE.MathUtils.clamp(
      slotBounds.bottom - shellBounds.top - insetY,
      0,
      shellBounds.height
    );

    if (rightPx - leftPx < 30 || bottomPx - topPx < 18) {
      return null;
    }

    const left = -view.halfWidth + (leftPx / shellBounds.width) * view.width;
    const right = -view.halfWidth + (rightPx / shellBounds.width) * view.width;
    const top = view.halfHeight - (topPx / shellBounds.height) * view.height;
    const bottom = view.halfHeight - (bottomPx / shellBounds.height) * view.height;
    const centerY = (top + bottom) / 2 - (top - bottom) * 0.18;

    return {
      left,
      right,
      top,
      bottom,
      width: right - left,
      height: top - bottom,
      centerY,
      isSlotStage: true,
    };
  }

  function getHeroNoteRows(activeHeroNotes, stage, layoutPreset) {
    if (!stage.isSlotStage || layoutPreset.slotRows !== 2) {
      return [activeHeroNotes];
    }

    const noteMap = new Map(activeHeroNotes);
    const usedKeys = new Set();
    const rowKeys = [
      ["d", "r", "o", "p"],
      ["orange", "zero", "one", "pink"],
    ];
    const rows = rowKeys
      .map((keys) =>
        keys
          .map((key) => {
            const note = noteMap.get(key);
            if (!note) {
              return null;
            }

            usedKeys.add(key);
            return [key, note];
          })
          .filter(Boolean)
      )
      .filter((row) => row.length);
    const overflow = activeHeroNotes.filter(([key]) => !usedKeys.has(key));

    if (overflow.length) {
      if (rows.length) {
        rows[rows.length - 1].push(...overflow);
      } else {
        rows.push(overflow);
      }
    }

    return rows.length ? rows : [activeHeroNotes];
  }

  function applyHeroNoteLayout() {
    const stage = getHeroStageRect();
    const layoutPreset = getHeroLayoutPreset();
    let maxLogoRestZ = logoFrontStartZ;
    let maxBoardRestZ = boardFrontStartZ;

    const activeHeroNotes = heroLineKeys
      .map((key) => [key, heroNoteMeshes.get(key)])
      .filter((entry) => entry[1] && !entry[1].userData.motion.detachedFromLogo);

    if (!activeHeroNotes.length) {
      return;
    }

    const noteRows = getHeroNoteRows(activeHeroNotes, stage, layoutPreset);
    const gap = stage.width * layoutPreset.gap;
    const stageHeightLimit = stage.height * (stage.isSlotStage ? layoutPreset.slotHeightFill || 0.82 : layoutPreset.maxHeight);
    const rowGap = noteRows.length > 1 ? stage.height * (layoutPreset.slotRowGap || 0.08) : 0;
    const rowHeightByWidth = noteRows.reduce((smallest, row) => {
      const rowAspect = row.reduce((sum, [, note]) => {
        const motion = note.userData.motion;
        return sum + motion.width / Math.max(motion.height, 0.001);
      }, 0);
      const rowWidth = stage.width * layoutPreset.widthFill - gap * (row.length - 1);

      return Math.min(smallest, rowWidth / Math.max(rowAspect, 1));
    }, Number.POSITIVE_INFINITY);
    const rowHeightByHeight = (stageHeightLimit - rowGap * (noteRows.length - 1)) / Math.max(noteRows.length, 1);
    const rowHeight = Math.max(0.1, Math.min(rowHeightByWidth, rowHeightByHeight));
    const blockHeight = rowHeight * noteRows.length + rowGap * (noteRows.length - 1);
    const blockCenterY =
      stage.isSlotStage && noteRows.length > 1
        ? (stage.top + stage.bottom) / 2
        : stage.centerY ?? stage.top - stage.height * layoutPreset.lineY;
    let noteIndex = 0;

    noteRows.forEach((row, rowIndex) => {
      const rowAspect = row.reduce((sum, [, note]) => {
        const motion = note.userData.motion;
        return sum + motion.width / Math.max(motion.height, 0.001);
      }, 0);
      const totalWidth = rowHeight * rowAspect + gap * (row.length - 1);
      let cursor = stage.left + (stage.width - totalWidth) / 2;
      const lineY =
        noteRows.length > 1
          ? blockCenterY + blockHeight / 2 - rowHeight / 2 - rowIndex * (rowHeight + rowGap)
          : blockCenterY;

      row.forEach(([key, note]) => {
        const motion = note.userData.motion;
        const aspect = motion.width / Math.max(motion.height, 0.001);
        const noteWidth = rowHeight * aspect;
        const centerX = cursor + noteWidth / 2;
        const z = logoFrontStartZ + noteIndex * 0.18;
        const scale = rowHeight / Math.max(motion.baseHeight, 0.001);

        motion.restX = centerX;
        motion.restY = lineY;
        motion.restZ = z;
        motion.homeX = centerX;
        motion.homeY = lineY;
        motion.homeZ = z;
        motion.restRotationZ = heroNoteRotations[key] ?? 0;
        motion.homeRotationZ = motion.restRotationZ;

        note.scale.set(scale, scale, 1);
        note.renderOrder = Math.round(z * 10);

        if (!motion.isDragging && !motion.isThrowing) {
          note.position.set(centerX, lineY, z);
          note.rotation.z = motion.restRotationZ;
        }

        maxLogoRestZ = Math.max(maxLogoRestZ, z);
        cursor += noteWidth + gap;
        noteIndex += 1;
      });
    });

    boardFrontZ = Math.max(boardFrontZ, maxBoardRestZ);
    logoFrontZ = Math.max(logoFrontZ, maxLogoRestZ);
  }

  function buildHeroNotes(textures) {
    const sharedPaperHeight = 3.18;
    const heroConfigs = [
      { key: "d", texture: textures.d, height: sharedPaperHeight },
      { key: "r", texture: textures.r, height: sharedPaperHeight },
      { key: "o", texture: textures.o, height: sharedPaperHeight },
      { key: "p", texture: textures.p, height: sharedPaperHeight },
      { key: "zero", texture: textures.zero, height: sharedPaperHeight },
      { key: "one", texture: textures.one, height: sharedPaperHeight },
      { key: "orange", texture: textures.orange, height: sharedPaperHeight },
      { key: "pink", texture: textures.pink, height: sharedPaperHeight },
    ];

    heroConfigs.forEach((config, index) => {
      const note = createNoteMesh({
        texture: config.texture,
        height: config.height,
        x: 0,
        y: 0,
        z: 3.4 + index * 0.18,
        rotationZ: 0,
      });
      const motion = note.userData.motion;
      motion.baseHeight = config.height;
      motion.responsive = false;
      motion.keepOnTop = heroLogoKeys.has(config.key);
      motion.heroLogo = true;
      motion.heroKey = config.key;
      motion.logoFloatAmplitudeX = prefersReducedMotion ? 0 : (0.012 + index * 0.0024) * heroQuality.motionScale;
      motion.logoFloatAmplitudeY =
        prefersReducedMotion ? 0 : (0.024 + (index % 3) * 0.005) * heroQuality.motionScale;
      motion.logoFloatSpeedX = 0.24 + index * 0.016;
      motion.logoFloatSpeedY = 0.31 + index * 0.02;
      motion.logoFloatOffset = (index / heroConfigs.length) * Math.PI * 1.25;
      motion.logoRollRange = prefersReducedMotion ? 0 : (0.006 + (index % 2) * 0.003) * heroQuality.motionScale;
      motion.logoPitchRange = prefersReducedMotion ? 0 : (0.005 + index * 0.0007) * heroQuality.motionScale;
      motion.logoYawRange = prefersReducedMotion ? 0 : (0.006 + (index % 4) * 0.0018) * heroQuality.motionScale;
      motion.logoDepthAmplitude = prefersReducedMotion ? 0 : (0.024 + index * 0.0016) * heroQuality.motionScale;
      heroNoteMeshes.set(config.key, note);
    });

    applyHeroNoteLayout();
  }

  function setupScrollWind() {
    ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: "bottom top",
      scrub: prefersReducedMotion ? false : scrollResponse.scrub,
      onUpdate(self) {
        scrollState.progress = self.progress * scrollResponse.progressMultiplier;
        if (prefersReducedMotion) {
          return;
        }

        const gust = THREE.MathUtils.clamp(
          (self.getVelocity() / scrollResponse.gustVelocityDivisor) * scrollResponse.gustMultiplier,
          -1.35,
          1.35
        );
        setGust(gust);
        window.clearTimeout(gustResetId);
        gustResetId = window.setTimeout(() => {
          setGust(0);
        }, scrollResponse.gustResetDelay);
      },
    });
  }

  function syncHeroNoteFormTransform() {
    if (!noteForm) {
      return;
    }

    gsap.set(noteForm, {
      xPercent: 0,
    });
  }

  function revealHeroOverlay() {
    if (prefersReducedMotion) {
      return;
    }

    const headline = hero.querySelector(".hero__headline");
    if (headline) {
      gsap.fromTo(
        headline,
        { autoAlpha: 0, y: 20 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
        }
      );
    }

    if (noteForm) {
      syncHeroNoteFormTransform();
      gsap.fromTo(
        noteForm,
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.8, delay: 0.08, ease: "power3.out" }
      );
    }
  }

  function bindPointerEvents() {
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);
  }

  function bindNoteForm() {
    if (!noteForm || !noteInput) {
      return;
    }

    noteForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = noteInput.value.trim();
      if (!text) {
        updateNoteStatus("Write something from the heart, then pin it.");
        return;
      }

      addUserNote(text);
      noteInput.value = "";
      updateNoteStatus("Pinned to the wall.");

      const webhookUrl = webhookMap["hero-note"];
      if (!webhookUrl) {
        console.warn("DROP 01 hero note webhook is not configured; note stayed local only.");
        return;
      }

      const payload = buildHeroNotePayload(text);
      void postJson(webhookUrl, payload).catch((error) => {
        console.error("DROP 01 hero note submission failed.", error);
        updateNoteStatus("Pinned to the wall. Remote sync is unavailable right now.");
      });
    });
  }

  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
  }

  function onPointerDown(event) {
    updatePointer(event);
    const intersections = raycaster.intersectObjects(noteMeshes, false);
    const hit = intersections[0];
    if (!hit) {
      return;
    }

    event.preventDefault();

    activeNote = hit.object;
    canvas.classList.add("is-dragging");
    document.body.classList.add("is-dragging-notice-board");

    const motion = activeNote.userData.motion;
    motion.isDragging = true;
    motion.isThrowing = false;

    bringToFront(activeNote);

    dragPlane.constant = -activeNote.position.z;
    if (raycaster.ray.intersectPlane(dragPlane, dragPoint)) {
      dragOffset.copy(activeNote.position).sub(dragPoint);
    } else {
      dragOffset.set(0, 0, 0);
    }

    swipeHistory.length = 0;
    swipeHistory.push({
      x: activeNote.position.x,
      y: activeNote.position.y,
      time: performance.now(),
    });

    canvas.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    if (!activeNote) {
      return;
    }

    event.preventDefault();
    updatePointer(event);
    if (!raycaster.ray.intersectPlane(dragPlane, dragPoint)) {
      return;
    }

    const motion = activeNote.userData.motion;
    const nextX = dragPoint.x + dragOffset.x;
    const nextY = dragPoint.y + dragOffset.y;

    activeNote.position.x = nextX;
    activeNote.position.y = nextY;
    activeNote.rotation.x = 0.04;
    activeNote.rotation.y = -0.04;
    motion.responsive = false;

    swipeHistory.push({
      x: nextX,
      y: nextY,
      time: performance.now(),
    });

    while (swipeHistory.length > 6 || performance.now() - swipeHistory[0].time > 140) {
      swipeHistory.shift();
    }

    motion.restX = nextX;
    motion.restY = nextY;
  }

  function onPointerUp(event) {
    if (!activeNote) {
      return;
    }

    event.preventDefault();
    const releasedNote = activeNote;
    const motion = releasedNote.userData.motion;
    motion.isDragging = false;
    canvas.classList.remove("is-dragging");
    document.body.classList.remove("is-dragging-notice-board");

    const velocity = calculateVelocity();
    if (motion.keepOnTop) {
      if (shouldDetachHeroNote(releasedNote)) {
        detachHeroNote(releasedNote);
      } else {
        gsap.to(motion, {
          restX: motion.homeX,
          restY: motion.homeY,
          restZ: motion.homeZ,
          restRotationZ: motion.homeRotationZ,
          duration: 0.48,
          ease: "power3.out",
        });
      }
    } else if (velocity.length() > 8.5) {
      throwNote(releasedNote, velocity);
    } else {
      motion.restX = releasedNote.position.x;
      motion.restY = releasedNote.position.y;
      motion.restZ = releasedNote.position.z;
      motion.restRotationZ = releasedNote.rotation.z;

      gsap.to(releasedNote.rotation, {
        x: 0,
        y: 0,
        duration: 0.35,
        ease: "power2.out",
      });
    }

    activeNote = null;

    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch (error) {
      // Pointer capture is best-effort; failed releases are safe to ignore.
    }
  }

  function shouldDetachHeroNote(note) {
    const motion = note.userData.motion;
    if (!motion.keepOnTop || !motion.heroLogo) {
      return false;
    }

    const dragDistance = Math.hypot(
      note.position.x - motion.homeX,
      note.position.y - motion.homeY
    );
    const detachThreshold = Math.max(
      note.scale.x * motion.width * heroDetachThresholdMultiplier,
      0.9
    );
    return dragDistance >= detachThreshold;
  }

  function detachHeroNote(note) {
    const motion = note.userData.motion;
    motion.keepOnTop = false;
    motion.detachedFromLogo = true;

    boardFrontZ = Math.min(boardFrontZ + 0.45, logoFrontStartZ - 0.35);
    note.position.z = boardFrontZ;
    note.renderOrder = Math.round(boardFrontZ * 10);
    motion.restX = note.position.x;
    motion.restY = note.position.y;
    motion.restZ = boardFrontZ;
    motion.restRotationZ = note.rotation.z;

    gsap.to(note.rotation, {
      x: 0,
      y: 0,
      duration: 0.35,
      ease: "power2.out",
    });

    applyHeroNoteLayout();
    updateNoteStatus("Letter released. It will keep drifting with the board.");
  }

  function calculateVelocity() {
    const newest = swipeHistory[swipeHistory.length - 1];
    const oldest = swipeHistory[0];

    if (!newest || !oldest) {
      return new THREE.Vector2(0, 0);
    }

    const deltaTime = Math.max((newest.time - oldest.time) / 1000, 0.016);
    return new THREE.Vector2((newest.x - oldest.x) / deltaTime, (newest.y - oldest.y) / deltaTime);
  }

  function bringToFront(note) {
    const motion = note.userData.motion;
    if (motion.keepOnTop) {
      logoFrontZ += 0.45;
      note.position.z = logoFrontZ;
      note.renderOrder = Math.round(logoFrontZ * 10);
      motion.restZ = logoFrontZ;
      return;
    }

    boardFrontZ = Math.min(boardFrontZ + 0.45, logoFrontStartZ - 0.35);
    note.position.z = boardFrontZ;
    note.renderOrder = Math.round(boardFrontZ * 10);
    motion.restZ = boardFrontZ;
  }

  function throwNote(note, velocity) {
    const motion = note.userData.motion;
    motion.isThrowing = true;

    const direction = velocity.clone().normalize();
    const distance = Math.max(view.width, view.height) * 1.3;
    const destination = {
      x: note.position.x + direction.x * distance,
      y: note.position.y + direction.y * distance + 1.2,
      z: note.position.z + 1.8,
    };

    gsap.to(note.position, {
      ...destination,
      duration: 0.72,
      ease: "power2.in",
      onComplete: () => removeNote(note),
    });

    gsap.to(note.rotation, {
      z: note.rotation.z + direction.x * 0.85,
      x: note.rotation.x + direction.y * 0.22,
      y: note.rotation.y + direction.x * 0.18,
      duration: 0.72,
      ease: "power2.in",
    });

    gsap.to(note.material, {
      opacity: 0,
      duration: 0.72,
      ease: "power1.in",
    });
  }

  function removeNote(note) {
    const index = noteMeshes.indexOf(note);
    if (index >= 0) {
      noteMeshes.splice(index, 1);
    }

    gsap.killTweensOf(note.position);
    gsap.killTweensOf(note.rotation);
    gsap.killTweensOf(note.scale);
    gsap.killTweensOf(note.material);

    scene.remove(note);
    const heroKey = note.userData.motion?.heroKey;
    if (heroKey) {
      heroNoteMeshes.delete(heroKey);
      applyHeroNoteLayout();
    }
    note.geometry.dispose();

    if (note.userData.motion?.ownsTexture) {
      note.material.map?.dispose();
    }

    note.material.dispose();
  }

  function addUserNote(text) {
    // User notes are drawn on a canvas first, then promoted into a texture so
    // they can live in the same physical scene as the SVG notes.
    const texture = buildCanvasNoteTexture(text);
    const targetX = randomBetween(-view.halfWidth * 0.16, view.halfWidth * 0.16);
    const targetY = randomBetween(-view.halfHeight * 0.18, view.halfHeight * 0.12);

    const note = createNoteMesh({
      texture,
      height: 3.18,
      x: 0,
      y: view.halfHeight + 3,
      z: Math.min(boardFrontZ + 0.8, logoFrontStartZ - 0.3),
      rotationZ: randomBetween(-0.12, 0.12),
      ownsTexture: true,
      userNote: true,
    });

    const motion = note.userData.motion;
    motion.isThrowing = true;
    motion.noteText = text;
    bringToFront(note);
    motion.restX = targetX;
    motion.restY = targetY;
    motion.restZ = note.position.z;

    note.scale.setScalar(1.5);

    gsap.to(note.position, {
      x: targetX,
      y: targetY,
      z: motion.restZ,
      duration: 0.84,
      ease: "power3.out",
      onComplete: () => {
        motion.isThrowing = false;
      },
    });

    gsap.to(note.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.84,
      ease: "power3.out",
    });
  }

  function buildCanvasNoteTexture(text) {
    const canvasTexture = document.createElement("canvas");
    canvasTexture.width = heroQuality.textureSize.width;
    canvasTexture.height = heroQuality.textureSize.height;
    const textureScale = canvasTexture.width / 1024;
    const frameInset = 16 * textureScale;
    const headerY = 92 * textureScale;
    const footerY = canvasTexture.height - 68 * textureScale;

    const context = canvasTexture.getContext("2d");
    const palette = Math.random() > 0.5 ? ["#fff9d8", "#f5e8a4"] : ["#fffdf8", "#f2eee3"];

    context.fillStyle = palette[0];
    context.fillRect(0, 0, canvasTexture.width, canvasTexture.height);

    const gradient = context.createLinearGradient(0, 0, canvasTexture.width, canvasTexture.height);
    gradient.addColorStop(0, "rgba(255,255,255,0.55)");
    gradient.addColorStop(1, "rgba(0,0,0,0.04)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvasTexture.width, canvasTexture.height);

    context.fillStyle = "rgba(242, 240, 229, 0.85)";
    context.fillRect(
      canvasTexture.width * 0.36,
      28 * textureScale,
      canvasTexture.width * 0.28,
      72 * textureScale
    );

    context.strokeStyle = "rgba(0,0,0,0.08)";
    context.lineWidth = Math.max(4, 10 * textureScale);
    context.strokeRect(
      frameInset,
      frameInset,
      canvasTexture.width - frameInset * 2,
      canvasTexture.height - frameInset * 2
    );

    context.fillStyle = "rgba(0,0,0,0.45)";
    context.font =
      `700 ${30 * textureScale}px 'Helvetica Neue Condensed', 'Arial Narrow', Arial, sans-serif`;
    context.textAlign = "left";
    context.fillText("PINNED NOTE", 58 * textureScale, headerY);

    context.fillStyle = "#141414";
    context.font =
      `700 ${98 * textureScale}px 'Helvetica Neue Condensed', 'Arial Narrow', Arial, sans-serif`;
    context.textAlign = "center";

    const lines = wrapCanvasText(context, text.toUpperCase(), canvasTexture.width - 160 * textureScale);
    const lineHeight = 108 * textureScale;
    const startY = canvasTexture.height * 0.42 - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, index) => {
      context.fillText(line, canvasTexture.width / 2, startY + index * lineHeight);
    });

    context.fillStyle = "rgba(0,0,0,0.44)";
    context.font =
      `600 ${28 * textureScale}px 'Helvetica Neue Condensed', 'Arial Narrow', Arial, sans-serif`;
    context.fillText("DRAG IT. THROW IT. MAKE IT REAL.", canvasTexture.width / 2, footerY);

    const texture = new THREE.CanvasTexture(canvasTexture);
    return applyHeroTextureQuality(texture);
  }

  function wrapCanvasText(context, text, maxWidth) {
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = "";

    words.forEach((word) => {
      const nextLine = currentLine ? `${currentLine} ${word}` : word;
      if (context.measureText(nextLine).width <= maxWidth) {
        currentLine = nextLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.slice(0, 4);
  }

  function resizeScene() {
    heroQuality = getHeroQualityProfile();
    const bounds = boardShell?.getBoundingClientRect() ?? hero.getBoundingClientRect();
    const width = Math.max(bounds.width, 1);
    const height = Math.max(bounds.height, 1);
    const aspect = width / height;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, heroQuality.pixelRatioCap));
    renderer.setSize(width, height, false);
    renderer.shadowMap.enabled = heroQuality.shadows;
    keyLight.castShadow = heroQuality.shadows;
    if (heroQuality.shadows) {
      keyLight.shadow.mapSize.set(heroQuality.shadowMapSize, heroQuality.shadowMapSize);
    }
    board.visible = heroQuality.shadows;
    board.receiveShadow = heroQuality.shadows;

    view.height = 16;
    view.width = view.height * aspect;
    view.halfHeight = view.height / 2;
    view.halfWidth = view.width / 2;

    camera.left = -view.halfWidth;
    camera.right = view.halfWidth;
    camera.top = view.halfHeight;
    camera.bottom = -view.halfHeight;
    camera.updateProjectionMatrix();

    board.scale.set(view.width + 1.5, view.height + 1.5, 1);

    noteMeshes.forEach((note) => {
      const motion = note.userData.motion;
      note.castShadow = heroQuality.shadows;
      note.receiveShadow = heroQuality.shadows;
      refreshUserNoteTexture(note);
      if (!motion.responsive) {
        return;
      }

      if (!motion.userNote) {
        const posterScale = heroQuality.posterHeight / Math.max(motion.baseHeight, 0.001);
        note.scale.set(posterScale, posterScale, 1);
      }

      motion.restX = motion.anchorX * view.halfWidth;
      motion.restY = motion.anchorY * view.halfHeight;

      if (!motion.isDragging && !motion.isThrowing) {
        note.position.x = motion.restX;
        note.position.y = motion.restY;
      }
    });

    refreshHeroTextureQuality();
    applyHeroNoteLayout();
  }

  function requestResizeScene() {
    if (resizeRafId) {
      return;
    }

    resizeRafId = window.requestAnimationFrame(() => {
      resizeRafId = 0;
      resizeScene();
      syncHeroNoteFormTransform();
      ScrollTrigger.refresh();
    });
  }

  function observeHeroVisibility() {
    if ("IntersectionObserver" in window) {
      visibilityObserver = new IntersectionObserver(
        (entries) => {
          heroInView = entries.some((entry) => entry.isIntersecting);
          syncRenderLoop();
        },
        {
          threshold: 0.02,
        }
      );

      visibilityObserver.observe(hero);
    }
  }

  function handleVisibilityChange() {
    pageVisible = !document.hidden;
    syncRenderLoop();
  }

  function startRenderLoop() {
    if (rafId) {
      return;
    }

    lastRenderTime = 0;
    rafId = window.requestAnimationFrame(render);
  }

  function stopRenderLoop() {
    if (!rafId) {
      return;
    }

    window.cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function syncRenderLoop() {
    if (pageVisible && heroInView) {
      startRenderLoop();
      return;
    }

    stopRenderLoop();
  }

  function render(time) {
    if (!pageVisible || !heroInView) {
      rafId = 0;
      return;
    }

    if (lastRenderTime && time - lastRenderTime < heroQuality.frameInterval) {
      rafId = window.requestAnimationFrame(render);
      return;
    }

    lastRenderTime = time;
    const elapsed = time * 0.001;
    const gust = scrollState.gust;
    const gustLift = Math.abs(gust);
    const heroLineOffsetX = prefersReducedMotion ? 0 : Math.cos(elapsed * 0.22) * 0.016;
    const heroLineOffsetY =
      prefersReducedMotion ? 0 : Math.sin(elapsed * 0.32) * 0.024 + scrollState.progress * 0.18 + gustLift * 0.06;
    const heroLineTilt =
      prefersReducedMotion ? 0 : Math.sin(elapsed * 0.27) * 0.006 + scrollState.progress * 0.01 + gust * 0.01;
    const heroLinePitch = prefersReducedMotion ? 0 : scrollState.progress * 0.008 + gust * 0.01;
    const heroLineYaw = prefersReducedMotion ? 0 : scrollState.progress * 0.01 + gust * 0.012;

    // The render loop combines three layers of motion:
    // 1. a baseline paper flutter
    // 2. a scroll-driven updraft
    // 3. temporary drag / throw states that take over when the user interacts
    noteMeshes.forEach((note) => {
      const motion = note.userData.motion;
      if (motion.isDragging || motion.isThrowing) {
        return;
      }

      if (motion.keepOnTop) {
        const logoDriftX =
          Math.cos(elapsed * motion.logoFloatSpeedX + motion.logoFloatOffset) *
            motion.logoFloatAmplitudeX +
          Math.sin(elapsed * (motion.logoFloatSpeedX * 0.55) + motion.logoFloatOffset * 0.7) *
            (motion.logoFloatAmplitudeX * 0.45);
        const logoDriftY =
          Math.sin(elapsed * motion.logoFloatSpeedY + motion.logoFloatOffset) *
            motion.logoFloatAmplitudeY +
          Math.cos(elapsed * (motion.logoFloatSpeedY * 0.6) + motion.logoFloatOffset * 0.6) *
            (motion.logoFloatAmplitudeY * 0.3);
        const logoPitch =
          Math.cos(elapsed * (motion.logoFloatSpeedY * 0.72) + motion.logoFloatOffset) *
          motion.logoPitchRange;
        const logoYaw =
          Math.sin(elapsed * (motion.logoFloatSpeedX * 0.78) + motion.logoFloatOffset * 0.85) *
          motion.logoYawRange;
        const logoRoll =
          Math.sin(elapsed * (motion.logoFloatSpeedX * 0.94) + motion.logoFloatOffset) *
          motion.logoRollRange;

        // Keep the wordmark aligned as one read, but let each tile breathe a bit
        // so the movement feels embedded in the board instead of obviously looped.
        note.position.x = motion.restX + heroLineOffsetX + logoDriftX;
        note.position.y = motion.restY + heroLineOffsetY + logoDriftY;
        note.position.z =
          motion.restZ +
          Math.sin(elapsed * (motion.logoFloatSpeedY * 0.52) + motion.logoFloatOffset) *
            motion.logoDepthAmplitude;
        note.rotation.x = motion.restRotationX + heroLinePitch + logoPitch;
        note.rotation.y = motion.restRotationY + heroLineYaw + logoYaw;
        note.rotation.z = motion.restRotationZ + heroLineTilt + logoRoll;
        return;
      }

      const flutter = Math.sin(elapsed * motion.flutterSpeed + motion.flutterOffset) * motion.flutterAmplitude;
      const bob = Math.sin(elapsed * motion.bobSpeed + motion.flutterOffset) * motion.bobAmplitude;
      const drift = Math.cos(elapsed * motion.driftSpeed + motion.flutterOffset) * motion.driftAmplitude;

      note.position.x =
        motion.restX +
        drift +
        scrollState.progress * motion.windDrift * scrollResponse.xProgressInfluence +
        gust * motion.windDrift;
      note.position.y =
        motion.restY +
        bob +
        scrollState.progress * motion.liftRange * scrollResponse.yProgressInfluence +
        gustLift * motion.liftRange * scrollResponse.yGustInfluence;
      note.position.z = motion.restZ;

      note.rotation.x =
        motion.restRotationX +
        scrollState.progress * motion.pitchRange +
        gust * motion.gustPitch;

      note.rotation.y =
        motion.restRotationY +
        scrollState.progress * motion.yawRange +
        gust * motion.gustYaw;

      note.rotation.z =
        motion.restRotationZ +
        flutter +
        scrollState.progress * motion.rollRange +
        gust * motion.gustRoll;
    });

    renderer.render(scene, camera);
    rafId = window.requestAnimationFrame(render);
  }

  window.addEventListener("pagehide", () => {
    stopRenderLoop();
    window.cancelAnimationFrame(resizeRafId);
    window.removeEventListener("resize", requestResizeScene);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    document.body.classList.remove("is-dragging-notice-board");
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
    canvas.removeEventListener("pointerleave", onPointerUp);
    visibilityObserver?.disconnect();
    renderer.dispose();
  });
}
