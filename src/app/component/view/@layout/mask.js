/* This is a main screen masking.
 *
 */
define([
  "module/module",
  "textify!component/template/@layout/mask.html"
], function( M, T ){

  return {

    template: T,

    includes: {
      navigation: '@common/navigation'
    },

    rendered: function(){
      this.partial.navigation.render();
      this.partial.navigation.dispose(this, 'prepend');
    },


    show: function(){
      var df = new $.Deferred;
      var el = this.yield();
      el.css({'opacity': 0}).animate({
        'opacity': 1
      }, {
        complete: function(){
          el.css({
            right: '',
            left: '',
            opacity: 1
          });
          df.resolve();
        }
      });
      return df;
    },


    hide: function(){
      var df = new $.Deferred;
      var el = this.yield();
      el.animate({
        'opacity': 0
      }, {
        complete: function(){
          df.resolve();
        }
      });
      return df;
    }


  };

});
