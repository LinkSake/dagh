# Dagh Salón Site Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Dagh Salón static site (fix bugs, de-duplicate shared chrome, rebuild the color system around `#D03D78`, ship a booking-focused redesign, and pass on perf/SEO/a11y) while staying 100% plain HTML/CSS/jQuery.

**Architecture:** Three phases — (1) Foundation: fix bugs + replace hand-duplicated header/nav/menu/footer with a jQuery `$.get()`-based include system using root-relative (`/...`) paths everywhere; (2) Visual redesign: a CSS-custom-property palette built around `#D03D78`, a sticky WhatsApp CTA bar, hero CTAs, price-teaser service cards; (3) Perf/SEO/A11y hardening.

**Tech Stack:** Plain HTML, CSS (custom properties, no preprocessor build step), jQuery 3.x (already vendored). No bundler, no framework, no backend.

**Spec:** `docs/superpowers/specs/2026-10-05-site-upgrade-design.md`

## Global Constraints

- Stay plain HTML/CSS/jQuery — no build tool, no framework, no new backend (per spec Non-goals).
- Every asset/page reference site-wide uses a root-relative absolute path with a leading `/` (e.g. `/assets/css/theme.css`, `/services.html`) — this is the fix for the existing broken relative-path bug and must be applied consistently, including on pages that aren't currently broken (index.html, services.html, products.html), so the whole site follows one rule.
- `#D03D78` is the **primary brand color**, not a one-off accent — it must replace the existing teal (`#49fcd4` family, in `paradigm.css`) and near-absent pink-tint (`rgba(242,132,158,...)`, in `phantom.css`) as the dominant accent everywhere those appear.
- No fabricated content: the only estimated value anywhere is the one price explicitly approved by the user (Balayage y flamboyage, `services/haircolor.html`), and it carries a `*` + disclaimer footnote.
- Out of scope (do not build): real product detail pages, the commented-out catalog categories in `services.html`/`index.html`, any form/backend/analytics.
- Single git branch (`main`), gitmoji-style commit messages (see `CLAUDE.md`), commit after each task.

---

### Reference: files touched

**New:**
- `partials/header.html`, `partials/menu.html`, `partials/footer.html`, `partials/sticky-whatsapp.html`
- `assets/js/includes.js`
- `assets/css/theme.css`
- `sitemap.xml`, `robots.txt`

**Modified:** `index.html`, `services.html`, `products.html`, `services/{haircut,haircolor,makeup,treatments,hairstyles,browroll,generic}.html`, `products/generic.html`

---

## Task 1: Create the partials, the include loader, and the theme palette skeleton

**Files:**
- Create: `partials/header.html`
- Create: `partials/menu.html`
- Create: `partials/footer.html`
- Create: `partials/sticky-whatsapp.html`
- Create: `assets/js/includes.js`
- Create: `assets/css/theme.css`

**Interfaces:**
- Produces: `[data-include]` convention (any element with that attribute, value = a root-relative path, gets replaced with the fetched HTML). `<body data-back="...">` (back-arrow target, consumed by `includes.js`). `<body data-page-script="...">` (a script to `$.getScript()` only after includes land — needed because `phantom.js` reads `#menu` at parse time). `--color-primary`, `--color-primary-rgb`, `--color-primary-dark`, `--color-primary-mid`, `--color-primary-light` CSS custom properties, consumed by every later styling task.

- [ ] **Step 1: Create `partials/header.html`**

```html
<header id="header">
	<div class="inner">

		<!-- Nav -->
			<nav>
				<ul>
					<li><a href="#" class="back-link fas fa-arrow-left" style="font-size: inherit;"></a></li>
					<li><a href="#menu">Menu</a></li>
				</ul>
			</nav>

	</div>
</header>
```

- [ ] **Step 2: Create `partials/menu.html`**

```html
<nav id="menu">
	<h2>Menu</h2>
	<ul>
		<li><a href="/index.html">Inicio</a></li>
		<li><a href="/products.html">Productos</a></li>
		<li><a href="/services.html">Servicios</a></li>
	</ul>
</nav>
```

- [ ] **Step 3: Create `partials/footer.html`**

```html
<footer id="footer">
	<div class="inner">
		<section>
			<h2>Contacto</h2>
			<ul class="icons">
				<li><a href="https://www.instagram.com/daghsalon/" class="icon brands style2 fa-instagram"><span class="label">Instagram</span></a></li>
				<li><a href="https://www.facebook.com/Dagh-Salon-by-Gisela-Ortiz-1614428148847439" class="icon brands style2 fa-facebook-f"><span class="label">Facebook</span></a></li>
				<li><a href="https://api.whatsapp.com/send?phone=+526142457236" class="icon brands style2 fa-whatsapp"><span class="label">WhatsApp</span></a></li>
				<li><a href="tel:+526142457236" class="icon solid style2 fa-phone"><span class="label">Phone</span></a></li>
				<li><a href="mailto:hola@dagh.salon" class="icon solid style2 fa-envelope"><span class="label">Email</span></a></li>
			</ul>
		</section>
		<ul class="copyright">
			<li>
				&copy; Dagh Salón. Todos los derechos reservados.
			</li>
			<li>
				Diseño: <a href="https://html5up.net/">HTML5 UP</a>.
			</li>
			<li>
				Web: <a href="https://luisangel.me/">Luis Angel Ortega.</a>
			</li>
		</ul>
	</div>
</footer>
```

- [ ] **Step 4: Create `partials/sticky-whatsapp.html`**

```html
<div id="sticky-cta">
	<a href="https://api.whatsapp.com/send?phone=+526142457236" aria-label="Agenda tu cita por WhatsApp">
		<i class="fab fa-whatsapp" aria-hidden="true"></i>
		<span>Agenda por WhatsApp</span>
	</a>
</div>
```

- [ ] **Step 5: Create `assets/js/includes.js`**

