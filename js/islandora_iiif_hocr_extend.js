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

		// Get node id
		var nodeId = drupalSettings.path.currentPath.split('/')[1];
		var store = Drupal.IslandoraMirador.instances[base].store;

		var state = store.getState();
		var windows = Object.keys(state.windows).map((key) => [state.windows[key]]);
		var windowId = Object.keys(state.windows)[0];

		// Helper function to wait for a specific React element to appear in the DOM
		function waitForElement(selector) {
		    return new Promise(resolve => {
		        // If it's already there, resolve immediately
		        if (document.querySelector(selector)) {
		            return resolve(document.querySelector(selector));
		        }

		        // Otherwise, watch the DOM for changes
		        const observer = new MutationObserver(mutations => {
		            if (document.querySelector(selector)) {
		                resolve(document.querySelector(selector));
		                observer.disconnect(); // Stop watching once found
		            }
		        });

		        observer.observe(document.body, {
		            childList: true,
		            subtree: true
		        });
		    });
		}

		// Check if there is a search query in URL, if so, display panel and enable search
		const queryString = window.location.search;
		const urlParams = new URLSearchParams(queryString);

		if (urlParams.get('q') !== null) {
		    
		    // Setup a search action 
		    store.dispatch({
		        type: 'mirador/REQUEST_SEARCH',
		        windowId: windowId,
		        companionWindowId: windows[0][0].companionWindowIds[0],
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

		    // Wait for the Search tab to be rendered, then click it
		    waitForElement('button.MuiButtonBase-root[aria-label="Search"]')
		        .then((searchBtn) => {
		            console.trace("Search button is triggered");
		            searchBtn.click();
		            
		            // Now wait for the Submit Search button to render inside the panel
		            return waitForElement('button.MuiButtonBase-root[aria-label="Submit search"]');
		        })
		        .then((submitBtn) => {
		            console.trace("Submit Search is sent");
		            submitBtn.click();
		        })
		        .catch((error) => {
		            console.error("Mirador elements did not load:", error);
		        });
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
	                /*jQuery(".breadcrumb__link").each(function( index ) {
	                    if (!jQuery(this).attr('href').includes("?q=")) {
	                        var querykey = urlParams.get('q')
	                        if (querykey.indexOf('"') >= 0) {
	                            querykey = querykey.replace(/['"]+/g, '');
	                        }
	                        var newlink = jQuery(this).attr('href')  + "?q=" + querykey;
	                        jQuery(this).attr("href", newlink); 
	                    }
	                });*/
		    }
	    }
	}
})(Drupal, once);
