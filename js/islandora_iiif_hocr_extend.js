/*jslint browser: true, esversion: 6 */
/*global Mirador, Drupal, once*/
/**
 * @file
 * Displays Mirador viewer.
 */
(function (Drupal, once) {
	'use strict';
	
	jQuery(document).ready(function(){
		updatePageContented();
		if (!(Drupal.IslandoraMirador && Drupal.IslandoraMirador.instances)) {
	            return;
	        }
		var base = Object.keys(Drupal.IslandoraMirador.instances)[0];

		// get node id
		var nodeId = drupalSettings.path.currentPath.split('/')[1];
		var store = Drupal.IslandoraMirador.instances[base].store;
		
		var state = store.getState();
		var windows = Object.keys(state.windows).map((key) => [state.windows[key]]);
		var windowId = Object.keys(state.windows)[0];

		// check if there is search query in URL, if so, display panel and enable search
	        const queryString = window.location.search;
	        const urlParams = new URLSearchParams(queryString);
	        if (urlParams.get('q') !== null) {
			
			// Setup a search action 
			store.dispatch({
				type: 'mirador/REQUEST_SEARCH',
				windowId: windowId,
				companionWindowId:windows[0][0].companionWindowIds[0],
				query: urlParams.get('q'),
				searchId: window.location.origin + "/node/" + nodeId + "/book-manifest",
				searchService: {
					id: location.protocol + '//' + location.host + "/paged-content-search/1?q=" + urlParams.get('q'),
					type: 'SearchService',
					profile: 'http://iiif.io/api/search/0/search',
				},
			});
			
			// Trigger an action to open the sidebar panel
			var action = Mirador.actions.updateWindow(windowId, {
				sideBarOpen: true,
				sideBarPanel: "search"
			});

			// Dispatch the action
			store.dispatch(action);

			// Trigger a click action to open 
			setTimeout(function() {
				// swtich to search panel
				jQuery('button.MuiButtonBase-root[aria-label="Search"]').click();
			}, 200);

			// trigger the search action
			setTimeout(function() {
				jQuery('button.MuiButtonBase-root[aria-label="Submit search"]').click();
			}, 400);
		}
    });

    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            updatePageContented();
        });
    });
    // Observe the entire body for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    /**
    * Update page content with query key to pass to mirador
	*/
    function updatePageContented() { 
	    const queryString = window.location.search;
	    if (queryString !== null) {
		    const urlParams = new URLSearchParams(queryString);
		    if (urlParams.get('a[0][v]') !== null && (urlParams.get('a[0][v]').length > 0)) {
		        jQuery(".object-link, .breadcrumb__link, .field-content a").each(function( index ) {
		  	        if (!jQuery(this).attr('href').includes("?q=")) {
		  		        var querykey = urlParams.get('a[0][v]')
		  		        if (querykey.indexOf('"') >= 0) {
					        querykey = querykey.replace(/['"]+/g, '');
					    }
		  		        var newlink = jQuery(this).attr('href')  + "?q=" + querykey;
			  	        jQuery(this).attr("href", newlink);	
		  	        }
			    });
		    }
		    else if (urlParams.get('q') !== null && (urlParams.get('q').length > 0)) {
	                jQuery(".breadcrumb__link").each(function( index ) {
	                    if (!jQuery(this).attr('href').includes("?q=")) {
	                        var querykey = urlParams.get('q')
	                        if (querykey.indexOf('"') >= 0) {
	                            querykey = querykey.replace(/['"]+/g, '');
	                        }
	                        var newlink = jQuery(this).attr('href')  + "?q=" + querykey;
	                        jQuery(this).attr("href", newlink); 
	                    }
	                });
		    }
	    }
	}
})(Drupal, once);