```js
/*
	Dagh Salón — plain-jQuery include loader.
	Finds every [data-include] element, fetches the partial at its root-relative
	path, and swaps it in. phantom.js reads #menu at parse time, so it must be
	loaded (via $.getScript, from <body data-page-script="...">) only after every
	include has landed in the DOM.
*/
(function($) {

	function loadIncludes(callback) {

		var $targets = $('[data-include]'),
			requests = [];

		$targets.each(function() {

			var $target = $(this),
				path = $target.attr('data-include');

			requests.push(
				$.get(path).done(function(html) {
					$target.replaceWith(html);
				})
			);

		});

		$.when.apply($, requests).always(callback);

	}

	$(document).ready(function() {

		loadIncludes(function() {

			// Wire up the back-arrow using the page's own data-back attribute.
				var backHref = $('body').attr('data-back');

				if (backHref)
					$('.back-link').attr('href', backHref);

			// Load the page's template script only now that #menu etc. exist.
				var pageScript = $('body').attr('data-page-script');

				if (pageScript)
					$.getScript(pageScript);

			$(document).trigger('includes:loaded');

		});

	});

})(jQuery);
```

- [ ] **Step 6: Create `assets/css/theme.css`**

```css
/*
	Dagh Salón — brand theme (plain CSS, no build step).
	Loaded after paradigm.css / phantom.css / fontawesome-all.min.css on every page.
*/

:root {
	--color-primary:       #D03D78; /* main brand color */
	--color-primary-rgb:   208, 61, 120;
	--color-primary-dark:  #9c2c59; /* hover/active states, dark panels */
	--color-primary-mid:   #e07aa0; /* secondary hover state */
	--color-primary-light: #f6d9e6; /* tints: badges, subtle backgrounds */
}
```

- [ ] **Step 7: Verify the new files exist and are syntactically sane**

Run:
```bash
cd /Users/laoh/orca/dagh
for f in partials/header.html partials/menu.html partials/footer.html partials/sticky-whatsapp.html assets/js/includes.js assets/css/theme.css; do
  test -s "$f" && echo "OK: $f" || echo "MISSING/EMPTY: $f"
done
grep -c "data-include" partials/*.html   # expect 0 (partials don't nest includes)
grep -c "color-primary" assets/css/theme.css  # expect >= 5
```
Expected: all 6 files print `OK:`, no errors.

- [ ] **Step 8: Commit**

```bash
git add partials/ assets/js/includes.js assets/css/theme.css
git commit -m "✨ Added jQuery include system and brand theme skeleton

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: Wire `index.html` into the foundation (sticky CTA, theme.css, root-relative paths)

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `partials/sticky-whatsapp.html` (Task 1), `assets/css/theme.css` (Task 1).

`index.html` keeps its own Paradigm header/footer structure as-is (it isn't duplicated anywhere else, so there's no de-duplication need here) — this task only fixes its root-relative paths, links `theme.css`, and mounts the sticky WhatsApp bar.

- [ ] **Step 1: Fix favicon links to root-relative**

Old:
```html
		<link rel="apple-touch-icon" sizes="180x180" href="public/apple-touch-icon.png">
		<link rel="icon" type="image/png" sizes="32x32" href="public/favicon-32x32.png">
		<link rel="icon" type="image/png" sizes="16x16" href="public/favicon-16x16.png">
		<link rel="manifest" href="public/site.webmanifest">
```
New:
```html
		<link rel="apple-touch-icon" sizes="180x180" href="/public/apple-touch-icon.png">
		<link rel="icon" type="image/png" sizes="32x32" href="/public/favicon-32x32.png">
		<link rel="icon" type="image/png" sizes="16x16" href="/public/favicon-16x16.png">
		<link rel="manifest" href="/public/site.webmanifest">
```

- [ ] **Step 2: Fix stylesheet link + add theme.css, remove the empty duplicate description/keywords tags**

Old:
```html
		<meta name="description" content="" />
		<meta name="keywords" content="" />
		<link rel="stylesheet" href="assets/css/paradigm.css" />
```
New:
```html
		<link rel="stylesheet" href="/assets/css/paradigm.css" />
		<link rel="stylesheet" href="/assets/css/theme.css" />
```

- [ ] **Step 3: Mount the sticky WhatsApp bar**

Old:
```html
		<body class="is-preload">

		<!-- Wrapper -->
			<div id="wrapper">

				<!-- Intro -->
```
New:
```html
		<body class="is-preload">

			<div data-include="/partials/sticky-whatsapp.html"></div>

		<!-- Wrapper -->
			<div id="wrapper">

				<!-- Intro -->
```

- [ ] **Step 4: Fix remaining image/script root-relative paths**

Old:
```html
							<span class="image fill" data-position="center"><img src="images/pic01.jpg" alt="" /></span>
```
New:
```html
							<span class="image fill" data-position="center"><img src="/images/pic01.jpg" alt="Interior de Dagh Salón" /></span>
```

Old:
```html
							<span class="image main"><img src="images/interior.png" alt="" /></span>
```
New:
```html
							<span class="image main"><img src="/images/interior.png" alt="Interior de Dagh Salón" loading="lazy" /></span>
```

Old:
```html
			<script src="assets/js/jquery.min.js"></script>
			<script src="assets/js/jquery.scrolly.min.js"></script>
			<script src="assets/js/browser.min.js"></script>
			<script src="assets/js/breakpoints.min.js"></script>
			<script src="assets/js/paradigm-util.js"></script>
			<script src="assets/js/paradigm.js"></script>
```
New:
```html
			<script src="/assets/js/jquery.min.js"></script>
			<script src="/assets/js/jquery.scrolly.min.js"></script>
			<script src="/assets/js/browser.min.js"></script>
			<script src="/assets/js/breakpoints.min.js"></script>
			<script src="/assets/js/paradigm-util.js"></script>
			<script src="/assets/js/paradigm.js"></script>
			<script src="/assets/js/includes.js"></script>
```

- [ ] **Step 5: Verify**

```bash
grep -n 'href="public\|src="images\|src="assets' index.html   # expect no matches (all now have leading /)
grep -c 'data-include="/partials/sticky-whatsapp.html"' index.html  # expect 1
```

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "🐛 Fixed index.html paths and wired up theme/includes

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Wire `services.html` and `products.html` into the foundation

**Files:**
- Modify: `services.html`
- Modify: `products.html`

**Interfaces:**
- Consumes: `partials/header.html`, `partials/menu.html`, `partials/footer.html`, `partials/sticky-whatsapp.html`, `assets/css/theme.css`, `assets/js/includes.js` (Task 1). `data-back`/`data-page-script` convention (Task 1).

Apply this same transformation to **both** `services.html` and `products.html` (their current markup here is identical except the page title text, which is untouched):

- [ ] **Step 1: Fix favicon + stylesheet links, add theme.css**

Old:
```html
		<link rel="stylesheet" href="assets/css/phantom.css" />
		<noscript><link rel="stylesheet" href="assets/css/noscript.css" /></noscript>

		<!-- Favicons -->
		<link rel="apple-touch-icon" sizes="180x180" href="public/apple-touch-icon.png">
		<link rel="icon" type="image/png" sizes="32x32" href="public/favicon-32x32.png">
		<link rel="icon" type="image/png" sizes="16x16" href="public/favicon-16x16.png">
		<link rel="manifest" href="public/site.webmanifest">
