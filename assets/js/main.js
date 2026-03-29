import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/+esm";
import { gsap } from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm";
import { ScrollTrigger } from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger/+esm";

gsap.registerPlugin(ScrollTrigger);

// Shared motion and UI helpers still power the inner pages, while the
// home page boots an isolated Three.js scene for the physical notice board.
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
const siteConfig = window.DROP01_SITE_CONFIG || {};
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
};

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
};

init();

function init() {
  setupHeaderMotion();
  setupRevealAnimations();
  setupButtonMotion();
  setupForms();
  hydrateSavedFormDrafts();
  replayPendingWebhookSubmissions();
  setupShopMotion();
  setupModal();
  setupFloatingSubscribeCard();
  setupMultiStepForm();
  setupNoticeBoardHero();
}

function setupHeaderMotion() {
  const header = document.querySelector(".site-header");
  if (!header) {
    return;
  }

  if (prefersReducedMotion) {
    return;
  }

  let lastScrollY = window.scrollY;
  let accumulatedDelta = 0;
  let ticking = false;
  let isHidden = false;
  const revealThreshold = 18;
  const hideThreshold = 72;
  const hideDistanceThreshold = 30;

  const setHeaderVisible = () => {
    if (!isHidden) {
      gsap.to(header, {
        yPercent: 0,
        autoAlpha: 1,
        backgroundColor: "#ffffff",
        boxShadow: "0 16px 36px rgba(0, 0, 0, 0.08)",
        duration: 0.7,
        ease: "power3.out",
        overwrite: "auto",
      });
      return;
    }

    isHidden = false;
    header.classList.remove("is-hidden");
    gsap.to(header, {
      yPercent: 0,
      autoAlpha: 1,
      backgroundColor: "#ffffff",
      boxShadow: "0 16px 36px rgba(0, 0, 0, 0.08)",
      duration: 0.7,
      ease: "power3.out",
      overwrite: "auto",
    });
  };

  const setHeaderHidden = () => {
    if (isHidden) {
      return;
    }

    isHidden = true;
    header.classList.add("is-hidden");
    gsap.to(header, {
      yPercent: -115,
      autoAlpha: 0,
      backgroundColor: "rgba(255, 255, 255, 0.96)",
      boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
      duration: 0.58,
      ease: "power2.inOut",
      overwrite: "auto",
    });
  };

  gsap.set(header, {
    yPercent: 0,
    autoAlpha: 1,
    boxShadow: "0 16px 36px rgba(0, 0, 0, 0.08)",
  });

  const updateHeaderState = () => {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastScrollY;

    if (delta > 0) {
      accumulatedDelta = Math.max(0, accumulatedDelta) + delta;
    } else if (delta < 0) {
      accumulatedDelta = Math.min(0, accumulatedDelta) + delta;
    }

    if (currentScrollY <= 24) {
      accumulatedDelta = 0;
      setHeaderVisible();
    } else if (accumulatedDelta > hideDistanceThreshold && currentScrollY > hideThreshold) {
      accumulatedDelta = 0;
      setHeaderHidden();
    } else if (accumulatedDelta < -revealThreshold) {
      accumulatedDelta = 0;
      setHeaderVisible();
    }

    lastScrollY = currentScrollY;
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeaderState);
        ticking = true;
      }
    },
    { passive: true }
  );
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

