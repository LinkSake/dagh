# Dagh Salón website

Static marketing site for **Dagh Salón** (by Gisela Ortíz), a hair & beauty salon in Chihuahua, Mexico (est. 2012). Live at https://dagh.salon/. All site copy is in Spanish — keep it that way when editing content.

## Tech stack

- Pure static HTML/CSS/jQuery. No framework, no package manager, no build tool, no backend, no database, no tests, no CI, no linter.
- Two hand-stitched HTML5 UP templates:
  - **"Paradigm Shift"** (`assets/css/paradigm.css`, `assets/js/paradigm*.js`) — used only by `index.html`.
  - **"Phantom"** (`assets/css/phantom.css`, `assets/js/phantom*.js`) — used by every other page.
- **Trap:** `assets/sass/**/*.scss` contains Sass sources, but there is no build pipeline (no gulpfile, no package.json) to compile them. The committed `.css` files in `assets/css/` are the real source of truth — editing a `.scss` file alone does nothing. Either hand-edit the compiled CSS directly, or compile the Sass yourself with an external tool before committing both.

## Running locally

No dev server or npm scripts exist. Just serve the static files, e.g.:

```sh
python3 -m http.server 8000   # then open http://localhost:8000/
# or
npx serve .
```

Opening `index.html` directly in a browser also mostly works but can break the Maps iframe/relative paths — prefer a local server.

## Directory / page map

- `index.html` — homepage (Paradigm template): hero, "Nuestra historia", services teaser, catalog CTA, contact section (Maps iframe, social links, WhatsApp).
- `services.html`, `products.html` — catalog grid pages (Phantom template) linking to detail pages.
- `services/{haircut,haircolor,makeup,treatments,hairstyles,browroll}.html` — one detail page per service. `services/generic.html` is the untouched HTML5-UP placeholder, kept intentionally as a copy-paste starting point for new service pages.
- `products/generic.html` — same placeholder pattern; **no real product detail pages exist yet**, even though `products.html` links out as if they do.
- `assets/css`, `assets/js`, `assets/sass`, `assets/webfonts` — vendor template assets.
- `images/pic01-15.jpg` + `images/gallery/` — legacy HTML5-UP stock photos (unfinished placeholders, not real salon photos). `images/services/*.jpeg` — real salon photos, one per service.
- `public/` — favicons + `site.webmanifest`.

## Critical convention: no templating, hand-copy everything

There is no includes/partials system. Every page is a **full standalone copy** of the head/nav/slide-out-menu/footer boilerplate.

**Implication:** any sitewide change (phone number, WhatsApp link, nav links, footer credit) must be hand-edited across **every single HTML file**. For example, commit `40b355d` ("🐛 Fixed WA link") had to touch 11 files to change one URL. When asked for a "global" change, grep across all `.html` files rather than assuming one file controls it.

Current contact details, for consistency when editing:
- Phone: `tel:+526142457236`
- WhatsApp: `https://api.whatsapp.com/send?phone=+526142457236`

## Price list markup pattern

Used identically across every `services/*.html` detail page — follow this exact structure for new services/prices:

```html
<p class="desc">
  <ul>
    <li class="price-item">Label - <i>$XXX MXN</i></li>
    ...
  </ul>
</p>
```

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

Single author, single branch (`main`), no PR workflow, no `.github` folder — don't propose a branching/PR process unless asked.

## Known issues

These are already-known, pre-existing issues. Do not report them as new discoveries; only fix them if explicitly asked.

- Every `services/*.html` and `products/generic.html` page has broken relative paths (copy-pasted from `generic.html`): favicon links use `public/favicon-32x32.png` instead of `../public/favicon-32x32.png`, and the slide-out nav menu links to `index.html`/`catalog.html` instead of `../index.html`/`../services.html`/`../products.html`.
- `services/haircolor.html` has a literal unset placeholder price: `$??? MXN` for "Balayage y flamboyage".
- Several catalog categories are scaffolded but disabled via HTML comments: in `services.html` (Bodas, XV años, Cambio de imagen, Extensiones, Lifting de pestañas, Micropigmentación, Otros) and in `index.html` (Productos CTA button). These are planned-but-unshipped — you may be asked to finish them later.
- `products/` only has the `generic.html` placeholder; no real product detail pages exist despite `products.html` linking as if they do.
- `services.html` tile images mostly reuse `images/pic05.jpg` as a generic placeholder regardless of the actual service shown.

## Footer / attribution

Every page footer credits "Web: Luis Angel Ortega" (https://luisangel.me/) and "Diseño: HTML5 UP". Preserve this when touching footers.
