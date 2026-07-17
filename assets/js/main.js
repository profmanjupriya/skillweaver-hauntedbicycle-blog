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

  /* ---- Archive category filter + pagination ---- */
  function initArchiveFilter() {
    var root = document.querySelector("[data-archive]");
    if (!root) return;

    var PAGE_SIZE = 6;
    var buttons = root.querySelectorAll("[data-filter]");
    var cards = Array.prototype.slice.call(
      root.querySelectorAll("[data-archive-grid] .card[data-category]")
    );
    var countEl = root.querySelector("[data-archive-count]");
    var pagesEl = root.querySelector("[data-archive-pages]");
    var emptyEl = root.querySelector("[data-archive-empty]");
    var activeFilter = "all";
    var currentPage = 1;

    function matchingCards() {
      if (activeFilter === "all") return cards;
      return cards.filter(function (card) {
        return card.getAttribute("data-category") === activeFilter;
      });
    }

    function render() {
      var matches = matchingCards();
      var totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
      if (currentPage > totalPages) currentPage = totalPages;

      cards.forEach(function (card) {
        card.classList.add("is-hidden");
      });

      var start = (currentPage - 1) * PAGE_SIZE;
      var visible = matches.slice(start, start + PAGE_SIZE);
      visible.forEach(function (card) {
        card.classList.remove("is-hidden");
      });

      if (countEl) {
        var n = matches.length;
        countEl.textContent = n + (n === 1 ? " post" : " posts");
      }

      if (emptyEl) {
        if (matches.length === 0) emptyEl.classList.remove("is-hidden");
        else emptyEl.classList.add("is-hidden");
      }

      if (pagesEl) {
        pagesEl.innerHTML = "";
        for (var i = 1; i <= totalPages; i++) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          a.href = "#";
          a.textContent = String(i);
          if (i === currentPage) a.setAttribute("aria-current", "page");
          a.addEventListener("click", function (page) {
            return function (e) {
              e.preventDefault();
              currentPage = page;
              render();
            };
          }(i));
          li.appendChild(a);
          pagesEl.appendChild(li);
        }
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeFilter = btn.getAttribute("data-filter") || "all";
        currentPage = 1;
        buttons.forEach(function (b) {
          b.setAttribute(
            "aria-pressed",
            String(b === btn)
          );
        });
        render();
      });
    });

    render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initReadingProgress();
    initReveal();
    initArchiveFilter();
  });
})();
