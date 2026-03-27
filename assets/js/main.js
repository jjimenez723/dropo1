(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined";
  const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";
  const hasThree = typeof window.THREE !== "undefined";

  if (hasGsap && hasScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
  }

  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  function setupRevealAnimations() {
    const revealItems = $$(".reveal");
    if (!revealItems.length) {
      return;
    }

    if (!hasGsap || !hasScrollTrigger || prefersReducedMotion) {
      revealItems.forEach((item) => {
        item.style.opacity = "1";
        item.style.transform = "none";
      });
      return;
    }

    revealItems.forEach((item, index) => {
      window.gsap.fromTo(
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
    if (!hasGsap || prefersReducedMotion) {
      return;
    }

    $$("[data-hover-lift]").forEach((button) => {
      button.addEventListener("mouseenter", () => {
        window.gsap.to(button, { y: -3, duration: 0.22, ease: "power2.out" });
      });
      button.addEventListener("mouseleave", () => {
        window.gsap.to(button, { y: 0, duration: 0.22, ease: "power2.out" });
      });
      button.addEventListener("focus", () => {
        window.gsap.to(button, { y: -2, duration: 0.22, ease: "power2.out" });
      });
      button.addEventListener("blur", () => {
        window.gsap.to(button, { y: 0, duration: 0.22, ease: "power2.out" });
      });
    });
  }

  function setupCollageMotion() {
    const collage = document.querySelector("[data-collage]");
    if (!collage) {
      return;
    }

    const cards = $$(".collage-card", collage);

    if (hasGsap && !prefersReducedMotion) {
      cards.forEach((card, index) => {
        const amplitude = 10 + index * 1.6;
        window.gsap.to(card, {
          y: amplitude,
          x: index % 2 === 0 ? amplitude * 0.24 : amplitude * -0.18,
          rotation: index % 2 === 0 ? "+=1.4" : "-=1.4",
          duration: 4.8 + index * 0.55,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
      });

      window.gsap.from(".hero__copy > *", {
        opacity: 0,
        y: 28,
        duration: 0.9,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.12,
      });
    }

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
          designer: "Your designer intake has been staged for review. Expect a follow-up from the curation team soon.",
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

      if (!hasGsap || !hasScrollTrigger || prefersReducedMotion) {
        fill.style.width = `${value}%`;
        return;
      }

      window.gsap.to(fill, {
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
    let opened = false;

    const openModal = () => {
      if (opened || sessionStorage.getItem(stateKey) === "true") {
        return;
      }
      opened = true;
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";

      if (hasGsap && !prefersReducedMotion) {
        window.gsap.fromTo(
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
        openModal();
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
      window.setTimeout(openModal, 2600);
      const onScroll = () => {
        const threshold = window.innerHeight * 0.35;
        if (window.scrollY > threshold) {
          openModal();
          window.removeEventListener("scroll", onScroll);
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
    }
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
      if (activeStep && hasGsap && !prefersReducedMotion) {
        window.gsap.fromTo(
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

  function setupThreeHero() {
    const canvas = document.querySelector("#hero-canvas");
    if (!canvas || !hasThree || prefersReducedMotion) {
      return;
    }

    const scene = new window.THREE.Scene();
    const renderer = new window.THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));

    const camera = new window.THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    const group = new window.THREE.Group();
    scene.add(group);

    const torus = new window.THREE.Mesh(
      new window.THREE.TorusKnotGeometry(1.6, 0.38, 160, 18),
      new window.THREE.MeshPhysicalMaterial({
        color: 0xb8914f,
        emissive: 0x2d2116,
        metalness: 0.48,
        roughness: 0.36,
        transparent: true,
        opacity: 0.32,
        clearcoat: 1,
      })
    );

    const frame = new window.THREE.Mesh(
      new window.THREE.IcosahedronGeometry(2.6, 1),
      new window.THREE.MeshBasicMaterial({
        color: 0xd7b9b3,
        wireframe: true,
        transparent: true,
        opacity: 0.16,
      })
    );

    const orb = new window.THREE.Mesh(
      new window.THREE.SphereGeometry(0.42, 32, 32),
      new window.THREE.MeshPhysicalMaterial({
        color: 0xf6efe6,
        metalness: 0.1,
        roughness: 0.08,
        transparent: true,
        opacity: 0.72,
      })
    );
    orb.position.set(-2.2, 1.1, -0.2);

    group.add(torus, frame, orb);

    const ambient = new window.THREE.AmbientLight(0xffffff, 0.95);
    const point = new window.THREE.PointLight(0xf4dcb2, 2.2, 18);
    point.position.set(3.2, 2.8, 4.4);
    scene.add(ambient, point);

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) {
        return;
      }
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };

    let frameId = 0;
    const tick = () => {
      frameId = requestAnimationFrame(tick);
      torus.rotation.x += 0.0032;
      torus.rotation.y += 0.0045;
      frame.rotation.x -= 0.0015;
      frame.rotation.y += 0.002;
      orb.position.y = 1.1 + Math.sin(Date.now() * 0.0014) * 0.3;
      renderer.render(scene, camera);
    };

    resize();
    tick();
    window.addEventListener("resize", resize);
    window.addEventListener("beforeunload", () => cancelAnimationFrame(frameId), { once: true });
  }

  function init() {
    setupRevealAnimations();
    setupButtonMotion();
    setupCollageMotion();
    setupForms();
    setupShopMotion();
    setupModal();
    setupMultiStepForm();
    setupThreeHero();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
