/**
 * The Haunted Bicycle — main.js
 * Vanilla JS, no build step, no dependencies.
 * Handles: mobile nav toggle, reading progress bar, scroll reveal.
 */

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---- Mobile nav toggle ---- */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var list = document.querySelector(".site-nav__list");
    if (!toggle || !list) return;

    toggle.addEventListener("click", function () {
      var isOpen = list.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Close on Escape, close on outside click
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && list.classList.contains("is-open")) {
        list.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });

    document.addEventListener("click", function (e) {
      if (
        list.classList.contains("is-open") &&
        !list.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        list.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---- Reading progress bar (post pages only) ---- */
  function initReadingProgress() {
    var article = document.querySelector("[data-reading-progress]");
    if (!article) return;

    var bar = document.createElement("div");
    bar.className = "reading-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);

    var ticking = false;

    function update() {
      var rect = article.getBoundingClientRect();
      var articleHeight = rect.height - window.innerHeight;
      var scrolled = Math.min(
        Math.max(-rect.top, 0),
        Math.max(articleHeight, 1)
      );
      var pct = (scrolled / Math.max(articleHeight, 1)) * 100;
      bar.style.width = pct.toFixed(1) + "%";
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    });
    update();
  }

  /* ---- Scroll reveal for cards (skipped if reduced motion) ---- */
  function initReveal() {
    if (prefersReducedMotion) return;
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length || !("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.style.animation =
              "float-in 500ms cubic-bezier(0.16,1,0.3,1) both";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initReadingProgress();
    initReveal();
  });
})();
