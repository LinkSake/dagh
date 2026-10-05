# Dagh Salón site upgrade — design spec

**Date:** 2026-10-05
**Status:** Approved by user, ready for implementation planning.

## Context

`CLAUDE.md` (added earlier this session) documents the current state: a static HTML/CSS/jQuery brochure site built on hand-stitched HTML5 UP templates ("Paradigm Shift" for `index.html`, "Phantom" for every other page), with no templating/includes (every page hand-copies its header/nav/menu/footer), no build pipeline (Sass sources exist but nothing compiles them — the committed CSS is the real source of truth), no tests/CI, and a handful of known bugs. The user asked for as thorough an upgrade as feasible while staying strictly plain HTML/CSS/jQuery (no framework, no build step), with `#D03D78` as the new **primary brand color** (not merely an accent).

## Goals

1. Fix existing bugs.
2. Eliminate the "hand-edit every file" maintenance cost for shared chrome (header/nav/menu/footer).
3. Rebuild the color system around `#D03D78` as the primary brand color.
4. Redesign toward a booking-focused layout (sticky WhatsApp CTA, direct-action hero, price-teaser service cards, promoted contact/hours).
5. Pass on performance, SEO, and accessibility across the whole site.

All while remaining plain HTML/CSS/jQuery — no bundler, no framework, no new backend.

## Non-goals (explicitly out of scope)

- Building real product detail pages or any of the disabled catalog categories (Bodas, XV años, Cambio de imagen, Extensiones, Lifting de pestañas, Micropigmentación, Otros) — these stay as they are (disabled/placeholder) until the user supplies real content.
- Any build tooling/bundler/compiler — Sass remains uncompiled and unused, exactly as today.
- Any backend, CMS, database, or booking form — WhatsApp remains the only booking channel.
- Analytics/tracking.

## Phasing

Foundation → Visual redesign → Perf/SEO/A11y hardening. Each phase is built on a clean version of the previous one, to avoid redoing redesign work after a structural refactor.

### Phase 1 — Foundation

**1a. Bug fixes**
- `services/haircolor.html`: replace the literal `$??? MXN` placeholder. Researched an average market price for "Balayage y flamboyage" (national averages run ~$800–$4,500 MXN depending on city/length, roughly $2,450 MXN on average in major cities — see search below); anchored instead to this page's own existing price scale (Tinte from $450, Efecto de color from $700, Baby lights from $1,500, Colores fantasía from $850) since this salon's pricing runs well under big-city averages. Final value: **"A partir de $1,200 MXN\*"** with a footnote asterisk.
  - Add a small disclaimer footnote under the price list on this page (and anywhere else a price is averaged/estimated rather than salon-confirmed): *"\*Precio promedio estimado. Los precios están sujetos a cambio; confirma el precio exacto al reservar tu cita."*
- The other known bugs (broken relative favicon/menu links on every `services/*.html` + `products/generic.html` page) are fixed as a side effect of 1b below, using **root-relative absolute paths** (`/public/...`, `/index.html`, `/services.html`, `/products.html`) instead of the current broken `../`-relative ones — this is more robust than relative paths since it works identically regardless of page depth, and removes the bug class entirely rather than just patching today's instances.

**1b. jQuery include system**
- New `partials/` directory at repo root: `partials/header-home.html` (Paradigm-style, for `index.html` only), `partials/header-page.html` (Phantom-style, for every other page), `partials/menu.html` (shared slide-out nav), `partials/footer.html` (shared footer/contact icons/copyright).
- Each page keeps its own `<head>` (title/meta/OG/Twitter tags stay per-page, required for SEO) but replaces hand-copied header/nav/menu/footer markup with mount points, e.g.:
  ```html
  <div data-include="partials/header-page.html"></div>
  ...
  <div data-include="partials/menu.html"></div>
  ...
  <div data-include="partials/footer.html"></div>
  ```
- New `assets/js/includes.js` (plain jQuery, no build step): on `$(document).ready`, finds every `[data-include]`, resolves the partial path as **root-relative** (so it works the same from `/` and from `/services/...`), `$.get()`s it, injects it via `.html()`, then re-fires the existing menu-toggle/scroll init code from `phantom.js`/`paradigm.js` once all includes have landed (use `$.when(...)` across the include requests).
- Extend the existing `<noscript>` fallback: since includes won't render without JS, the `noscript.css` path needs a static, non-interactive header/footer fallback so a no-JS visitor still sees working navigation and contact info, not a blank chrome.
- **Trade-off accepted:** header/nav/footer will visibly assemble a beat after JS loads. Acceptable since this is non-critical chrome, not primary content, and the site has no SEO dependency on that markup being present in initial HTML (per-page `<head>` meta/content already covers SEO).

### Phase 2 — Visual redesign (booking-focused, Option C)

