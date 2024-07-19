//This calls the jquery library for sliding left side menu for desktop only

(function($) {
   
})(jQuery);


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
			
			store.dispatch({
				type: 'mirador/REQUEST_SEARCH',
				windowId: windowId,
				companionWindowId:windows[0][0].companionWindowIds[0],
				query: urlParams.get('q'),
				searchId: nodeId + "/book-manifest",
				searchService: {
					id: location.protocol + '//' + location.host + "/paged-content-search/1?q=" + urlParams.get('q'),
					type: 'SearchService',
					profile: 'http://iiif.io/api/search/0/search',
				},
			});

			store.dispatch({
				type: 'mirador/UPDATE_WINDOW',
				id: windowId,
				payload: {
					sideBarOpen: true,
					sideBarPanel: 'search'
				},
			});

			setTimeout(function() {
				jQuery('button.MuiButtonBase-root[aria-label="Submit search"]').click();
			}, 100);
		}
    });

    jQuery('body').on('DOMSubtreeModified', function(){
        // add the query to pass to mirador
        updatePageContented();
    });

    /**
    * Update page content with query key to pass to mirador
	*/
    function updatePageContented() { 
	    const queryString = window.location.search;
	    if (queryString !== null) {
		    const urlParams = new URLSearchParams(queryString);
		    if (urlParams.get('a[0][v]') !== null && (urlParams.get('a[0][v]').length > 0)) {
		        jQuery(".object-link, .field-content a").each(function( index ) {
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
	    }
	}

	
  
  })(Drupal, once);