```
New:
```html
		<link rel="stylesheet" href="/assets/css/phantom.css" />
		<link rel="stylesheet" href="/assets/css/theme.css" />
		<noscript><link rel="stylesheet" href="/assets/css/noscript.css" /></noscript>

		<!-- Favicons -->
		<link rel="apple-touch-icon" sizes="180x180" href="/public/apple-touch-icon.png">
		<link rel="icon" type="image/png" sizes="32x32" href="/public/favicon-32x32.png">
		<link rel="icon" type="image/png" sizes="16x16" href="/public/favicon-16x16.png">
		<link rel="manifest" href="/public/site.webmanifest">
```

- [ ] **Step 2: Set `data-back`/`data-page-script` on `<body>`, mount the sticky bar**

In `services.html`, old:
```html
		<body class="is-preload">
			<!-- Wrapper -->
				<div id="wrapper">

					<!-- Header -->
						<header id="header">
							<div class="inner">
								
								<!-- Nav -->
									<nav>
										<ul>
											<li><a href="index.html#catalog" class="fas fa-arrow-left" style="font-size: inherit;"></a></li>
											<li><a href="#menu">Menu</a></li>
										</ul>
									</nav>

							</div>
						</header>

					<!-- Menu -->
						<nav id="menu">
							<h2>Menu</h2>
							<ul>
								<li><a href="index.html">Inicio</a></li>
								<li><a href="products.html">Productos</a></li>
								<li><a href="services.html">Servicios</a></li>
							</ul>
						</nav>

					<!-- Main -->
```
New:
```html
		<body class="is-preload" data-back="/index.html#catalog" data-page-script="/assets/js/phantom.js">

			<div data-include="/partials/sticky-whatsapp.html"></div>

			<!-- Wrapper -->
				<div id="wrapper">

					<div data-include="/partials/header.html"></div>
					<div data-include="/partials/menu.html"></div>

					<!-- Main -->
```

In `products.html`, apply the identical change (same old block — `products.html`'s header/menu markup reads the same as `services.html`'s, confirmed by direct inspection — same `data-back="/index.html#catalog"`).

- [ ] **Step 3: Replace the footer with a mount**

Old (identical in both files):
```html
					<!-- Footer -->
						<footer id="footer">
							<div class="inner">
								<section>
									<h2>Contacto</h2>
									<ul class="icons">
										<li><a href="https://www.instagram.com/daghsalon/" class="icon brands style2 fa-instagram"><span class="label">Instagram</span></a></li>
										<li><a href="https://www.facebook.com/Dagh-Salon-by-Gisela-Ortiz-1614428148847439" class="icon brands style2 fa-facebook-f"><span class="label">Facebook</span></a></li>
										<li><a href="https://api.whatsapp.com/send?phone=+526142457236" class="icon brands style2 fa-whatsapp"><span class="label">WhatsApp</span></a></li>
										<li><a href="tel:+526142457236" class="icon solid style2 fa-phone"><span class="label">Phone</span></a></li>
										<li><a href="mailto:hola@dagh.salon" class="icon solid style2 fa-envelope"><span class="label">Email</span></a></li>
									</ul>
								</section>
								<ul class="copyright">
									<li>
										&copy; Dagh Salón. Todos los derechos reservados.
									</li>
									<li>
										Diseño: <a href="https://html5up.net/">HTML5 UP</a>.
									</li>
									<li>
										Web: <a href="https://luisangel.me/">Luis Angel Ortega.</a>
									</li>
								</ul>
							</div>
						</footer>

				</div>
```
New:
```html
					<div data-include="/partials/footer.html"></div>

				</div>
```

- [ ] **Step 4: Fix scripts — remove the static `phantom.js` tag (now loaded dynamically), add leading slashes, add `includes.js`**

Old (identical in both files):
```html
			<script src="assets/js/jquery.min.js"></script>
			<script src="assets/js/browser.min.js"></script>
			<script src="assets/js/breakpoints.min.js"></script>
			<script src="assets/js/phantom-util.js"></script>
			<script src="assets/js/phantom.js"></script>
```
New:
```html
			<script src="/assets/js/jquery.min.js"></script>
			<script src="/assets/js/browser.min.js"></script>
			<script src="/assets/js/breakpoints.min.js"></script>
			<script src="/assets/js/phantom-util.js"></script>
			<script src="/assets/js/includes.js"></script>
```

- [ ] **Step 5: Fix any remaining root-relative asset paths (tile images get the leading slash too, for consistency — image swap and price teasers themselves happen in Task 9)**

In both files, every `<img src="images/pic05.jpg" alt="" />` → `<img src="/images/pic05.jpg" alt="" />` for now (Task 9 replaces the real tiles' images/alt text; this step just makes the still-placeholder ones consistent in the meantime). Also fix the two commented-out `<a href="index.html#contact">contactarnos.</a>` links in each page's intro paragraph:

Old: `<a href="index.html#contact">contactarnos.</a>`
New: `<a href="/index.html#contact">contactarnos.</a>`

- [ ] **Step 6: Verify**

```bash
for f in services.html products.html; do
  echo "== $f =="
  grep -n 'href="index.html\|href="products.html\|href="services.html\|src="images\|src="assets\|href="public' "$f"
done
# Expected: no output for either file (everything now has a leading /)
grep -c 'data-include' services.html products.html   # expect 3 each (sticky, header, menu) ... footer makes 4
```

- [ ] **Step 7: Commit**

```bash
git add services.html products.html
git commit -m "🐛 Fixed catalog pages and switched to shared partials

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: Wire the 8 sub-pages into the foundation

**Files:**
- Modify: `services/haircut.html`
- Modify: `services/haircolor.html`
- Modify: `services/makeup.html`
- Modify: `services/treatments.html`
- Modify: `services/hairstyles.html`
- Modify: `services/browroll.html`
- Modify: `services/generic.html`
- Modify: `products/generic.html`

