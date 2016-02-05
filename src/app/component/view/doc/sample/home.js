Slipper.define().view({

  events: {},
  overrides: {},
  includes: {},

  init: function(promise, param){
    promise.resolve(param);
  },


  /*---------------------------------------
   * Basic functions.
   */

  /* View is rendered to put in DOMTree.
   */
  rendered: function(p){
    console.log("[View:sample] rendered");
  },

  /* View was inserted to DOMTree.
   */
  inserted: function(p){
    console.log("[View:sample] inserted");
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
  }


});