function setupButtonMotion() {
  if (prefersReducedMotion) {
    return;
  }

  $$("[data-hover-lift]").forEach((button) => {
    button.addEventListener("mouseenter", () => {
      gsap.to(button, { y: -3, duration: 0.22, ease: "power2.out" });
    });
    button.addEventListener("mouseleave", () => {
      gsap.to(button, { y: 0, duration: 0.22, ease: "power2.out" });
    });
    button.addEventListener("focus", () => {
      gsap.to(button, { y: -2, duration: 0.22, ease: "power2.out" });
    });
    button.addEventListener("blur", () => {
      gsap.to(button, { y: 0, duration: 0.22, ease: "power2.out" });
    });
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
        ? "The designer intake service is currently having a server issue. Your application draft was saved on this device so you can retry shortly."
        : "The designer intake service is currently having a server issue. Please try again shortly.";
    }

    return draftWasSaved
      ? "The intake did not go through. Your application draft was saved on this device so you can retry in a moment."
      : "The intake did not go through. Please try again in a moment.";
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
  const now = new Date();
  const isoTimestamp = now.toISOString();
  const dateSent = formatLocalDate(now);
  const email = typeof fields.email === "string" ? fields.email : "";
  const name = typeof fields.name === "string" ? fields.name : "";
  const message = typeof fields.message === "string" ? fields.message : "";
  const inquiryType = typeof fields.type === "string" ? fields.type : "";
  const page = window.location.pathname.split("/").pop() || "index.html";
  const sourceUrl = window.location.href;
  const normalizedSubmission = {
    formType: webhookKey,
    email,
    name,
    message,
    inquiryType,
    page,
    sourceUrl,
    submittedAt: isoTimestamp,
    dateSent,
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
    formType: webhookKey,
    page,
    sourceUrl,
    submittedAt: isoTimestamp,
    dateSent,
    "Date Sent": dateSent,
    fieldsJson: JSON.stringify(flatFields),
    submissionJson: JSON.stringify(normalizedSubmission),
    metadataJson: JSON.stringify({
      page,
      sourceUrl,
      submittedAt: isoTimestamp,
      dateSent,
    }),
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
  const noteForm = hero.querySelector("[data-note-form]");
  const noteInput = hero.querySelector("[data-note-input]");
  const noteStatus = hero.querySelector("[data-note-status]");

  // The orthographic camera keeps the board feeling flat and graphic, while
  // the note meshes still get real Z-depth for shadows and subtle flutter.
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  camera.position.set(0, 0, 28);
  camera.lookAt(0, 0, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.45);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
  keyLight.position.set(6, 10, 18);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 50;
  keyLight.shadow.camera.left = -18;
  keyLight.shadow.camera.right = 18;
  keyLight.shadow.camera.top = 18;
  keyLight.shadow.camera.bottom = -18;
  keyLight.shadow.bias = -0.0003;
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
  board.receiveShadow = true;
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
  const heroLineKeys = ["d", "r", "o", "p", "zero", "one", "orange"];
  const heroNoteRotations = {
    d: -0.08,
    r: 0.06,
    o: -0.05,
    p: 0.07,
    zero: -0.04,
    one: 0.05,
    orange: -0.14,
  };
  const heroLayoutPresets = {
    desktop: {
      lineY: 0.62,
      maxHeight: 0.28,
      widthFill: 0.8,
      gap: 0.022,
      pink: { x: 0.85, y: 0.18, height: 0.24, rotationZ: 0.14, z: 3.02 },
    },
    laptop: {
      lineY: 0.67,
      maxHeight: 0.24,
      widthFill: 0.95,
      gap: 0.018,
      pink: { x: 0.9, y: 0.78, height: 0.2, rotationZ: 0.12, z: 2.98 },
    },
    tablet: {
      lineY: 0.22,
      maxHeight: 0.18,
      widthFill: 0.96,
      gap: 0.014,
      pink: { x: 0.88, y: 0.79, height: 0.18, rotationZ: 0.12, z: 2.94 },
    },
    mobile: {
      lineY: 0.2,
      maxHeight: 0.11,
      widthFill: 0.98,
      gap: 0.01,
      pink: { x: 0.84, y: 0.8, height: 0.16, rotationZ: 0.12, z: 2.9 },
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
  let frontZ = 9;
  let rafId = 0;
  let gustResetId = 0;

  const setGust = gsap.quickTo(scrollState, "gust", {
    duration: 0.45,
    ease: "power2.out",
  });

  if (noteInput) {
    noteInput.disabled = true;
  }

  if (noteStatus) {
    noteStatus.textContent = "Loading the board...";
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

    if (noteInput) {
      noteInput.disabled = false;
    }
    if (noteStatus) {
      noteStatus.textContent = "Type a note and pin it to the board.";
    }

    window.addEventListener("resize", resizeScene);
    rafId = window.requestAnimationFrame(render);
    ScrollTrigger.refresh();
  } catch (error) {
    console.error("DROP 01 notice board failed to initialize.", error);
    if (noteStatus) {
      noteStatus.textContent = "The board could not load right now. Refresh and try again.";
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
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
          texture.needsUpdate = true;
          resolve(texture);
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
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(x, y, z);
    mesh.rotation.z = rotationZ;
    mesh.renderOrder = Math.round(z * 10);

    mesh.userData.motion = {
      restX: x,
      restY: y,
      restZ: z,
      anchorX: x / Math.max(view.halfWidth, 1),
      anchorY: y / Math.max(view.halfHeight, 1),
      restRotationX: 0,
      restRotationY: 0,
      restRotationZ: rotationZ,
      width,
      height,
      flutterAmplitude: prefersReducedMotion ? 0 : randomBetween(0.006, 0.028),
      flutterSpeed: randomBetween(0.6, 1.4),
      flutterOffset: randomBetween(0, Math.PI * 2),
      bobAmplitude: prefersReducedMotion ? 0 : randomBetween(0.01, 0.08),
      bobSpeed: randomBetween(0.55, 1.1),
      driftAmplitude: prefersReducedMotion ? 0 : randomBetween(0.01, 0.06),
      driftSpeed: randomBetween(0.4, 0.85),
      liftRange: randomBetween(0.4, userNote ? 1.4 : 2.2),
      windDrift: randomBetween(-0.28, 0.28),
      rollRange: randomBetween(-0.05, 0.08),
      pitchRange: randomBetween(0.01, 0.12),
      yawRange: randomBetween(-0.08, 0.08),
      gustRoll: randomBetween(-0.14, 0.14),
      gustPitch: randomBetween(0.01, 0.12),
      gustYaw: randomBetween(-0.08, 0.08),
      isDragging: false,
      isThrowing: false,
      responsive: !userNote,
      ownsTexture,
      userNote,
    };

    noteMeshes.push(mesh);
    scene.add(mesh);
    return mesh;
  }

  function buildBackgroundLayer(posterTexture) {
    // The poster field should feel dense and imperfect, like a real board that
    // has been layered over time rather than algorithmically tiled.
    const posterCount = Math.round(44 + Math.min(12, view.width));

    for (let index = 0; index < posterCount; index += 1) {
      createNoteMesh({
        texture: posterTexture,
        height: randomBetween(2.4, 3.5),
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

  function getStagePoint(stage, xRatio, yRatio) {
    return {
      x: stage.left + stage.width * xRatio,
      y: stage.top - stage.height * yRatio,
    };
  }

  function applyHeroNoteLayout() {
    const stage = getHeroStageRect();
    const layoutPreset = getHeroLayoutPreset();
    let maxRestZ = frontZ;

    const totalAspect = heroLineKeys.reduce((sum, key) => {
      const note = heroNoteMeshes.get(key);
      if (!note) {
        return sum;
      }

      const motion = note.userData.motion;
      return sum + motion.width / Math.max(motion.height, 0.001);
    }, 0);
    const gap = stage.width * layoutPreset.gap;
    const rowHeight = Math.min(
      stage.height * layoutPreset.maxHeight,
      (stage.width * layoutPreset.widthFill - gap * (heroLineKeys.length - 1)) / Math.max(totalAspect, 1)
    );
    const totalWidth =
      rowHeight * totalAspect + gap * (heroLineKeys.length - 1);
    let cursor = stage.left + (stage.width - totalWidth) / 2;
    const lineY = stage.top - stage.height * layoutPreset.lineY;

    heroLineKeys.forEach((key, index) => {
      const note = heroNoteMeshes.get(key);
      if (!note) {
        return;
      }

      const motion = note.userData.motion;
      const aspect = motion.width / Math.max(motion.height, 0.001);
      const noteWidth = rowHeight * aspect;
      const centerX = cursor + noteWidth / 2;
      const z = 3.5 + index * 0.18;
      const scale = rowHeight / Math.max(motion.baseHeight, 0.001);

      motion.restX = centerX;
      motion.restY = lineY;
      motion.restZ = z;
      motion.restRotationZ = heroNoteRotations[key] ?? 0;

      note.scale.set(scale, scale, 1);
      note.renderOrder = Math.round(z * 10);

      if (!motion.isDragging && !motion.isThrowing) {
        note.position.set(centerX, lineY, z);
        note.rotation.z = motion.restRotationZ;
      }

      maxRestZ = Math.max(maxRestZ, z);
      cursor += noteWidth + gap;
    });

    const pinkNote = heroNoteMeshes.get("pink");
    if (pinkNote && layoutPreset.pink) {
      const motion = pinkNote.userData.motion;
      const point = getStagePoint(stage, layoutPreset.pink.x, layoutPreset.pink.y);
      const desiredHeight = stage.height * layoutPreset.pink.height;
      const scale = desiredHeight / Math.max(motion.baseHeight, 0.001);

      motion.restX = point.x;
      motion.restY = point.y;
      motion.restZ = layoutPreset.pink.z;
      motion.restRotationZ = layoutPreset.pink.rotationZ;

      pinkNote.scale.set(scale, scale, 1);
      pinkNote.renderOrder = Math.round(layoutPreset.pink.z * 10);

      if (!motion.isDragging && !motion.isThrowing) {
        pinkNote.position.set(point.x, point.y, layoutPreset.pink.z);
        pinkNote.rotation.z = layoutPreset.pink.rotationZ;
      }

      maxRestZ = Math.max(maxRestZ, layoutPreset.pink.z);
    }

    frontZ = maxRestZ;
  }

  function buildHeroNotes(textures) {
    const heroConfigs = [
      { key: "d", texture: textures.d, height: 3.34 },
      { key: "r", texture: textures.r, height: 3.3 },
      { key: "o", texture: textures.o, height: 3.36 },
      { key: "p", texture: textures.p, height: 3.4 },
      { key: "zero", texture: textures.zero, height: 3.24 },
      { key: "one", texture: textures.one, height: 3.18 },
      { key: "orange", texture: textures.orange, height: 3.15 },
      { key: "pink", texture: textures.pink, height: 3.04 },
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

  function revealHeroOverlay() {
    if (prefersReducedMotion) {
      return;
    }

    gsap.fromTo(
      hero.querySelectorAll(".hero__headline, .hero-note-form"),
      { autoAlpha: 0, y: 20 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: "power3.out",
      }
    );
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
        updateNoteStatus("Write something first, then pin it.");
        return;
      }

      addUserNote(text);
      noteInput.value = "";
      updateNoteStatus("Pinned to the board.");
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
    if (velocity.length() > 8.5) {
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
    frontZ += 0.45;
    note.position.z = frontZ;
    note.renderOrder = Math.round(frontZ * 10);
    note.userData.motion.restZ = frontZ;
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
      z: frontZ + 2.4,
      rotationZ: randomBetween(-0.12, 0.12),
      ownsTexture: true,
      userNote: true,
    });

    const motion = note.userData.motion;
    motion.isThrowing = true;
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
    canvasTexture.width = 1024;
    canvasTexture.height = 768;

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
    context.fillRect(canvasTexture.width * 0.36, 28, canvasTexture.width * 0.28, 72);

    context.strokeStyle = "rgba(0,0,0,0.08)";
    context.lineWidth = 10;
    context.strokeRect(16, 16, canvasTexture.width - 32, canvasTexture.height - 32);

    context.fillStyle = "rgba(0,0,0,0.45)";
    context.font =
      "700 30px 'Helvetica Neue Condensed', 'Arial Narrow', Arial, sans-serif";
    context.textAlign = "left";
    context.fillText("PINNED NOTE", 58, 92);

    context.fillStyle = "#141414";
    context.font =
      "700 98px 'Helvetica Neue Condensed', 'Arial Narrow', Arial, sans-serif";
    context.textAlign = "center";

    const lines = wrapCanvasText(context, text.toUpperCase(), canvasTexture.width - 160);
    const lineHeight = 108;
    const startY = canvasTexture.height * 0.42 - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, index) => {
      context.fillText(line, canvasTexture.width / 2, startY + index * lineHeight);
    });

    context.fillStyle = "rgba(0,0,0,0.44)";
    context.font =
      "600 28px 'Helvetica Neue Condensed', 'Arial Narrow', Arial, sans-serif";
    context.fillText("DRAG IT. THROW IT. MAKE IT REAL.", canvasTexture.width / 2, canvasTexture.height - 68);

    const texture = new THREE.CanvasTexture(canvasTexture);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
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
    const bounds = hero.getBoundingClientRect();
    const width = Math.max(bounds.width, 1);
    const height = Math.max(bounds.height, 1);
    const aspect = width / height;

    renderer.setSize(width, height, false);

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
      if (!motion.responsive) {
        return;
      }

      motion.restX = motion.anchorX * view.halfWidth;
      motion.restY = motion.anchorY * view.halfHeight;

      if (!motion.isDragging && !motion.isThrowing) {
        note.position.x = motion.restX;
        note.position.y = motion.restY;
      }
    });

    applyHeroNoteLayout();
  }

  function render(time) {
    const elapsed = time * 0.001;
    const gust = scrollState.gust;
    const gustLift = Math.abs(gust);

    // The render loop combines three layers of motion:
    // 1. a baseline paper flutter
    // 2. a scroll-driven updraft
    // 3. temporary drag / throw states that take over when the user interacts
    noteMeshes.forEach((note) => {
      const motion = note.userData.motion;
      if (motion.isDragging || motion.isThrowing) {
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
    window.cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resizeScene);
    document.body.classList.remove("is-dragging-notice-board");
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
    canvas.removeEventListener("pointerleave", onPointerUp);
    renderer.dispose();
  });
}