**Color system** — new `assets/css/theme.css`, loaded after `paradigm.css`/`phantom.css`/`fontawesome-all.min.css` on every page:
```css
:root {
  --color-primary:       #D03D78; /* main brand color */
  --color-primary-dark:  #9c2c59; /* hover/active states, headers */
  --color-primary-light: #f6d9e6; /* tints: badges, subtle backgrounds, price tags */
  --color-primary-mid:   #e07aa0; /* secondary buttons, borders */
}
```
`theme.css` then overrides every vendor selector that currently hardcodes the old HTML5-UP accent color — links/hover, nav active state, buttons, `h2`/section underlines/accents, icon hover states, form focus rings — to use these variables, making `#D03D78` the dominant brand color (not a one-off highlight). Implementation note: find the current accent hex value(s) in `assets/css/paradigm.css` and `assets/css/phantom.css` (likely defined via the HTML5-UP Sass `$palette` convention) to identify every selector needing an override.

**Layout changes:**
- Sticky top bar (all breakpoints) with a one-tap "Agenda por WhatsApp" link/button, `--color-primary` background, using the existing WhatsApp URL (`https://api.whatsapp.com/send?phone=+526142457236`) — no new backend.
- `index.html` hero: two direct-action buttons — "Agenda tu cita" (WhatsApp link) and "Ver servicios" (links to `services.html`) — styled with the new palette.
- Service tiles on `index.html`'s teaser and on `services.html`'s grid: add a starting-price teaser per service (e.g. "Corte — desde $120 MXN"), sourced from the lowest "A partir de"/flat price already listed on that service's own detail page (no new pricing data invented beyond the one averaged value from Phase 1).
- Contact section (hours, map, social, WhatsApp/phone) visually promoted — larger, positioned prominently, consistent site-wide via the Phase 1 partials.
- Replace the leftover HTML5-UP stock tile image (`images/pic05.jpg`, currently reused for every service tile regardless of actual service) with the real per-service photos already present at `images/services/*.jpeg` (haircut, haircolor, hairstyles, makeup, treatments, browroll). No real photos exist yet for products or any disabled category, so those remain out of scope (non-goal above).
- Typography polish within the existing Source Sans Pro / Raleway pairing: slightly bolder/larger headings, tighter body line-length. No font changes.

### Phase 3 — Performance, SEO, Accessibility

- **Images:** add `loading="lazy"` to below-the-fold `<img>` tags; flag any oversized real photos (`images/services/*.jpeg`) for manual compression (no image pipeline exists — this stays a manual, one-time pass).
- **SEO:** give every page its own distinct `<title>`/`description`/OG/Twitter tags (several service pages currently share one generic description verbatim); add `sitemap.xml` and `robots.txt` (neither exists); ensure exactly one `<h1>` per page.
- **Accessibility:** meaningful `alt` text on every image (some currently empty); keyboard reachability + `aria-label`s for the slide-out menu and new sticky WhatsApp bar; verify WCAG AA contrast for new palette text/background pairs (especially `--color-primary-light`); ensure visible focus states, not just `:hover`.
- **Responsiveness:** manual check of the new sticky bar / hero CTAs / price-teaser cards at mobile, tablet, desktop widths using the existing `breakpoints.min.js` breakpoints.

## Verification

- Serve locally (`python3 -m http.server`) and click through every page — home, both catalogs, all 7 service detail pages, the product placeholder — confirming the include system renders correct header/nav/footer at every page depth, the sticky WhatsApp bar and price teasers render, and the `<noscript>` fallback still shows usable nav/contact info.
- Visual check of old vs. new homepage/service page at mobile and desktop widths.
- HTML validation (e.g. W3C validator) on a couple of representative pages post-include-refactor, since that's the highest-risk mechanical change.
- Spot-check color contrast on new palette text/background combinations.

---

### Average-price research note (for the one estimated price)

Search: "precio promedio balayage flamboyage salon Mexico 2026 MXN" — national/big-city sources (AgendaPro, cuantocuesta.com.mx, Fresha) put balayage around $800–$4,500 MXN depending on city/hair length, averaging roughly $2,450 MXN in major cities. This salon's own price list runs well below big-city averages (Tinte from $450, Baby lights from $1,500), so $1,200 MXN was chosen as a conservative "a partir de" figure consistent with the salon's existing scale rather than the national average — flagged with `*` and a disclaimer per the user's instruction, and should be confirmed/adjusted by the salon owner when possible.

Sources:
- [Cuánto Cuesta Un Balayage](https://cuantocuesta.com.mx/cuanto-cuesta-un-balayage/)
- [Balayage cerca de mi en Ciudad de México (2026) - AgendaPro México](https://agendapro.com/mp/mx/balayage-ciudad-de-mexico)