**Interfaces:**
- Consumes: same partials/CSS/JS as Task 3.

Every one of these 8 files currently has **byte-identical** head/header/menu/footer/scripts markup (confirmed by direct inspection), differing only in `<h1>`, the one content image, and the price list. Apply this exact transformation to each:

- [ ] **Step 1: Fix favicon + stylesheet links, add theme.css (same old/new as Task 3 Step 1, but the stylesheet line uses `../` today)**

Old:
```html
		<link rel="stylesheet" href="../assets/css/phantom.css" />
		<noscript><link rel="stylesheet" href="../assets/css/noscript.css" /></noscript>

		<!-- Favicons -->
		<link rel="apple-touch-icon" sizes="180x180" href="public/apple-touch-icon.png">
		<link rel="icon" type="image/png" sizes="32x32" href="public/favicon-32x32.png">
		<link rel="icon" type="image/png" sizes="16x16" href="public/favicon-16x16.png">
		<link rel="manifest" href="public/site.webmanifest">
```
New:
```html
		<link rel="stylesheet" href="/assets/css/phantom.css" />
		<link rel="stylesheet" href="/assets/css/theme.css" />
		<noscript><link rel="stylesheet" href="/assets/css/noscript.css" /></noscript>

		<!-- Favicons -->
		<link rel="apple-touch-icon" sizes="180x180" href="/public/apple-touch-icon.png">
		<link rel="icon" type="image/png" sizes="32x32" href="/public/favicon-32x32.png">
		<link rel="icon" type="image/png" sizes="16x16" href="/public/favicon-16x16.png">
		<link rel="manifest" href="/public/site.webmanifest">
```

- [ ] **Step 2: Set `data-back`/`data-page-script`, mount sticky bar + header + menu**

Old (identical across all 8 files):
```html
	<body class="is-preload">
		<!-- Wrapper -->
			<div id="wrapper">

				<!-- Header -->
					<header id="header">
						<div class="inner">

							<!-- Nav -->
								<nav>
									<ul>
										<li><a href="../services.html" class="fas fa-arrow-left" style="font-size: inherit;"></a></li>
										<li><a href="#menu">Menu</a></li>
									</ul>
								</nav>

						</div>
					</header>

				<!-- Menu -->
					<nav id="menu">
						<h2>Menu</h2>
						<ul>
							<li><a href="index.html">Inicio</a></li>
							<li><a href="catalog.html">Productos</a></li>
							<li><a href="catalog.html">Servicios</a></li>
						</ul>
					</nav>

				<!-- Main -->
```
New for the 7 files under `services/` (`haircut.html`, `haircolor.html`, `makeup.html`, `treatments.html`, `hairstyles.html`, `browroll.html`, `generic.html`):
```html
	<body class="is-preload" data-back="/services.html" data-page-script="/assets/js/phantom.js">

		<div data-include="/partials/sticky-whatsapp.html"></div>

		<!-- Wrapper -->
			<div id="wrapper">

				<div data-include="/partials/header.html"></div>
				<div data-include="/partials/menu.html"></div>

				<!-- Main -->
```

For `products/generic.html`, the back-link already correctly points to `../products.html` (this one file didn't have the back-arrow bug) — use `data-back="/products.html"` with the same new block otherwise.

- [ ] **Step 3: Replace the footer with a mount (same old/new as Task 3 Step 3)**

- [ ] **Step 4: Fix scripts (same old/new as Task 3 Step 4, but these files currently use `../assets/js/...`)**

Old:
```html
			<script src="../assets/js/jquery.min.js"></script>
			<script src="../assets/js/browser.min.js"></script>
			<script src="../assets/js/breakpoints.min.js"></script>
			<script src="../assets/js/phantom-util.js"></script>
			<script src="../assets/js/phantom.js"></script>
```
New:
```html
			<script src="/assets/js/jquery.min.js"></script>
			<script src="/assets/js/browser.min.js"></script>
			<script src="/assets/js/breakpoints.min.js"></script>
			<script src="/assets/js/phantom-util.js"></script>
			<script src="/assets/js/includes.js"></script>
```

- [ ] **Step 5: Fix the content image path's leading `../` → `/`**

Each file has one content image, e.g. (`haircut.html`):
Old: `<img src="../images/services/haircut.jpeg" alt="Foto por Adam Winger en Unsplash" />`
New: `<img src="/images/services/haircut.jpeg" alt="Foto por Adam Winger en Unsplash" />`

Apply the same `../images/` → `/images/` fix to each file's own image path (`haircolor.jpeg`, `makeup.jpeg`, `treatment.jpeg`, `hairstyles.jpeg`, `browroll.jpeg`, and `generic.html`'s `pic13.jpg`).

- [ ] **Step 6: Verify**

```bash
for f in services/haircut.html services/haircolor.html services/makeup.html services/treatments.html services/hairstyles.html services/browroll.html services/generic.html products/generic.html; do
  echo "== $f =="
  grep -n 'href="index.html\|href="catalog.html\|src="\.\./\|href="public\|src="\.\./assets' "$f"
done
# Expected: no output for any file
```

- [ ] **Step 7: Commit**

```bash
git add services/ products/generic.html
git commit -m "🐛 Fixed broken sub-page links and switched to shared partials

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: Fix the `$???` placeholder price

**Files:**
- Modify: `services/haircolor.html`
- Modify: `assets/css/theme.css`

- [ ] **Step 1: Replace the placeholder price**

Old:
```html
								<li class="price-item">Balayage y flamboyage - <i>$??? MXN</i> </li>
```
New:
```html
								<li class="price-item">Balayage y flamboyage - <i>A partir de $1,200 MXN*</i> </li>
```

- [ ] **Step 2: Add the disclaimer footnote under the price list**

Old:
```html
									<li class="price-item">Colores fantasía - <i>A partir de $850 MXN</i> </li>
								</ul>
							</p>
```
New:
```html
									<li class="price-item">Colores fantasía - <i>A partir de $850 MXN</i> </li>
								</ul>
								<small class="price-footnote">*Precio promedio estimado. Los precios están sujetos a cambio; confirma el precio exacto al reservar tu cita.</small>
							</p>
```

- [ ] **Step 3: Add the footnote style to `theme.css`**

Append:
```css

