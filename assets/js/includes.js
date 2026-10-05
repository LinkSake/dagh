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
