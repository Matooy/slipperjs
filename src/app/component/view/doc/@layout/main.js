define([
  "core/app",
], function( App ){

  return App.Core.Screen.Layout.extend({

    init: function(promise, param){
      promise.resolve(param);
    },

    rendered: function(){
      this.highlight_code();
    },

    highlight_code: function(){
      // Apply prism
      this.$el.find('pre>code').each(function(){
        var el = $(this).get(0);
        Prism.highlightElement(el);
      });
    }

  });

});