.price-footnote {
	display: block;
	margin-top: 1em;
	font-size: 0.75em;
	color: #585858;
}
```

- [ ] **Step 4: Verify**

```bash
grep -n '\$???' services/haircolor.html   # expect no match
grep -n 'price-footnote' services/haircolor.html assets/css/theme.css   # expect a match in both
```

- [ ] **Step 5: Commit**

```bash
git add services/haircolor.html assets/css/theme.css
git commit -m "🐛 Fixed missing balayage price with estimated value and disclaimer

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: Rebuild the color system around `#D03D78`

**Files:**
- Modify: `assets/css/theme.css`

This is the core "build the palette around this color" task. It overrides every selector identified (by grepping `assets/css/paradigm.css` and `assets/css/phantom.css`) that currently hardcodes the old teal (`#49fcd4` family) or near-unused pink tint (`rgba(242,132,158,...)`).

- [ ] **Step 1: Append the Paradigm (index.html) overrides**

```css

/* --- Paradigm (index.html) accent overrides --- */

input[type="submit"]:hover,
input[type="reset"]:hover,
input[type="button"]:hover,
button:hover,
.button:hover {
	box-shadow: inset 0 0 0 2px var(--color-primary);
	color: var(--color-primary) !important;
}

input[type="submit"]:active,
input[type="reset"]:active,
input[type="button"]:active,
button:active,
.button:active {
	background-color: rgba(var(--color-primary-rgb), 0.18);
	box-shadow: inset 0 0 0 2px var(--color-primary);
	color: var(--color-primary) !important;
}

input[type="text"]:focus,
input[type="password"]:focus,
input[type="email"]:focus,
input[type="tel"]:focus,
input[type="search"]:focus,
input[type="url"]:focus,
select:focus,
textarea:focus {
	border-color: var(--color-primary);
}

input[type="submit"].primary,
input[type="reset"].primary,
input[type="button"].primary,
button.primary,
.button.primary {
	background-color: var(--color-primary);
	color: #ffffff !important;
}

	input[type="submit"].primary:hover,
	input[type="reset"].primary:hover,
	input[type="button"].primary:hover,
	button.primary:hover,
	.button.primary:hover {
		background-color: var(--color-primary-mid);
	}

	input[type="submit"].primary:active,
	input[type="reset"].primary:active,
	input[type="button"].primary:active,
	button.primary:active,
	.button.primary:active {
		background-color: var(--color-primary-dark);
	}

input[type="checkbox"]:checked + label:before,
input[type="radio"]:checked + label:before {
	background-color: var(--color-primary);
	border-color: var(--color-primary);
}

#wrapper > section > header h1:before, #wrapper > section > header h2:before,
#wrapper > section > header h1:after, #wrapper > section > header h2:after {
	background: var(--color-primary);
}
```

- [ ] **Step 2: Append the Phantom (sub-pages) overrides**

```css

/* --- Phantom (catalog/service pages) accent overrides --- */

.button:hover,
input[type="submit"]:hover,
input[type="reset"]:hover,
input[type="button"]:hover,
button:hover {
	color: var(--color-primary) !important;
	box-shadow: inset 0 0 0 2px var(--color-primary);
}

.button:active,
input[type="submit"]:active,
input[type="reset"]:active,
input[type="button"]:active,
button:active {
	background-color: rgba(var(--color-primary-rgb), 0.12);
}

.button.primary,
input[type="submit"].primary,
input[type="reset"].primary,
input[type="button"].primary,
button.primary {
	background-color: var(--color-primary);
}

	.button.primary:hover,
	.button.primary:active,
	input[type="submit"].primary:hover,
	input[type="submit"].primary:active {
		background-color: var(--color-primary-dark);
	}

.icon.style2:hover {
	color: var(--color-primary);
	border-color: var(--color-primary);
}

.icon.style2:active {
	background-color: rgba(var(--color-primary-rgb), 0.15);
}

#menu {
	background: var(--color-primary-dark);
}
```

- [ ] **Step 3: Verify**

```bash
grep -c "var(--color-primary" assets/css/theme.css   # expect a large number (20+)
```

- [ ] **Step 4: Manual check** — serve the site (`python3 -m http.server 8000`) and confirm in a browser that the "Servicios" button on the homepage, the slide-out menu panel, and the WhatsApp/social icon hover states on a service page all show the new pink/rose (`#D03D78` family), not the old teal/black.

- [ ] **Step 5: Commit**

```bash
git add assets/css/theme.css
git commit -m "💄 Rebuilt the color palette around #D03D78

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: Style the sticky WhatsApp bar

**Files:**
- Modify: `assets/css/theme.css`

**Interfaces:**
- Consumes: `#sticky-cta` markup from `partials/sticky-whatsapp.html` (Task 1).

- [ ] **Step 1: Append the sticky bar styles**

```css

/* --- Sticky WhatsApp bar --- */

body {
	padding-top: 2.8em;
}

#sticky-cta {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	z-index: 10003;
	background-color: var(--color-primary);
	text-align: center;
	padding: 0.5em 1em;
	padding-top: calc(0.5em + env(safe-area-inset-top, 0px));
}

	#sticky-cta a {
		color: #ffffff;
		text-decoration: none;
		font-size: 0.85em;
		font-weight: 600;
		letter-spacing: 0.05em;
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
	}

	#sticky-cta a:hover {
		text-decoration: underline;
	}
```

- [ ] **Step 2: Manual check** — serve the site and confirm the bar sits at the very top on both `index.html` and a sub-page (e.g. `services/haircut.html`), doesn't overlap the existing header, and the WhatsApp link opens correctly. Adjust `body { padding-top }` if the bar wraps to two lines on narrow screens and gets clipped.

- [ ] **Step 3: Commit**

```bash
git add assets/css/theme.css
git commit -m "✨ Added sticky WhatsApp booking bar styling

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: Hero CTAs on `index.html`

**Files:**
- Modify: `index.html`
- Modify: `assets/css/theme.css`

- [ ] **Step 1: Add the CTA buttons above the existing scroll arrow**

Old:
```html
							<ul class="actions">
								<li><a href="#catalog" class="arrow scrolly"><span class="label">Next</span></a></li>
							</ul>
