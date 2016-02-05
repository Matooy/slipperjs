define(["module/module"], function( Module ){

  'use strict';

  var _l = function(){
    console.log.apply(console, arguments);
  }

  var Device = Module.extend({

    __language: null,

    __support_required: {
      'MutationObserver': null,
      'CustomEvent'     : null,
      'Blob'            : null,
      'console'         : null
    },

    initialize: function(){},

    info: function(){
      var bd = FM.st.repeat("=", 40);
      _l(bd);
      _l("Device information");
      _l("- - - - - - - - - - - - - - - - -");

      this.support(
        FM.ob.keys(this.__support_required),
        function(v, type){
          _l(FM.st.padr(v, 24) + "| "
            + (type !== 'undefined' ? "Supported" : "Not supported"));
        });

      _l(bd);

      var lang = this.language();
      for(var k in lang){
        _l(FM.st.padr(k, 24) + "| " + lang[k]);
      }
      _l(bd);
    },

    support: function(list, c){
      var t = FM.vr.type(list);
      switch(t){
        case 'object':
          FM.ob.each(list, function(v, k){
            var s = (eval("window." + k));
            var t = (typeof s);
            if(t === 'undefined' && v){
              s = FM.vr.type(v) === 'function'
                ? v(k, s, t)
                : v ;
              eval('window.' + k + ' = s;');
            }
            (FM.vr.type(c) === 'function') && c(k, typeof s);
          });
          break;
        case 'array':
          list.map(function(v, k){
            var s = (eval("window." + v));
            var t = (typeof s);
            (FM.vr.type(c) === 'function') && c(v, typeof s);
          });
          break;
      }
    },


    language: function(){
      return this.__language_pref = this.__language_pref || (function(parsed){
        return {
          language: parsed[0],
          culture:  parsed[1] || undefined
        };
      })(
        // en-US => [en, US]
         ((navigator.languages ? navigator.languages[0] : null)
        || navigator.userLanguage
        || navigator.language
        || navigator.browserLanguage
        || navigator.systemLanguage).split("-")
      );
    },


    /* is_browser :: Nothing -> Boolean
     *
     * Check if accessing via browser.
     * @TODO (This is a too easy validation. Need more reliable method.)
     */
    is_browser: function(){
      var rg = new RegExp(/^http(s)?:\/\//);
      return (rg.test(document.URL));
    },


    /* alert :: String -> String -> String -> IO()
     */
    alert: function(message, title, label){
      var df = new $.Deferred;
      var m = message || "", t = title || "", l = label || "OK";

      if(this.is_browser()){
        alert(message);
        setTimeout(df.resolve)
      }else{
        if(navigator.notification){
          navigator.notification.alert(m, df.resolve, t, l);
        }else{
          df.reject();
        }
      }
      return df;
    },


    /* confirm :: String -> {Closure -> String -> $.Deferred} -> String -> Array -> IO()
     *
     * callback は 第一引数に押されたボタンのIndex数字, 第二引数に $.Deferred を受け取ります。
     *
     *
     * - Sample #1
     * device.confirm("do").then(__success__, __error__);
     *
     *
     * - Sample #2
     * device.confirm("do", function(number, Deferred){
     *   switch(number){
     *     case 1: Deferred.resolve();
     *       break;
     *     case 2: Deferred.reject();
     *       break;
     *     case 3: Deferred.resolve();
     *       break;
     *     default: Deferred.reject();
     *       break;
     *   }
     * }, "title", ["yes", "no", "all"]).then(__success__, __error__);
     *
     */
    confirm: function(message, callback, title, labels){
      var df = new $.Deferred;
      var m = message || "", t = title || "", ls = labels || ['Yes','No'];

      var cl = (typeof callback === 'function') ? callback : (function(pushed, df){
        (pushed == 1) ? df.resolve() : df.reject();
      });

      if(this.is_browser()){
        (confirm(message)) ? cl(true, df) : cl(false, df) ;
      }else{
        if(navigator.notification){
          navigator.notification.confirm(m, function(pushed){
            cl(pushed, df);
          }, t, ls);
        }else{
          df.reject();
        }
      }
      return df;
    }


  });

  // Use like as singleton.
  return new Device;

});
