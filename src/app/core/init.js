/**
 * require config
 *
 */

Slipper = {
  queues: [],
  queue: function(cb){
    this.queues.push(cb);
  }
}


// Some messages before entering to Requirejs main process.
console.log("Starting...");

// Disable first visibility.
document.getElementById('container').style.opacity = .001;


/* Do something before main application run.*/

// Accessing spefic page via scheme.
window.handleOpenURL = function(scheme){
  var reg = new RegExp("^[a-zA-Z0-9_\.]+://");
  window.APP_SCHEME_TRESPASSING = scheme.replace(reg,'');
}


;(function(){
  // Load require.js
  var el = document.createElement('script');
  document.body.appendChild(el);
  el.src ='app/vendor/require/require.min.js';
  el.onload = function(e){

    // If you want to
    // import any other libraries,
    // or load some files at initialization,
    // please use config/include.js file.
    require.config({
      baseUrl: "app",
      waitSecond: 0,
      shim: {

        "jquery": {
          exports: '$'
        },
        "underscore": {
          exports: '_'
        },
        "fm": {
          exports: 'FM'
        }

      },
      paths: {
        "jquery":     "vendor/jquery/jquery-2.1.1.min"
      , "underscore": "vendor/underscore/underscore-min"
      , "textify"  :  "vendor/require/text"
      , "FM":         "vendor/fmjs/fm"
      , "include":    "config/include"
      }
    });


    require([
        "include"

      // jquery
      , "jquery"

      // jashkenas
      , "underscore"

      // Require.js Modules
      , "textify"

      // Function by me
      , "FM"

    ], function(includes){

      // Rewrite base path.
      var el = document.getElementById('application-base-path');
      var base = el.getAttribute('href');


      // Force override base path.
      // if accessed as file.
      if( ! location.href.match(/^http/) ){
        base = location.pathname.split("/").slice(0,-1).join("/") + "/";
        el.setAttribute('href', base);
      }


      require([
        "core/app",
        "core/debugger"
      ].concat(includes), function( app, d ){

        console.log("[init.js] Cordova.js => " + (typeof cordova));

        var init = function(){
          var option = {
            path: {
              root: base
            }
          }

          app.main.call(app, option);
        }


        if(typeof cordova !== 'undefined'){

          var border = FM.st.repeat('=', 40);

          // Error observer.
          window.onerror = function(msg, url, line, col, error){
            console.log(border);
            console.log("| !! JavaScript Execution Error !!");
            console.log("| Error: " + msg);
            console.log("| File : " + ( url.indexOf("/www/app/")  ? url.split("/www/app/").pop() : url));
            console.log("| Line : " + line);
            if(col){
            console.log("| Col  : " + col);
            }
            if(error){
            console.log("| Extra: " + error);
            }
            console.log(border);
          }

          FM.event.bind(document, 'deviceready', function(){
            console.log(border);
            console.log("deviceready fired from document. Maybe this device is mobile.");
            console.log(border);
            init();
          });

          FM.event.bind(window, 'deviceready', function(){
            console.log(border);
            console.log("deviceready fired from window. Maybe this device is web-browser with Ripple.");
            console.log(border);
            init();
          });


        }else{

          // A magick word.
          init();

        }

      });

    }, function(e){
      // Please do something cool.
      console.log(e);
    });

  };

  el.onerror = function(){
    ;(function(){
      // Check requirejs availability.
      (typeof require === 'undefined') && (function(){
        throw new Error("require.js wasn't loaded. Check the <base> tag href attribute.");
      })();
    })();
  }
})();
