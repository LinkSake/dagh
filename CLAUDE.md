# Dagh Salón website

Static marketing site for **Dagh Salón** (by Gisela Ortíz), a hair & beauty salon in Chihuahua, Mexico (est. 2012). Live at https://dagh.salon/. All site copy is in Spanish — keep it that way when editing content.

## Tech stack

- Pure static HTML/CSS/jQuery. No framework, no package manager, no build tool, no backend, no database, no tests, no CI, no linter.
- Two hand-stitched HTML5 UP templates:
  - **"Paradigm Shift"** (`assets/css/paradigm.css`, `assets/js/paradigm*.js`) — used only by `index.html`.
  - **"Phantom"** (`assets/css/phantom.css`, `assets/js/phantom*.js`) — used by every other page.
- `assets/css/theme.css` — brand color-token/override stylesheet (CSS custom properties built around `#D03D78`), loaded after `paradigm.css`/`phantom.css`/`fontawesome-all.min.css` on every page. This is the place to look for/add brand-color and cross-template override rules.
- **Trap:** `assets/sass/**/*.scss` contains Sass sources, but there is no build pipeline (no gulpfile, no package.json) to compile them. The committed `.css` files in `assets/css/` are the real source of truth — editing a `.scss` file alone does nothing. Either hand-edit the compiled CSS directly, or compile the Sass yourself with an external tool before committing both.

## Running locally

No dev server or npm scripts exist. Just serve the static files, e.g.:

```sh
python3 -m http.server 8000   # then open http://localhost:8000/
# or
npx serve .
```

A local HTTP server is now **required** — opening `index.html` (or any page) directly via `file://` no longer works at all. Both the root-relative (`/...`) asset/page paths and the `$.get()` partial fetches in `assets/js/includes.js` fail under `file://`.

## Directory / page map

- `index.html` — homepage (Paradigm template): hero, "Nuestra historia", services teaser, catalog CTA, contact section (Maps iframe, social links, WhatsApp).
- `services.html`, `products.html` — catalog grid pages (Phantom template) linking to detail pages.
- `services/{haircut,haircolor,makeup,treatments,hairstyles,browroll}.html` — one detail page per service. `services/generic.html` is the untouched HTML5-UP placeholder, kept intentionally as a copy-paste starting point for new service pages.
- `products/generic.html` — same placeholder pattern; **no real product detail pages exist yet**, even though `products.html` links out as if they do.
- `assets/css`, `assets/js`, `assets/sass`, `assets/webfonts` — vendor template assets.
- `images/pic01-15.jpg` + `images/gallery/` — legacy HTML5-UP stock photos (unfinished placeholders, not real salon photos). `images/services/*.jpeg` — real salon photos, one per service.
- `public/` — favicons + `site.webmanifest`.

## Critical convention: shared chrome is loaded at runtime via includes, every path is root-relative

There **is** now an includes/partials system, hand-rolled in plain jQuery (no templating engine, no build step):

- Every `services/*.html` page, `products/generic.html`, and `services.html`/`products.html` mounts shared chrome (header, nav/slide-out menu, footer, sticky WhatsApp bar, etc.) via `<div data-include="/partials/header.html"></div>`-style placeholder elements.
- `assets/js/includes.js` finds every `[data-include]` element on `$(document).ready`, fetches each partial's root-relative path with plain jQuery `$.get()`, and swaps it in with `.replaceWith()`.
- `<body data-back="...">` controls the back-arrow link target, and `<body data-page-script="...">` names the page's Phantom template script (`phantom.js` etc.); `includes.js` defers loading that script via `$.getScript()` until *after* all partials have landed in the DOM (because `phantom.js` reads `#menu` at parse time).
- `index.html` is the one exception: it keeps its own unique Paradigm-template markup inline and only mounts the shared `partials/sticky-whatsapp.html` — it does not use the header/nav/footer partials.

**Hard site-wide rule:** every asset and page reference (CSS/JS `src`/`href`, `<a>` links, image paths, partial paths) now uses a **root-relative absolute path** (leading `/`), not a relative path — this applies everywhere, not just on sub-pages. This is what makes the shared partials work identically regardless of how deep the including page is nested (e.g. `services/haircut.html` vs `services.html`).

**Implication:** a sitewide chrome change (nav links, footer credit, sticky bar) now only needs editing in the relevant `partials/*.html` file. A sitewide *content* change that isn't chrome (phone number, WhatsApp link appearing in page body copy) may still need hand-editing across files — grep across `.html` files rather than assuming one file controls it.

Current contact details, for consistency when editing:
- Phone: `tel:+526142457236`
- WhatsApp: `https://api.whatsapp.com/send?phone=+526142457236`

## Price list markup pattern

Used identically across every `services/*.html` detail page — follow this exact structure for new services/prices:

```html
<div class="desc">
  <ul>
    <li class="price-item">Label - <i>$XXX MXN</i></li>
    ...
  </ul>
</div>
```

(This wraps in `<div class="desc">`, not `<p class="desc">` — the old markup wrapped a `<p>` around a nested `<ul>`, which is invalid HTML; this was fixed during the 2026-10 upgrade.)

## Commit message convention

This repo uses gitmoji-style commit prefixes consistently. Follow this convention for new commits:

| Emoji | Meaning |
|---|---|
| 🎉 | Initial commit |
| ✨ | New feature |
| 🚧 | New page / work in progress |
| 🐛 | Bug fix |
| 💄 | Style / UI tweak |
| 🔥 | Removal |
| ✏️ | Copy / content edit |
| 🍱 | Asset addition |
| 🙈 | gitignore change |
| 🚀 | Release |
| ♿ | Accessibility fix |

Single author, single branch (`main`), no PR workflow, no `.github` folder — don't propose a branching/PR process unless asked.

## Known issues

These are already-known, pre-existing issues. Do not report them as new discoveries; only fix them if explicitly asked.

- Several catalog categories are scaffolded but disabled via HTML comments: in `services.html` (Bodas, XV años, Cambio de imagen, Extensiones, Lifting de pestañas, Micropigmentación, Otros) and in `index.html` (Productos CTA button). These are planned-but-unshipped — you may be asked to finish them later.
- `products/` only has the `generic.html` placeholder; no real product detail pages exist despite `products.html` linking as if they do.
- The `<noscript>` fallback was **not** extended to show static chrome when JavaScript is disabled — since header/nav/footer/contact info are now all loaded at runtime via `includes.js`, a no-JS visitor currently sees none of that. This was a deliberate scope decision during the 2026-10 upgrade (not an oversight) — a future task could add a static `<noscript>` fallback.
- The real photos in `images/services/*.jpeg` are large (several MB, 5000+px wide) and have not been compressed/resized. A one-time manual optimization pass (resize + re-compress) is recommended before this is considered fully done.

Whenever a new real (non-placeholder) page is added, remember to add a corresponding `<url>` entry to `sitemap.xml`.

## Footer / attribution

Every page footer credits "Web: Luis Angel Ortega" (https://luisangel.me/) and "Diseño: HTML5 UP". Preserve this when touching footers.
