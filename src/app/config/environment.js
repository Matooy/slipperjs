define([], function(){


  //--------------------------------------------------
  // Environment
  //--------------------------------------------------
  //
  // init() will be called at index.js.
  //
  // global: Override all configurations via config/global.js
  //

  var ENVIRONMENT = "development";

  return (FM.ob.merge({


    // You can define init() method to write some bootstraps.


    // PRODUCTION
    'production': {
      init: function(m){

        // window.console = null;

        return m;
      },

      debug: false

    },


    // DEVELOPMENT
    'development': {
      init: function(m){

        // Disable JS file cacheing.
        require.config({
          urlArgs: "nocache=" + (new Date()).getTime()
        });

        return m;
      },

      debug: true
    }


  }, { environment: ENVIRONMENT }))[ENVIRONMENT];

});
