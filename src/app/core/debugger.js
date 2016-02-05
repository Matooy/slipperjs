define([
  "module/module",
  "core/device",
  "core/router",
  "core/request",
  "core/config"
], function(M, Device, Router, Request, Config){

  var Debugger = M.extend({

    log: function(n, t, o){

      if(!Config.config('debug')) return;

      var d = true;
      var l = 1;

      if(d){
        var stack = (new Error).stack.split("\n");

        if(stack[0] === 'Error'){
          stack.shift();
        }

        var trace = stack[l];

        if(trace){
          trace = trace.replace(/http(s)?:\/\//, "");
            var e = trace.split(":");
            var s = {
            'file': e[0].split("/").pop(),
            'line': e.slice(-2).shift().replace(/[^0-9]/, ""),
            'column': e.slice(-1).shift().replace(/[^0-9]/, "")
          }

          d = "@"+s.file+":"+s.line+":"+s.column;
        }
      }

      var target = FM.ar.clone(arguments).slice(2);

      var str = "";
      var aft = [];
      target.map(function(v){
        if(FM.vr.valid(v, 'object') && !FM.vr.valid(v, 'array')){
          aft.push(v);
        }else if(FM.vr.valid(v, 'array')){
          str += " "+"[" + v.join(", ") +"]";
        }else{
          str += " "+(v && v.__proto__.hasOwnProperty('toString') ? v.toString() : v);
        }
      });

      var style = (function(name){

        var c = 'padding: .3em .2em .2em;';
        switch(name){
          case 'info':
            return c+ 'color: cornflowerblue';
          case 'error':
            return c+ 'background: red; color: white;';
          default:
            return c+ 'color: #555;';
        }

      })(n);

      console.log(
        "%c[" + n.slice(0,1).toUpperCase()+n.slice(1) + "]["+t.slice(0,1).toUpperCase()+t.slice(1)+"] "
        +str+" "+d, style);

      if(aft){
        aft.map(function(v){
          console.log(v);
        });
      }
    },


    observe_error: function(AppIns){
      this.target = AppIns;
      window.onerror = $.proxy(this.__window_error_handler, this);
    },


    show_js_error: function(msg, url, line, col, error){
      console.log("=================================================");
      console.log("| !! JavaScript Execution Error !!");
      console.log("| Error: " + msg);
      console.log("| File : " + url);
      console.log("| Line : " + line);
      (col) && console.log("| Col  : " + col);
      (error) && console.log("| Extra: " + error);
      console.log("=================================================");
    },


    send_report: function(type, message, origin){
      var reporter = function(v){

        console.log("[DEBUG] Sending error report.");

        return Request.send({
          url: '__report/error',
          cache: false,
          headers: {
            'cache-control': 'no-cache'
          },
          data: {
            version: v,
            device: (Device) ? (function(){
              return "Model=" + Device.model
                   + "/OS="+ Device.platform
                   + "/Version="+ Device.version ;
            })() : "undefined",
            type: type,
            date: new Date,
            error: message,
            origin: origin
          },
          success: function(){
            console.log("[DEBUG] Error report sent.");
          }
        });
      }
      if( Device.is_online() ){
        if( typeof cordova.getAppVersion !== 'undefined' ){
          cordova.getAppVersion().always(reporter);
        }else{
          reporter(0);
        }
      }
    },


    /* __window_error_handler :: String -> String -> String -> String -> String
     */
    __window_error_handler: function(m, f, l, c, ex){
      var f = f.indexOf("/www/app/") ? f.split("/www/app/").pop() : f
        , o = { message:m, file:f, line:l, column:c, extra:ex }
        ;

      // Show and send an error detail.
      this.show_js_error(m,f,l,c,ex);
      this.send_report('js-execution-error', m, o);

      // Back to home.
      Device.alert(__l("error.javascript_execution") + "\n" + m, __l("common.error"))
        .then($.proxy(this.reload, this));
    },


    reload: function(){
      this.target.screen.state.is_transiting = false;
      Router.open("");
    }

  });


  return new Debugger;

});
