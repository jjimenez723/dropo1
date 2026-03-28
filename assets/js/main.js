import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/+esm";
import { gsap } from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm";
import { ScrollTrigger } from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger/+esm";

gsap.registerPlugin(ScrollTrigger);

// Shared motion and UI helpers still power the inner pages, while the
// home page boots an isolated Three.js scene for the physical notice board.
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

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
  poster: new URL("../../dropo1/9.svg", import.meta.url).href,
};

init();

function init() {
  setupRevealAnimations();
  setupButtonMotion();
  setupForms();
  setupShopMotion();
  setupModal();
  setupFloatingSubscribeCard();
  setupMultiStepForm();
  setupNoticeBoardHero();
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

function setSuccessMessage(form, message) {
  let slot = form.querySelector("[data-success]");
  if (!slot) {
    slot = document.createElement("p");
    slot.className = "success-message";
    slot.setAttribute("data-success", "");
    form.appendChild(slot);
  }
  slot.textContent = message;
}

function setupForms() {
  $$("form[data-demo-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const type = form.getAttribute("data-demo-form");
      const messageMap = {
        subscribe: "You are on the list for the next limited release.",
        contact: "Message received. We will reply with next steps within two business days.",
        designer:
          "Your designer intake has been staged for review. Expect a follow-up from the curation team soon.",
      };
      setSuccessMessage(form, messageMap[type] || "Submission received.");
      form.reset();
    });
  });
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
      renderStep(currentStep + 1);
    }

    if (target.hasAttribute("data-prev")) {
      event.preventDefault();
      renderStep(currentStep - 1);
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    setSuccessMessage(
      form,
      "Your drop proposal is in the queue. We will review the portfolio and circle back with fit, timeline, and next production steps."
    );
    form.reset();
    renderStep(0);
  });

  renderStep(0);
}

async function setupNoticeBoardHero() {
  const hero = document.querySelector("[data-notice-board]");
  const canvas = document.querySelector("#notice-board-canvas");
  if (!hero || !canvas) {
    return;
  }

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
    new THREE.MeshStandardMaterial({
      color: 0x1d2023,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.92,
    })
  );
  board.position.set(0, 0, -8);
  board.receiveShadow = true;
  scene.add(board);

  const textureLoader = new THREE.TextureLoader();
  const textureCache = new Map();
  const noteMeshes = [];
  const scrollState = { progress: 0, gust: 0 };
  const view = { halfHeight: 8, halfWidth: 8, height: 16, width: 16 };

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

  function buildHeroNotes(textures) {
    // These six letter notes intentionally sit higher in Z so they read as the
    // central DROP 01 composition over the poster bed.
    const heroConfigs = [
      { texture: textures.d, height: 3.34, y: -0.42, rotationZ: -0.08 },
      { texture: textures.r, height: 3.3, y: -0.56, rotationZ: 0.06 },
      { texture: textures.o, height: 3.36, y: -0.38, rotationZ: -0.05 },
      { texture: textures.p, height: 3.4, y: -0.5, rotationZ: 0.07 },
      { texture: textures.zero, height: 3.24, y: -0.4, rotationZ: -0.04 },
      { texture: textures.one, height: 3.18, y: -0.3, rotationZ: 0.05 },
    ];

    const gap = 0.26;
    const totalWidth =
      heroConfigs.reduce((sum, config) => sum + config.height * textureAspect(config.texture), 0) +
      gap * (heroConfigs.length - 1);

    let cursor = -totalWidth / 2;

    heroConfigs.forEach((config, index) => {
      const width = config.height * textureAspect(config.texture);
      const x = cursor + width / 2;
      const z = 3.5 + index * 0.18;
      createNoteMesh({
        texture: config.texture,
        height: config.height,
        x,
        y: config.y,
        z,
        rotationZ: config.rotationZ,
      });
      cursor += width + gap;
      frontZ = Math.max(frontZ, z);
    });

    createNoteMesh({
      texture: textures.orange,
      height: 3.15,
      x: -view.halfWidth * 0.5,
      y: -2.38,
      z: 2.95,
      rotationZ: -0.16,
    });

    createNoteMesh({
      texture: textures.pink,
      height: 3.04,
      x: view.halfWidth * 0.42,
      y: 1.32,
      z: 2.78,
      rotationZ: 0.14,
    });
  }

  function setupScrollWind() {
    ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: "bottom top",
      scrub: prefersReducedMotion ? false : 0.65,
      onUpdate(self) {
        scrollState.progress = self.progress;
        if (prefersReducedMotion) {
          return;
        }

        const gust = THREE.MathUtils.clamp(self.getVelocity() / 2400, -1, 1);
        setGust(gust);
        window.clearTimeout(gustResetId);
        gustResetId = window.setTimeout(() => {
          setGust(0);
        }, 120);
      },
    });
  }

  function revealHeroOverlay() {
    if (prefersReducedMotion) {
      return;
    }

    gsap.fromTo(
      hero.querySelectorAll(".hero__headline, .hero__legend, .hero-note-form"),
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
    event.preventDefault();
    updatePointer(event);
    const intersections = raycaster.intersectObjects(noteMeshes, false);
    const hit = intersections[0];
    if (!hit) {
      return;
    }

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
  }

  function render(time) {
    const elapsed = time * 0.001;
    const gust = Math.max(scrollState.gust, 0);

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

      note.position.x = motion.restX + drift + scrollState.progress * motion.windDrift * 0.16 + gust * motion.windDrift;
      note.position.y = motion.restY + bob + scrollState.progress * motion.liftRange + gust * motion.liftRange * 0.26;
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
