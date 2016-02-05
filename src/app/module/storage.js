define([
  "module/module"
], function( M ){
  'use strict';

  return M.extend({

    // set :: String -> a -> Nothing
    //
    // Set a item to localStorage by specific key.
    //
    set: function (key, value) {
      localStorage.setItem(key,JSON.stringify(value));
    },

    // get :: String -> a
    //
    // Find a item within localStorage by specific key.
    //
    get: function (key) {
      return JSON.parse(localStorage.getItem(key));
    },

    // length :: Integer
    //
    // Return length of items within localStorage.
    //
    length: function() {
      return localStorage.length;
    },

    // remove :: String -> Nothing
    //
    // Remove a item from localStorage by specific key.
    //
    remove: function (key) {
      localStorage.removeItem(key);
    },

    // truncate :: Nothing
    //
    // Clear all items in localStorage
    //
    truncate: function () {
      localStorage.clear();
    }

  });

});
