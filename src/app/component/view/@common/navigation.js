/* This is a view partial sample.
 */
Slipper.define().view(function( App ){

  return App.Core.View.extend({

    el: '<div id="navigation">',

    init: function(promise, param){

      // Listen Router events and always update self template.
      App.Core.Router.on("change", FM.fn.proxy(this.update, this));

      promise.resolve();
    },

  });

});
