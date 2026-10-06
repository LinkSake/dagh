/*
	Dagh Salón — plain-jQuery include loader.
	Finds every [data-include] element, fetches the partial at its own
	page-relative path (set per page, since this site may be hosted at a
	subpath — e.g. GitHub Pages project sites — so root-absolute paths
	aren't safe to assume), and swaps it in. A shared partial that itself
	links to other top-level pages (currently just menu.html) can't hardcode
	one relative prefix that works from every including page's depth, so it
	uses a {{root}} placeholder instead; this resolves it using the
	including page's own <body data-root="..."> value before injecting.
	phantom.js reads #menu at parse time, so it must be loaded (via
	$.getScript, from <body data-page-script="...">) only after every
	include has landed in the DOM.
*/
(function($) {

	function loadIncludes(callback) {

		var $targets = $('[data-include]'),
			root = $('body').attr('data-root') || '',
			requests = [];

		$targets.each(function() {

			var $target = $(this),
				path = $target.attr('data-include');

			requests.push(
				$.get(path).done(function(html) {
					$target.replaceWith(html.split('{{root}}').join(root));
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

				if (pageScript) {
					$.getScript(pageScript).always(function() {

						// phantom.js's own $window.on('load', ...) handler that
						// normally removes is-preload may never fire here, since
						// window `load` can occur before this dynamically-loaded
						// script finishes (especially with loading="lazy" images
						// that don't block `load`). Remove the class directly as a
						// safety net, mirroring phantom.js's own delay.
						window.setTimeout(function() {
							$('body').removeClass('is-preload');
						}, 100);

					});
				}

			$(document).trigger('includes:loaded');

		});

	});

})(jQuery);
