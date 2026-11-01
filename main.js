(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const pointerFx = finePointer && !reduceMotion;
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  // Small mono labels flicker through random characters, then resolve left to right.
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789<>/_+*";
  const eyebrowTexts = [];
  document.querySelectorAll(".eyebrow").forEach((eyebrow) => {
    const node = [...eyebrow.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
    if (!node) return;
    const label = node.textContent.trim();
    const hidden = document.createElement("span");
    hidden.className = "visually-hidden";
    hidden.textContent = label;
    const shown = document.createElement("span");
    shown.className = "eyebrow__text";
    shown.setAttribute("aria-hidden", "true");
    shown.textContent = label;
    node.replaceWith(hidden, shown);
    eyebrowTexts.push(shown);
  });

  const decode = (el) => {
    if (reduceMotion || el.dataset.decoded) return;
    el.dataset.decoded = "true";
    const final = el.textContent;
    const duration = 650;
    const start = performance.now();
    const frame = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const settled = Math.floor(progress * final.length);
      let out = final.slice(0, settled);
      for (let i = settled; i < final.length; i++) {
        out += final[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (progress < 1) requestAnimationFrame(frame);
      else el.textContent = final;
    };
    requestAnimationFrame(frame);
  };

  // Type that breathes: big headings are split into letters whose weight can swell.
  // Each letter keeps its weight-600 width, so nothing around it ever shifts.
  const BASE_WEIGHT = 600;
  const groups = new Map();
  const allLetters = [];

  const splitIntoLetters = (el) => {
    const text = el.textContent.trim();
    const hidden = document.createElement("span");
    hidden.className = "visually-hidden";
    hidden.textContent = `${text} `;
    const visual = document.createElement("span");
    visual.setAttribute("aria-hidden", "true");
    const letters = [];
    text.split(" ").forEach((word, i) => {
      if (i) visual.append(" ");
      const w = document.createElement("span");
      w.className = "word";
      for (const ch of word) {
        const l = document.createElement("span");
        l.className = "ltr";
        l.textContent = ch;
        w.appendChild(l);
        letters.push({ el: l, wave: 0 });
      }
      visual.appendChild(w);
    });
    el.replaceChildren(hidden, visual);
    allLetters.push(...letters);
    return letters;
  };

  function measureLetters() {
    if (!allLetters.length) return;
    allLetters.forEach(({ el }) => {
      el.style.width = "";
      el.style.fontWeight = BASE_WEIGHT;
    });
    allLetters.forEach(({ el }) => {
      el.style.width = `${el.getBoundingClientRect().width}px`;
    });
  }

  const makeGroup = (letters, { boost, extraBoost = () => 0 }) => ({
    letters,
    boost,
    paint() {
      for (const l of letters) {
        const weight = BASE_WEIGHT + Math.max(l.wave, extraBoost(l.el));
        l.el.style.fontWeight = Math.round(weight);
      }
    },
  });

  // One sweep of weight from left to right across a group of letters.
  const wave = (group, duration = 1400) => {
    if (!group || group.running) return;
    group.running = true;
    const boxes = group.letters.map((l) => l.el.getBoundingClientRect());
    const left = Math.min(...boxes.map((b) => b.left));
    const right = Math.max(...boxes.map((b) => b.right));
    const spread = parseFloat(getComputedStyle(group.letters[0].el).fontSize) * 0.55;
    const from = left - spread * 2;
    const to = right + spread * 2;
    const start = performance.now();
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
    const frame = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const x = from + (to - from) * ease(t);
      group.letters.forEach((l, i) => {
        const dx = boxes[i].left + boxes[i].width / 2 - x;
        l.wave = t < 1 ? group.boost * Math.exp(-(dx * dx) / (2 * spread * spread)) : 0;
      });
      group.paint();
      if (t < 1) requestAnimationFrame(frame);
      else group.running = false;
    };
    requestAnimationFrame(frame);
  };

  let heroGroup = null;
  if (!reduceMotion) {
    // Hero name: reacts to the cursor, and sweeps once after it slides in.
    const heroLetters = [...document.querySelectorAll("[data-weight]")].flatMap(splitIntoLetters);
    let pointer = null;
    const SPREAD = 120;
    heroGroup = makeGroup(heroLetters, {
      boost: 160,
      extraBoost: (el) => {
        if (!pointer) return 0;
        const r = el.getBoundingClientRect();
        const dx = pointer.x - (r.left + r.width / 2);
        const dy = pointer.y - (r.top + r.height / 2);
        return 160 * Math.exp(-(dx * dx + dy * dy) / (2 * SPREAD * SPREAD));
      },
    });

    if (pointerFx) {
      const hero = document.querySelector(".hero");
      let queued = false;
      const queue = () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          heroGroup.paint();
        });
      };
      hero.addEventListener("pointermove", (e) => {
        pointer = { x: e.clientX, y: e.clientY };
        queue();
      });
      hero.addEventListener("pointerleave", () => {
        pointer = null;
        queue();
      });
    }

    // Tapping or clicking the name replays the sweep.
    document.querySelector(".hero__title").addEventListener("click", () => wave(heroGroup));

    // Section titles breathe once when they scroll in.
    document.querySelectorAll(".section__title, .contact__title .line__inner").forEach((title) => {
      groups.set(title.closest("[data-reveal]"), makeGroup(splitIntoLetters(title), { boost: 120 }));
    });

    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
      measureLetters();
      setTimeout(() => wave(heroGroup, 1600), 1150);
    });
  }

  // Fade sections in as they scroll into view.
  const revealables = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const revealer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            entry.target.querySelectorAll(".eyebrow__text").forEach(decode);
            const titleGroup = groups.get(entry.target);
            if (titleGroup) setTimeout(() => wave(titleGroup, 1200), 450);
            revealer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealables.forEach((el) => revealer.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add("is-in"));
  }

  // Header border once the page has scrolled.
  const header = document.querySelector(".site-header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mark the nav link for the section in view, and slide the indicator under it.
  const nav = document.querySelector(".nav");
  const indicator = document.querySelector(".nav__indicator");
  const navLinks = new Map(
    [...document.querySelectorAll(".nav__links a")].map((a) => [a.getAttribute("href").slice(1), a])
  );
  const sectionFor = { education: "experience" };

  const moveIndicator = (target) => {
    const current = target || document.querySelector('.nav__links a[aria-current="true"]');
    if (!current) {
      indicator.style.opacity = "0";
      return;
    }
    const navBox = nav.getBoundingClientRect();
    const box = current.getBoundingClientRect();
    const padBottom = parseFloat(getComputedStyle(current).paddingBottom);
    const top = box.bottom - navBox.top - (padBottom - 6) - 1.5;
    indicator.style.width = `${box.width}px`;
    indicator.style.transform = `translate(${box.left - navBox.left}px, ${top}px)`;
    indicator.style.opacity = "1";
    // Snap into place the first time, glide afterwards.
    if (!indicator.classList.contains("is-ready")) {
      requestAnimationFrame(() => indicator.classList.add("is-ready"));
    }
  };

  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = sectionFor[entry.target.id] || entry.target.id;
          navLinks.forEach((link, key) => {
            if (key === id) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
          });
          if (!hoveredLink) moveIndicator();
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    document.querySelectorAll("main > section[id]").forEach((s) => spy.observe(s));
  }

  // On hover, the indicator previews the link under the cursor.
  let hoveredLink = null;
  if (pointerFx) {
    navLinks.forEach((link) => {
      link.addEventListener("pointerenter", () => {
        hoveredLink = link;
        moveIndicator(link);
      });
    });
    document.querySelector(".nav__links").addEventListener("pointerleave", () => {
      hoveredLink = null;
      moveIndicator();
    });
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      moveIndicator();
      measureLetters();
    }, 150);
  });

  // Project cards tilt toward the cursor with a soft light following it.
  if (pointerFx) {
    document.querySelectorAll(".project").forEach((card) => {
      const max = card.classList.contains("project--featured") ? 1.5 : 3;
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--ry", `${((px - 0.5) * 2 * max).toFixed(2)}deg`);
        card.style.setProperty("--rx", `${((0.5 - py) * 2 * max).toFixed(2)}deg`);
        card.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
        card.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
        card.classList.add("is-tilting");
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
        card.classList.remove("is-tilting");
      });
    });
  }

  // Buttons drift a few pixels toward the cursor.
  if (pointerFx) {
    document.querySelectorAll(".hero__links .btn, .contact__links .btn").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const dx = clamp((e.clientX - (r.left + r.width / 2)) * 0.15, -4, 4);
        const dy = clamp((e.clientY - (r.top + r.height / 2)) * 0.3, -4, 4);
        btn.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.translate = "";
      });
    });
  }

  // The AWS sticker swings when the certification row arrives, and when nudged.
  const sticker = document.querySelector(".sticker");
  if (sticker && !reduceMotion) {
    const swing = () => {
      sticker.classList.remove("is-swinging");
      void sticker.offsetWidth; // restart the animation
      sticker.classList.add("is-swinging");
    };
    sticker.addEventListener("animationend", () => sticker.classList.remove("is-swinging"));
    sticker.closest(".chip--cert").addEventListener("pointerenter", swing);
    const row = sticker.closest("[data-reveal]");
    if ("IntersectionObserver" in window && row) {
      const once = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          once.disconnect();
          setTimeout(swing, 700);
        }
      }, { threshold: 0.6 });
      once.observe(row);
    }
  }

  // Copy email to clipboard.
  const copyBtn = document.querySelector("[data-copy]");
  const status = document.querySelector("[data-copy-status]");
  if (copyBtn && navigator.clipboard) {
    const label = copyBtn.querySelector(".copy__label");
    const icon = copyBtn.querySelector("[data-copy-icon]");
    let resetTimer;
    copyBtn.addEventListener("click", async () => {
      clearTimeout(resetTimer);
      try {
        await navigator.clipboard.writeText(copyBtn.dataset.copy);
        label.textContent = "Copied";
        icon.setAttribute("href", "#i-check");
        copyBtn.classList.add("is-copied");
        status.textContent = "Email address copied to clipboard";
      } catch {
        label.textContent = "Copy failed";
      }
      resetTimer = setTimeout(() => {
        label.textContent = "Copy";
        icon.setAttribute("href", "#i-copy");
        copyBtn.classList.remove("is-copied");
        status.textContent = "";
      }, 2000);
    });
  } else if (copyBtn) {
    copyBtn.hidden = true;
  }

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
})();
