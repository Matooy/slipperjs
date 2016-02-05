define([
  "core/app"
], function( App ){

  return App.Core.Screen.Layout.extend({
    init: function(promise, param){
      promise.resolve({
        error: param
      });
    }
  });

});
