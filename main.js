(() => {
  // Fade sections in as they scroll into view.
  const revealables = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const revealer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
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

  // Mark the nav link for the section currently in view.
  const navLinks = new Map(
    [...document.querySelectorAll(".nav__links a")].map((a) => [a.getAttribute("href").slice(1), a])
  );
  const sectionFor = { education: "experience" };
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
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    document.querySelectorAll("main > section[id]").forEach((s) => spy.observe(s));
  }

  // Copy email to clipboard.
  const copyBtn = document.querySelector("[data-copy]");
  const status = document.querySelector("[data-copy-status]");
  if (copyBtn && navigator.clipboard) {
    const label = copyBtn.querySelector(".copy__label");
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(copyBtn.dataset.copy);
        label.textContent = "Copied";
        status.textContent = "Email address copied to clipboard";
      } catch {
        label.textContent = "Copy failed";
      }
      setTimeout(() => {
        label.textContent = "Copy";
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
