/*jslint browser: true, esversion: 6 */
/*global Mirador, Drupal, once*/
/**
 * @file
 * Displays Mirador viewer.
 */
(function (Drupal, once) {
  'use strict';

  /**
		 * Initialize the Mirador Viewer.
		 */
  Drupal.behaviors.Mirador = {
    attach: function (context, settings) {
      Drupal.IslandoraMirador = Drupal.IslandoraMirador || {}
      Drupal.IslandoraMirador.instances = Drupal.IslandoraMirador.instances || {}
      
      Object.entries(settings.mirador.viewers).forEach(entry => {
        const [base, values] = entry;
        
        // check if there is search query in URL, if so, display panel and enable search
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);

        if (urlParams.get('q') !== null) {
          values.window.sideBarOpenByDefault = true;
          values.window.sideBarPanel = 'search';
          setTimeout(function() {
            console.log("trigger search....");
            // get node id
            var nodeId = drupalSettings.path.currentPath.split('/')[1];
            var store = Drupal.IslandoraMirador.instances[base].store;
            
            var state = store.getState();
            var windows = Object.keys(state.windows).map((key) => [state.windows[key]]);
            store.dispatch({
              type: 'mirador/REQUEST_SEARCH',
              windowId: windows[0][0].id,
              companionWindowId:windows[0][0].companionWindowIds[0],
              query: urlParams.get('q'),
              searchId: nodeId + "/book-manifest",
              searchService: {
                id: location.protocol + '//' + location.host + "/paged-content-search/1?q=" + urlParams.get('q'),
                type: 'SearchService',
                profile: 'http://iiif.io/api/search/0/search',
              },
            });
            jQuery('button.MuiButtonBase-root[aria-label="Submit search"]').click();
          }, 100);
        }
  
        once('mirador-viewer', base, context).forEach(() =>
          // save the mirador instance so other modules can interact
          // with the store/actions at e.g. Drupal.IslandoraMirador.instances["#mirador-xyz"].store
          Drupal.IslandoraMirador.instances[base] = Mirador.viewer(values, window.miradorPlugins || {})
        );
      });
    },
    detach: function (context, settings) {
      Object.entries(settings.mirador.viewers).forEach(entry => {
      const [base, ] = entry;
      const removed = once.remove('mirador-viewer', base, context);
      if (removed.length > 0) {
        delete Drupal.IslandoraMirador.instances[base];
      }
      });
    }
  };

})(Drupal, once);