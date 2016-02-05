Slipper.define([
  // Load additional layout.
  'component/view/doc/@layout/main'
]).view(function(app, layout){

  return layout.extend({

    events: {
      'click span': 'tell_clicked'
    },

    init: function(promise, state){
      promise.resolve(state);
    },


    tell_clicked: function(e){
      console.log($(e.target).prop('tagName') + ' clicked!!');
    },




    /*---------------------------------------
     * Basic functions.
     */

    /* View is rendered to put in DOMTree.
     */
    rendered: function(p){
      FM.fn.proxy(this.__super__.rendered, this)(p);
    },

    /* View was inserted to DOMTree.
     */
    inserted: function(p){
    },

    /* action() will be called always when #hash or ?query only changed.
     */
    action: function(e){
      console.log("[View:sample] action called");
    },

    /* When view goes to background, previous view will be 'destroy'ed by App.Core.Screen
     */
    destroy: function(e){
      console.log("[View:sample] destroy");
    },




    /*---------------------------------------
     * Actions
     */

    // This will be called when filled below conditions.
    //
    // - #hash is '#say'.
    // - QueryString is changed.
    //
    'do_say': function(p){
      this.$el.find('#action-previewer').text((p.extra || "Nothing special"));
    },
    // This will be called when #hash changed to '#say-again'
    'do_say_again': function(p){
      p.extra = 'again';
      this.do_say(p);
    },
    'do_say|2': function(p){
      p.extra = 2;
      this.do_say(p);
    }

  })

});
