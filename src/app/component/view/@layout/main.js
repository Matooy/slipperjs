/*
 * Contents base view.
 *
 * This constructor will be set to..
 *
 * App.Core.Screen.Layout
 *
 */
define([
  "core/app"
], function( App ){

  return App.Core.View.extend({

    overrides: {
      template: null
    , auth: true
    , cacheable: true
    },

    el: '<div id="main">'

  });

});