```
New:
```html
							<ul class="actions hero-ctas">
								<li><a href="https://api.whatsapp.com/send?phone=+526142457236" class="button primary">Agenda tu cita</a></li>
								<li><a href="/services.html" class="button">Ver servicios</a></li>
							</ul>
							<ul class="actions">
								<li><a href="#catalog" class="arrow scrolly"><span class="label">Next</span></a></li>
							</ul>
```

- [ ] **Step 2: Add the layout rule**

Append to `assets/css/theme.css`:
```css

/* --- Hero CTAs (index.html) --- */

.hero-ctas {
	display: flex;
	flex-wrap: wrap;
	gap: 1em;
	justify-content: center;
	margin-bottom: 1.5em;
}
```

- [ ] **Step 3: Verify**

```bash
grep -n "hero-ctas" index.html assets/css/theme.css   # expect a match in both
```

- [ ] **Step 4: Manual check** — confirm both buttons render centered under the hero title and the WhatsApp button opens a chat.

- [ ] **Step 5: Commit**

```bash
git add index.html assets/css/theme.css
git commit -m "✨ Added hero booking CTAs to homepage

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 9: Price-teaser service cards + real photos

**Files:**
- Modify: `index.html`
- Modify: `services.html`
- Modify: `assets/css/theme.css`

Lowest advertised price per service (read directly off each service's own price list — no new data invented): Cortes de Cabello $150, Tinte y color $450, Maquillajes $150, Tratamientos capilares $350, Peinados $180, Laminado de ceja $150.

- [ ] **Step 1: Rework the `index.html` services teaser into linked, priced cards**

Old:
```html
							<p> En Dagh Salón ofrecemos una una variedad de los servicios para cualquier ocasión, así como servicios para tus eventos. </p>
							<ul class="feature-icons">
								<li class="icon solid fa-cut">Cortes de cabello</li>
								<li class="icon solid fa-palette">Maquillajes</li>
								<li class="icon solid fa-crown">Extenciónes</li>
								<li class="icon solid fa-heart">Bodas</li>
								<li class="icon solid fa-birthday-cake">XVs años</li>
								<li class="icon solid fa-icons">Cambio de imagen</li>
							</ul>
```
New:
```html
							<p> En Dagh Salón ofrecemos una una variedad de los servicios para cualquier ocasión, así como servicios para tus eventos. </p>
							<ul class="service-teasers">
								<li><a href="/services/haircut.html"><i class="icon solid fa-cut"></i> Cortes de cabello <span class="price-teaser">Desde $150 MXN</span></a></li>
								<li><a href="/services/haircolor.html"><i class="icon solid fa-palette"></i> Tinte y color <span class="price-teaser">Desde $450 MXN</span></a></li>
								<li><a href="/services/makeup.html"><i class="icon solid fa-magic"></i> Maquillajes <span class="price-teaser">Desde $150 MXN</span></a></li>
								<li><a href="/services/treatments.html"><i class="icon solid fa-spa"></i> Tratamientos <span class="price-teaser">Desde $350 MXN</span></a></li>
								<li><a href="/services/hairstyles.html"><i class="icon solid fa-heart"></i> Peinados <span class="price-teaser">Desde $180 MXN</span></a></li>
								<li><a href="/services/browroll.html"><i class="icon solid fa-eye"></i> Laminado de ceja <span class="price-teaser">Desde $150 MXN</span></a></li>
							</ul>
```

(`index.html`'s "Extenciónes/Bodas/XVs años/Cambio de imagen" entries are dropped from this specific teaser list — they aren't real, linkable services yet, per the spec's non-goals; they weren't links before either, just plain text.)

- [ ] **Step 2: Add price teasers + real photos to the 6 built tiles in `services.html`**

For each of the 6 built `<article>` tiles (haircut, haircolor, makeup, treatments, browroll, hairstyles), apply this pattern — shown for haircut:

Old:
```html
								<article class="style4">
									<span class="image">
										<img src="/images/pic05.jpg" alt="" />
									</span>
									<a href="services/haircut.html">
										<h2>Cortes de Cabello</h2>
										<div class="content">
											<p>Cortes de cabello para toda la familia, en un solo lugar.</p>
										</div>
									</a>
								</article>
```
New:
```html
								<article class="style4">
									<span class="image">
										<img src="/images/services/haircut.jpeg" alt="Corte de cabello en Dagh Salón" loading="lazy" />
									</span>
									<a href="services/haircut.html">
										<h2>Cortes de Cabello</h2>
										<div class="content">
											<p>Cortes de cabello para toda la familia, en un solo lugar.</p>
											<p class="price-teaser">Desde $150 MXN</p>
										</div>
									</a>
								</article>
```

Apply the same pattern to the other 5, using the matching real photo and price:
- Tinte y color (`style4`) → `/images/services/haircolor.jpeg`, "Tinte y color en Dagh Salón", Desde $450 MXN
- Maquillajes (`style5`) → `/images/services/makeup.jpeg`, "Maquillaje en Dagh Salón", Desde $150 MXN
- Tratamientos capilares (`style6`) → `/images/services/treatment.jpeg`, "Tratamiento capilar en Dagh Salón", Desde $350 MXN
- Laminado de ceja (`style9`) → `/images/services/browroll.jpeg`, "Laminado de ceja en Dagh Salón", Desde $150 MXN
- Peinados (`style11`) → `/images/services/hairstyles.jpeg`, "Peinado en Dagh Salón", Desde $180 MXN

(The remaining commented-out tiles and the `pic05.jpg` placeholder inside them stay untouched — out of scope, per the spec's non-goals.)

- [ ] **Step 3: Add the supporting styles**

Append to `assets/css/theme.css`:
```css

/* --- Service price teasers --- */

ul.service-teasers {
	list-style: none;
	margin: 0 0 1.5em 0;
	padding: 0;
	display: flex;
	flex-wrap: wrap;
	gap: 0.75em;
}

	ul.service-teasers li a {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.6em 1em;
		border: solid 1px var(--color-primary-light);
		border-radius: 2em;
		color: inherit;
		text-decoration: none;
		transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;
	}

	ul.service-teasers li a:hover {
		background-color: var(--color-primary-light);
		border-color: var(--color-primary);
	}

	ul.service-teasers li a .icon:before {
		color: var(--color-primary);
	}

.price-teaser {
	font-size: 0.8em;
	font-weight: 600;
	color: var(--color-primary-dark);
	background-color: var(--color-primary-light);
	border-radius: 1em;
	padding: 0.15em 0.75em;
}

p.price-teaser {
	display: inline-block;
	margin: 0.5em 0 0 0;
}
```

- [ ] **Step 4: Verify**

```bash
grep -c "price-teaser" index.html services.html assets/css/theme.css   # expect matches in all three
grep -n "pic05.jpg" services.html | grep -v "Bodas\|XV Años\|Cambio de imagen\|Extensiones\|Lifting\|Micropigmentación\|Otros"
# ^ the 6 real tiles should NOT appear in this output anymore (only commented-out placeholder tiles should)
```

- [ ] **Step 5: Commit**

```bash
git add index.html services.html assets/css/theme.css
git commit -m "✨ Added price teasers and real photos to service listings

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 10: Promote the contact section + typography polish

**Files:**
- Modify: `assets/css/theme.css`

No business hours are published anywhere on the current site, so none are invented here — this is a visual promotion of the existing contact info (address, phone, email, social, WhatsApp, map), not new content.

- [ ] **Step 1: Append contact-section + typography styles**

```css

/* --- Contact section emphasis --- */

#wrapper > section > footer,
footer#footer section {
	border-top: 2px solid var(--color-primary-light);
	padding-top: 1.5em;
}

/* --- Typography polish --- */

h1, h2, h3 {
	font-weight: 700;
}

p.desc,
#main .inner > p {
	max-width: 42em;
}
```

- [ ] **Step 2: Manual check** — confirm the contact section on `index.html` and the footer "Contacto" section on a sub-page look visually distinct (a top border in the brand tint) without breaking layout.

- [ ] **Step 3: Commit**

```bash
git add assets/css/theme.css
git commit -m "💄 Promoted contact section and polished typography

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 11: Unique per-page SEO metadata

