/**
 * The Haunted Bicycle — main.js
 * Vanilla JS, no build step, no dependencies.
 * Handles: shared header/footer includes, post prev/next + related posts,
 * mobile nav, reading progress, scroll reveal.
 */

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---- Shared header / footer includes ---- */
  function loadIncludes() {
    var slots = document.querySelectorAll("[data-include]");
    if (!slots.length) return Promise.resolve();

    return Promise.all(
      Array.prototype.map.call(slots, function (slot) {
        var name = slot.getAttribute("data-include");
        if (!name) return Promise.resolve();

        return fetch("/components/" + name + ".html")
          .then(function (response) {
            if (!response.ok) {
              throw new Error(
                "Failed to load /components/" + name + ".html (" + response.status + ")"
              );
            }
            return response.text();
          })
          .then(function (html) {
            var range = document.createRange();
            range.selectNodeContents(slot);
            var fragment = range.createContextualFragment(html);
            slot.replaceWith(fragment);
          })
          .catch(function (err) {
            console.error(err);
            slot.innerHTML =
              "<!-- include failed: " + name + " — serve over HTTP, not file:// -->";
          });
      })
    );
  }

  function normalizePath(path) {
    path = (path || "").split("?")[0].split("#")[0];
    if (!path || path === "/") return "/index.html";
    if (path.endsWith("/")) return path + "index.html";
    return path;
  }

  function markCurrentNav() {
    var current = normalizePath(window.location.pathname);
    document.querySelectorAll(".site-nav__list .nav-link").forEach(function (link) {
      var href = normalizePath(link.getAttribute("href"));
      if (href === current) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function setYear() {
    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  /* ---- Post catalog (prev/next + related) ---- */
  var CATEGORY_LABELS = {
    architecture: "Architecture",
    database: "Database",
    assessment: "Adaptive Assessment",
    deployment: "Deployment",
    testing: "Testing",
    craft: "Craft",
    pedagogy: "Pedagogy",
    design: "Design"
  };

  var postsCatalogPromise = null;

  function loadPostsCatalog() {
    if (!postsCatalogPromise) {
      postsCatalogPromise = fetch("/data/posts.json")
        .then(function (response) {
          if (!response.ok) {
            throw new Error(
              "Failed to load /data/posts.json (" + response.status + ")"
            );
          }
          return response.json();
        })
        .then(function (posts) {
          if (!Array.isArray(posts)) return [];
          return posts.slice().sort(function (a, b) {
            return String(a.date).localeCompare(String(b.date));
          });
        });
    }
    return postsCatalogPromise;
  }

  function currentPostSlug() {
    var path = normalizePath(window.location.pathname);
    var match = path.match(/\/posts\/([^/]+)\.html$/);
    return match ? match[1] : null;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatPostDate(iso) {
    var parts = String(iso || "").split("-");
    if (parts.length !== 3) return String(iso || "");
    var months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    var month = months[Number(parts[1]) - 1] || parts[1];
    return month + " " + Number(parts[2]) + ", " + parts[0];
  }

  function categoryPillsHtml(categories) {
    return (categories || [])
      .map(function (category) {
        var label = CATEGORY_LABELS[category] || category;
        return (
          '<span class="pill pill--' +
          escapeHtml(category) +
          '">' +
          escapeHtml(label) +
          "</span>"
        );
      })
      .join("");
  }

  function postNavLinkHtml(post, direction) {
    if (!post) {
      var emptyLabel =
        direction === "prev"
          ? "You're at the beginning of the archive"
          : "You're at the end of the archive";
      var emptyDir =
        direction === "prev" ? "&larr; Previous" : "Next &rarr;";
      var emptyClass =
        direction === "next"
          ? "post-nav__link post-nav__link--next"
          : "post-nav__link";
      return (
        '<span class="' +
        emptyClass +
        '" style="opacity: 0.4; cursor: default;">' +
        '<span class="post-nav__dir">' +
        emptyDir +
        "</span>" +
        "<div>" +
        emptyLabel +
        "</div>" +
        "</span>"
      );
    }

    var className =
      direction === "next"
        ? "post-nav__link post-nav__link--next"
        : "post-nav__link";
    var dirLabel = direction === "prev" ? "&larr; Previous" : "Next &rarr;";
    return (
      '<a class="' +
      className +
      '" href="/posts/' +
      escapeHtml(post.slug) +
      '.html">' +
      '<span class="post-nav__dir">' +
      dirLabel +
      "</span>" +
      "<div>" +
      escapeHtml(post.title) +
      "</div>" +
      "</a>"
    );
  }

  function renderPostNav(posts, currentSlug) {
    var slot = document.querySelector("[data-post-nav]");
    if (!slot) return;

    var index = -1;
    for (var i = 0; i < posts.length; i++) {
      if (posts[i].slug === currentSlug) {
        index = i;
        break;
      }
    }
    if (index === -1) return;

    var prev = index > 0 ? posts[index - 1] : null;
    var next = index < posts.length - 1 ? posts[index + 1] : null;
    slot.innerHTML =
      postNavLinkHtml(prev, "prev") + postNavLinkHtml(next, "next");
  }

  function relatedCardHtml(post) {
    var category = (post.categories && post.categories[0]) || "craft";
    var label = CATEGORY_LABELS[category] || category;
    return (
      '<a class="card" href="/posts/' +
      escapeHtml(post.slug) +
      '.html">' +
      '<img class="card__art" src="' +
      escapeHtml(post.art) +
      '" alt="" style="width:56px;height:56px;">' +
      '<div class="pill-row"><span class="pill pill--' +
      escapeHtml(category) +
      '">' +
      escapeHtml(label) +
      "</span></div>" +
      '<h3 class="card__title">' +
      escapeHtml(post.title) +
      "</h3>" +
      '<p class="card__excerpt">' +
      escapeHtml(post.excerpt) +
      "</p>" +
      "</a>"
    );
  }

  function pickRelatedPosts(posts, currentSlug, pinnedSlugs, limit) {
    var bySlug = {};
    posts.forEach(function (post) {
      bySlug[post.slug] = post;
    });

    var selected = [];
    var seen = {};

    function add(post) {
      if (!post || post.slug === currentSlug || seen[post.slug]) return;
      seen[post.slug] = true;
      selected.push(post);
    }

    pinnedSlugs.forEach(function (slug) {
      if (selected.length >= limit) return;
      add(bySlug[slug]);
    });

    if (selected.length >= limit) return selected;

    var current = bySlug[currentSlug];
    var currentCats = (current && current.categories) || [];
    var others = posts
      .filter(function (post) {
        return post.slug !== currentSlug;
      })
      .slice()
      .sort(function (a, b) {
        return String(b.date).localeCompare(String(a.date));
      });

    others.forEach(function (post) {
      if (selected.length >= limit) return;
      var cats = post.categories || [];
      var shares = cats.some(function (cat) {
        return currentCats.indexOf(cat) !== -1;
      });
      if (shares) add(post);
    });

    others.forEach(function (post) {
      if (selected.length >= limit) return;
      add(post);
    });

    return selected;
  }

  function renderRelatedPosts(posts, currentSlug) {
    var slot = document.querySelector("[data-related-posts]");
    if (!slot) return;

    var attr = slot.getAttribute("data-related-posts") || "";
    var pinnedSlugs = attr
      .split(",")
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);

    var related = pickRelatedPosts(posts, currentSlug, pinnedSlugs, 2);
    if (!related.length) {
      slot.remove();
      return;
    }

    slot.innerHTML =
      '<h2 style="margin-bottom: var(--space-md);">Related posts</h2>' +
      '<div class="grid grid--cards">' +
      related.map(relatedCardHtml).join("") +
      "</div>";
  }

  function renderArchiveGrid(posts) {
    var grid = document.querySelector("[data-archive-grid]");
    if (!grid) return;

    var newestFirst = posts.slice().reverse();
    grid.innerHTML = newestFirst
      .map(function (post) {
        var cats = post.categories || [];
        var meta = [];
        if (post.author) meta.push("<span>" + escapeHtml(post.author) + "</span>");
        if (post.date) meta.push("<span>" + escapeHtml(formatPostDate(post.date)) + "</span>");
        if (post.readMinutes) {
          meta.push("<span>" + escapeHtml(String(post.readMinutes)) + " min</span>");
        }

        return (
          '<a class="card" href="/posts/' +
          escapeHtml(post.slug) +
          '.html" data-category="' +
          escapeHtml(cats.join(" ")) +
          '">' +
          '<img class="card__art" src="' +
          escapeHtml(post.art) +
          '" alt="" style="width:56px;height:56px;">' +
          '<div class="pill-row">' +
          categoryPillsHtml(cats) +
          "</div>" +
          '<h2 class="card__title">' +
          escapeHtml(post.title) +
          "</h2>" +
          '<p class="card__excerpt">' +
          escapeHtml(post.excerpt) +
          "</p>" +
          (meta.length
            ? '<p class="card__meta">' + meta.join("<span>&middot;</span>") + "</p>"
            : "") +
          "</a>"
        );
      })
      .join("");
  }

  function renderLatestPosts(posts) {
    var slot = document.querySelector("[data-latest-posts]");
    if (!slot) return;

    var newestFirst = posts.slice().reverse();
    slot.innerHTML = newestFirst
      .map(function (post) {
        var category = (post.categories && post.categories[0]) || "craft";
        var label = CATEGORY_LABELS[category] || category;
        var meta = [];
        if (post.author) meta.push("<span>" + escapeHtml(post.author) + "</span>");
        if (post.date) meta.push("<span>" + escapeHtml(formatPostDate(post.date)) + "</span>");

        return (
          '<a href="/posts/' +
          escapeHtml(post.slug) +
          '.html" style="flex: 0 0 calc((100% - 48px) / 3); min-width: 280px; background: #FFFFFF; border: 1px solid #DEDACF; border-radius: 6px; padding: 24px; display: flex; flex-direction: column; gap: 16px; text-decoration: none; color: inherit;">' +
          '<img src="' +
          escapeHtml(post.art) +
          '" alt="" width="80" height="80" style="width: 56px; height: 56px; border-radius: 3px; background: #EEEAE1;">' +
          '<span class="pill pill--' +
          escapeHtml(category) +
          '" style="align-self: flex-start;">' +
          escapeHtml(label) +
          "</span>" +
          '<h3 style="font-family: \'Space Grotesk\', sans-serif; font-weight: 600; font-size: clamp(1.2rem, 1.1rem + 0.5vw, 1.4rem); color: #30343B; margin: 0;">' +
          escapeHtml(post.title) +
          "</h3>" +
          '<p style="color: #66717E; font-size: 14px; margin: 0;">' +
          escapeHtml(post.excerpt) +
          "</p>" +
          (meta.length
            ? '<p style="font-family: \'JetBrains Mono\', monospace; font-size: 0.72rem; color: #66717E; display: flex; gap: 12px; margin: 0;">' +
              meta.join("<span>&middot;</span>") +
              "</p>"
            : "") +
          "</a>"
        );
      })
      .join("");
  }

  function initPostCatalogUi() {
    var needsNav = document.querySelector("[data-post-nav]");
    var needsRelated = document.querySelector("[data-related-posts]");
    var needsArchive = document.querySelector("[data-archive-grid]");
    var needsLatest = document.querySelector("[data-latest-posts]");
    if (!needsNav && !needsRelated && !needsArchive && !needsLatest) {
      return Promise.resolve();
    }

    var currentSlug = currentPostSlug();

    return loadPostsCatalog()
      .then(function (posts) {
        if (!posts.length) return;
        renderPostNav(posts, currentSlug);
        renderRelatedPosts(posts, currentSlug);
        renderArchiveGrid(posts);
        renderLatestPosts(posts);
      })
      .catch(function (err) {
        console.error(err);
        if (needsNav) {
          needsNav.innerHTML =
            "<!-- post nav failed — serve over HTTP, not file:// -->";
        }
        if (needsRelated) {
          needsRelated.innerHTML =
            "<!-- related posts failed — serve over HTTP, not file:// -->";
        }
        if (needsArchive) {
          needsArchive.innerHTML =
            "<!-- archive failed — serve over HTTP, not file:// -->";
        }
        if (needsLatest) {
          needsLatest.innerHTML =
            "<!-- latest posts failed — serve over HTTP, not file:// -->";
        }
      });
  }

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
        var cats = (card.getAttribute("data-category") || "").split(/\s+/);
        return cats.indexOf(activeFilter) !== -1;
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

  function boot() {
    loadIncludes()
      .then(function () {
        markCurrentNav();
        setYear();
        initNav();
        initReadingProgress();
        initReveal();
        return initPostCatalogUi();
      })
      .then(function () {
        initArchiveFilter();
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
