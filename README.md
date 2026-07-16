# The Haunted Bicycle

The engineering journal of the **Skill Weaver** project: architecture decisions, debugging stories, adaptive assessment research, and deployment lessons, told through three recurring characters — Monster (the developer), Spider (the algorithm), and Bicycle (the software system).

Live-ish placeholder domain used throughout this repo: `hauntedbicycle.dev`. Swap it for your real domain in `CNAME` and in the `canonical` / `og:url` tags on every page before launch.

## Stack

Plain HTML, CSS, and vanilla JS. No framework, no build step, no bundler — per the project goal of zero backend maintenance and a fast static site. Fonts load from Google Fonts (Space Grotesk, Source Serif 4, JetBrains Mono); everything else is self-contained.

Because there's no build step, this site also has **no templating engine**. Shared markup (header, footer) is duplicated across every HTML file rather than included at build time. See "Adding a page" below for the workflow this implies.

## Repository structure

```
/
├── assets/
│   ├── css/          variables.css, base.css, layout.css, components.css, post.css
│   ├── js/            main.js (nav toggle, reading progress, scroll reveal)
│   ├── images/         drop raster images here (og-default.png, etc.)
│   └── svg/            character illustrations, logo mark, thread divider
├── components/         canonical source for header.html / footer.html —
│                        copy-paste reference, not a live include (see below)
├── layouts/
│   └── post-template.html   copy this to start a new post
├── posts/               one HTML file per article
├── contributors/         (reserved for individual contributor bio pages, if added later)
├── index.html
├── archive.html
├── about.html
├── contributors.html
├── 404.html
├── sitemap.xml
├── robots.txt
├── rss.xml
├── CNAME
└── .nojekyll
```

## Adding a page

There's no include mechanism, so:

1. Copy the closest existing page (a post → copy `layouts/post-template.html`; a top-level page → copy the nearest sibling, e.g. `about.html`).
2. Update `<title>`, `<meta name="description">`, `canonical`, `og:*`, and `twitter:*` tags.
3. Set `aria-current="page"` on the matching nav link, and remove it from wherever it was before.
4. Paste in the current header/footer from `components/header.html` and `components/footer.html` if either has changed since you last copied a page.
5. If it's a post: add it to `archive.html`, the homepage's "Latest posts" grid, `sitemap.xml`, and `rss.xml`; set correct prev/next links on the posts adjacent to it.

## Adding a post

1. `cp layouts/post-template.html posts/your-slug.html`
2. Work through the numbered HTML comments in the template — they cover title, meta tags, category pill, hero image, table of contents, body, prev/next nav, and related posts.
3. Category must be one of: **Architecture, Debugging, Adaptive Assessment, Deployment, Craft** — these map to the `.pill--*` classes in `components.css` and the filters on `archive.html`.
4. Add the post to `archive.html`, the homepage grid, `sitemap.xml`, and `rss.xml`.
5. Open a PR using the template in `.github/PULL_REQUEST_TEMPLATE.md`. One review required before merging (see Contributor workflow below).

## Design system

Palette, type, spacing, and breakpoints are all defined as CSS custom properties in `assets/css/variables.css` — start there before hand-writing any new color or font-size.

- **Color**: Orange `#F28C28`, Teal `#248F8D`, Charcoal `#30343B`, Slate `#66717E`, Paper `#F7F5F1`.
- **Type**: Space Grotesk for headings, Source Serif 4 for body copy, JetBrains Mono for code and metadata.
- **Breakpoints**: 480 / 768 / 1024 / 1440px, mobile-first.
- **Signature element**: the "thread divider" (`assets/svg/thread-divider.svg`) — a dashed spider-silk line used between homepage/about sections. It's the one recurring visual motif; don't reach for it as generic decoration, only as an actual section break.

## Accessibility

Semantic HTML5 landmarks, a skip link on every page, visible focus states (`:focus-visible` in `base.css`), keyboard-operable nav toggle, `prefers-reduced-motion` respected in both CSS and `main.js`, alt text on every illustration, and WCAG AA contrast targets from the palette above. Run an accessibility check (axe, Lighthouse, or `design:accessibility-review` if you're working with Claude) before merging anything that touches markup.

## Deployment

`. github/workflows/deploy.yml` deploys `main` to GitHub Pages automatically via `actions/deploy-pages`. To enable it:

1. In repo Settings → Pages, set the source to **GitHub Actions**.
2. Update `CNAME` with your real domain (or delete the file to use the default `*.github.io` URL).
3. Push to `main` — the workflow handles the rest. No build step means no cache to worry about invalidating.

## Contributor workflow

- **Manju** — pedagogy, adaptive assessment, AI
- **Jesus** — DevOps, Linux, Docker, deployment
- **Bricen** — frontend, debugging, implementation

Feature branches, pull requests, one review required before merging, conventional commit messages (`feat:`, `fix:`, `docs:`, `post:`). Issue templates for bug reports and new post proposals live in `.github/ISSUE_TEMPLATE/`.

## Performance

No frameworks unless justified by a specific need. SVG over raster wherever possible. Lazy-load any raster images you add (`loading="lazy"`). Minify CSS/JS before a production deploy if file size becomes a concern — at this scale it currently isn't. Target: Lighthouse >95 across the board.

## Roadmap

From the original spec, roughly in priority order:

- [ ] Static client-side search (index posts at build/commit time, search in-browser)
- [ ] Tag pages, in addition to the existing category pills
- [ ] Syntax highlighting themes for code blocks (currently unstyled beyond the base `pre`/`code` treatment)
- [ ] Series pages for multi-part posts
- [ ] Conference talk transcripts and a podcast section
- [ ] Interactive diagrams (candidates for hand-rolled SVG + a little JS, no charting library)
- [ ] Wire the newsletter placeholder to an actual provider

## License

Add a license of your choosing before making this repository public, if it isn't already covered by an org-wide default.