**Files:**
- Modify: `index.html`, `services.html`, `products.html`
- Modify: `services/{haircut,haircolor,makeup,treatments,hairstyles,browroll}.html`

(`services/generic.html` and `products/generic.html` are unused Lorem-ipsum placeholders, not real content — skipped here on purpose, per the spec's non-goals; they already got their structural/path fixes in Task 4.)

Every page currently shares the exact same `<title>`, `description`, `og:*`, and `twitter:*` text, and every `og:url`/`twitter:url` is hardcoded to `https://dagh.salon/` even on sub-pages. Apply this pattern (shown for `services/haircut.html`) to each listed file, using its own title/description/URL:

- [ ] **Step 1: `services/haircut.html`**

Old:
```html
		<title>Dagh Salón - By Gisela Ortíz</title>
...
		<meta name="description" content="Servicios profesionales y de vanguardia de belleza, para aquellas personas que buscan alta calidad y un trato humano, así como los mejores productos de la ciudad.">
...
		<meta property="og:url" content="https://dagh.salon/">
		<meta property="og:title" content="Dagh Salón - By Gisela Ortíz">
		<meta property="og:description" content="Servicios profesionales y de vanguardia de belleza, para aquellas personas que buscan alta calidad y un trato humano, así como los mejores productos de la ciudad.">
...
		<meta property="twitter:url" content="https://dagh.salon/">
		<meta property="twitter:title" content="Dagh Salón - By Gisela Ortíz">
		<meta property="twitter:description" content="Servicios profesionales y de vanguardia de belleza, para aquellas personas que buscan alta calidad y un trato humano, así como los mejores productos de la ciudad.">
```
New:
```html
		<title>Cortes de Cabello | Dagh Salón</title>
...
		<meta name="description" content="Cortes de cabello profesionales para toda la familia en Dagh Salón: dama, caballero, niñas y niños, desde $150 MXN.">
...
		<meta property="og:url" content="https://dagh.salon/services/haircut.html">
		<meta property="og:title" content="Cortes de Cabello | Dagh Salón">
		<meta property="og:description" content="Cortes de cabello profesionales para toda la familia en Dagh Salón: dama, caballero, niñas y niños, desde $150 MXN.">
...
		<meta property="twitter:url" content="https://dagh.salon/services/haircut.html">
		<meta property="twitter:title" content="Cortes de Cabello | Dagh Salón">
		<meta property="twitter:description" content="Cortes de cabello profesionales para toda la familia en Dagh Salón: dama, caballero, niñas y niños, desde $150 MXN.">
```

- [ ] **Step 2: Apply the same pattern to the remaining files**, using:
  - `services/haircolor.html` → title "Tinte y Color | Dagh Salón"; description "Tinte, balayage, baby lights y colores fantasía en Dagh Salón, desde $450 MXN."; url `.../services/haircolor.html`
  - `services/makeup.html` → title "Maquillaje | Dagh Salón"; description "Maquillaje profesional para toda ocasión en Dagh Salón: ojos, día, social y pestañas, desde $150 MXN."; url `.../services/makeup.html`
  - `services/treatments.html` → title "Tratamientos Capilares | Dagh Salón"; description "Tratamientos capilares en Dagh Salón: keratina alemana, caviar nutrición, encerado hidratante y más, desde $350 MXN."; url `.../services/treatments.html`
  - `services/hairstyles.html` → title "Peinados | Dagh Salón"; description "Peinados para toda ocasión en Dagh Salón: alaciado express, ondas, semirecogidos y recogidos, desde $180 MXN."; url `.../services/hairstyles.html`
  - `services/browroll.html` → title "Laminado de Ceja | Dagh Salón"; description "Laminado y diseño de ceja en Dagh Salón, desde $150 MXN."; url `.../services/browroll.html`
  - `services.html` → title "Servicios | Dagh Salón"; description "Catálogo de servicios de belleza en Dagh Salón: cortes de cabello, tinte y color, maquillaje, tratamientos capilares, peinados y laminado de ceja."; url `.../services.html`
  - `products.html` → title "Productos | Dagh Salón"; description "Catálogo de productos de belleza en Dagh Salón: shampoo, acondicionador, tratamientos, cera, gel y maquillaje."; url `.../products.html`
  - `index.html` → keep its existing title ("Dagh Salón - By Gisela Ortíz", already distinct as the brand homepage) and existing description/OG/Twitter text unchanged; just confirm `og:url`/`twitter:url` already read `https://dagh.salon/` (they do — no change needed here).

- [ ] **Step 3: Verify every page has exactly one `<h1>`**

```bash
for f in index.html services.html products.html services/haircut.html services/haircolor.html services/makeup.html services/treatments.html services/hairstyles.html services/browroll.html; do
  n=$(grep -co "<h1" "$f")
  echo "$f: $n"
done
# Expected: every line prints exactly "1"
```

- [ ] **Step 4: Verify titles are unique**

```bash
grep -h "<title>" index.html services.html products.html services/*.html | sort | uniq -c | sort -rn
# Expected: no count greater than 1 (services/generic.html keeps the shared placeholder title, which is fine — it's unlinked)
```

- [ ] **Step 5: Commit**

```bash
git add index.html services.html products.html services/haircut.html services/haircolor.html services/makeup.html services/treatments.html services/hairstyles.html services/browroll.html
git commit -m "✏️ Added unique per-page titles, descriptions and OG tags

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 12: `sitemap.xml` + `robots.txt`

**Files:**
- Create: `sitemap.xml`
- Create: `robots.txt`

- [ ] **Step 1: Create `sitemap.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url><loc>https://dagh.salon/</loc></url>
	<url><loc>https://dagh.salon/services.html</loc></url>
	<url><loc>https://dagh.salon/products.html</loc></url>
	<url><loc>https://dagh.salon/services/haircut.html</loc></url>
	<url><loc>https://dagh.salon/services/haircolor.html</loc></url>
	<url><loc>https://dagh.salon/services/makeup.html</loc></url>
	<url><loc>https://dagh.salon/services/treatments.html</loc></url>
	<url><loc>https://dagh.salon/services/hairstyles.html</loc></url>
	<url><loc>https://dagh.salon/services/browroll.html</loc></url>
</urlset>
```

- [ ] **Step 2: Create `robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://dagh.salon/sitemap.xml
```

- [ ] **Step 3: Verify**

```bash
python3 -c "import xml.dom.minidom as m; m.parse('sitemap.xml')" && echo "sitemap.xml is well-formed XML"
test -s robots.txt && echo "robots.txt present"
```

- [ ] **Step 4: Commit**

```bash
git add sitemap.xml robots.txt
git commit -m "🍱 Added sitemap.xml and robots.txt

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 13: Accessibility + remaining performance fixes

**Files:**
- Modify: `products.html`
- Modify: `assets/css/theme.css`

- [ ] **Step 1: Fix empty `alt` text and add lazy-loading on `products.html`'s 6 tiles**

For each of the 6 `<article>` tiles, apply this pattern (shown for Shampoo):

Old:
```html
								<article class="style1">
									<span class="image">
										<img src="/images/pic05.jpg" alt="" />
									</span>
									<a href="products/generic.html">
										<h2>Shampoo</h2>
```
New:
```html
								<article class="style1">
									<span class="image">
										<img src="/images/pic05.jpg" alt="Shampoo en Dagh Salón" loading="lazy" />
									</span>
									<a href="products/generic.html">
										<h2>Shampoo</h2>
```

Apply the same `alt="<Nombre del producto> en Dagh Salón"` + `loading="lazy"` fix to the other 5 tiles (Acondicionador, Tratamientos, Cera, Gel, Maquillajes), matching each tile's own `<h2>` text.

- [ ] **Step 2: Add focus-visible styles**

Append to `assets/css/theme.css`:
```css

/* --- Accessibility: visible focus states --- */

a:focus-visible,
button:focus-visible,
.button:focus-visible,
input:focus-visible {
	outline: 2px solid var(--color-primary-dark);
	outline-offset: 2px;
}
```

- [ ] **Step 3: Verify**

```bash
grep -c 'alt=""' products.html   # expect 0
grep -c 'loading="lazy"' products.html   # expect 6
grep -c "focus-visible" assets/css/theme.css   # expect >= 1
```

- [ ] **Step 4: Commit**

```bash
git add products.html assets/css/theme.css
git commit -m "♿ Fixed missing alt text and added focus-visible states

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 14: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Serve the site locally**

```bash
cd /Users/laoh/orca/dagh && python3 -m http.server 8000
```

- [ ] **Step 2: Click through every page** in a browser at `http://localhost:8000/`: `index.html`, `services.html`, `products.html`, all 6 real service detail pages, and `services/generic.html`/`products/generic.html`. For each, confirm:
  - Header/nav/menu/footer render correctly (no missing chrome, no console 404s for partials or assets).
  - The sticky WhatsApp bar is visible at the top and the slide-out hamburger menu still opens/closes/navigates correctly.
  - The back-arrow on every sub-page goes to the right catalog page.
  - New brand color (`#D03D78` family) appears on buttons, menu panel, icon hovers — no leftover teal/pure-black accents.
  - Price teasers and real photos show correctly on the homepage and `services.html`.

- [ ] **Step 3: Check the no-JS fallback** — disable JavaScript in the browser (or use dev tools' "disable JavaScript") and reload a sub-page. The page will currently show no header/menu/footer (since those only render via `includes.js`) — confirm this gap and, if the user wants it closed, note it as a known follow-up (extending `noscript.css` with static fallback chrome is a reasonable next step but is not required for this plan's approved scope).

- [ ] **Step 4: Responsive check** — resize to mobile width (~375px) and tablet width (~768px) on `index.html` and `services/haircut.html`; confirm the sticky bar, hero CTAs, and price-teaser cards don't overflow or overlap.

- [ ] **Step 5: HTML validation spot-check**

```bash
curl -s https://validator.w3.org/nu/?out=json --data-binary @index.html -H "Content-Type: text/html; charset=utf-8" | head -50
curl -s https://validator.w3.org/nu/?out=json --data-binary @services/haircut.html -H "Content-Type: text/html; charset=utf-8" | head -50
```
(If offline/no network, skip and note it — this is a nice-to-have check, not a blocker.)

- [ ] **Step 6: Contrast spot-check** — verify `--color-primary` (`#D03D78`) white text has sufficient contrast (it does: ~4.9:1, passes WCAG AA for normal text) and that `--color-primary-light` (`#f6d9e6`) is only ever used as a background with dark text (`--color-primary-dark`) on top, never the reverse.

- [ ] **Step 7: Final commit** (only if any fixes were made during verification)

```bash
git add -A
git commit -m "🐛 Fixed issues found during final verification pass

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

If no fixes were needed, skip this step — the upgrade is complete.
