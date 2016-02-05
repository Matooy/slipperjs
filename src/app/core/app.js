/**
 * app
 */
(function(root){

  define([
    "module/module",
    "core/config",
    "core/router",
    "core/loader",
    "core/request",
    "core/traffic",
    "core/screen",
    "core/device",
    "core/debugger",
    "module/view"
  ], function(
    M, C,
    Router, Loader, Request, Traffic, Screen, Device,
    Debugger, View
  ){

    var App = M.extend({

      info: {
        version: '1.0.0'
      },

      state: {
        initialized: false,
      },

      Core:   {},
      Module: {},

      // Application Constructor
      initialize: function() {

        if(this.state.initialized) return;

        // Assign
        this.Core.Config   = C;
        this.Core.Router   = Router;
        this.Core.Loader   = Loader;
        this.Core.Traffic  = Traffic;
        this.Core.Device   = Device;
        this.Core.Screen   = Screen;
        this.Core.Request  = Request;
        this.Core.Debugger = Debugger;
        this.Core.View     = View;

        this.state.initialized = true;
        this.state.environment = C.config('environment');
      },


      main: function(option){

        unset_globals(root);

        // Initialize configuration.
        C.config(option);

        // Start router.
        Router.start();

        observe_window_event();

        // Preparation.
        (function(){

          prepare_language();

          Loader.config(C.config('path'));
          Request.config(C.config('server'));

          if(C.config('singlr')){
            prepare_main_screen()
              .then(
                FM.fn.proxy(prepare_router, this),
                function(){ Debugger.log('error', "Failed to initialize main screen."); });
          }

        })();

        this.information();
        return this;
      },


      /*
       */
      define: function(alt){
        return {
          view: function(c){
            define(["core/app"].concat(alt || []),
              (FM.vr.type(c) === 'object'
                ? (function(app){ return app.Core.Screen.Layout.extend(c); })
                : (FM.vr.type(c) === 'function'
                    ? FM.fn.proxy(c)
                    : {})));
          },
          language: function(c){
            define(function(){
              return c;
            });
          }
        }
      },


      information: function(){
        Device.info();
      }


    });


    /* prepare_main_screen :: Nothing
     */
    function prepare_main_screen(){
      var df = FM.fn.promise();
      var pr = C.config('default_dir_prefix');
      Loader.load('view', [pr + 'layout/main', pr + 'layout/mask']).always(
        function(main, mask){
          Screen = (mask) ? FM.ob.merge(Screen, mask) : Screen;
          Screen.Layout = main || View;
          // Initialize main screen.
          Screen.make.call(Screen).then(function(){
            Screen.render();
            Screen.bind();
            Screen.$el.get(0).style.opacity = 1;
            df.resolve();
          }, df.reject);
        }
      );
      return df;
    }


    /* prepare_router :: Nothing
     */
    function prepare_router(){

      var snapshot = null;

      Router.on("push", function(e){
        Debugger.log('info', 'Core', 'Starting Screen transition: ' + e.url);
        var prefix = C.config('default_dir_prefix');
        // When default_dirs is accessed, return error page view.
        if((new RegExp('^' + prefix)).test(e.path)){
          Screen.toggle_page(prefix + 'error/404');
        }else{
          Screen.toggle_page(e.url, e, true).then(function(d){
            // Snapshot
            ((function(){
              d
              ? d.then(function(){
                  var cln = Screen.$el.clone();
                  cln.find(Screen.y).css({opacity: 1});
                  C.config('require')('core/debugger').log('info', 'SNAPSHOT', Screen.state.current_view.option.snapshot);
                  (Screen.state.current_view.option.snapshot)
                    && (function(){
                      Request.post({
                        url: '__snapshot',
                        data: {
                          name: e.url,
                          html: cln.html()
                        }
                      }).always(function(){
                        snapshot = true;
                      });
                    })();
                })
              : Debugger.log('error', 'Core', 'Failed to send snapshot');
            })());
          });
        }
      });


      // Fire state change event.
      $(document).on("click", "a,area", function(e) {
        e.preventDefault();
        if(Screen.is_transiting()) return;

        var el = $(this)
          , href  = el.attr("href")
          , track = el.attr('data-trackable') == "0" ? false : true
        ; // def

        (href) && Router.open(href, {}, track);
      });


      // First contact.
      // Router.config(this.Core.Config.config());
      var cn = Router.current_url();

      Router.open.apply(Router,
        (typeof APP_SCHEME_TRESPASSING !== 'undefined'
          ? [APP_SCHEME_TRESPASSING, {scheme_trespass: true}]
          : [(cn.length ? cn : "home")]));
    }


    /* prepare_language :: Nothing
     *
     * Prepare language set.
     */
    function prepare_language(){
      C.config('require')([
        'i18n/' + C.config('default_dir_prefix') + 'global/messages',
      ], function(g){

        var def = function(success){
          return function(messages){
            var msg = success ? FM.ob.merge(g, messages) : g;
            window.__l = function(key, bind){
              return (msg.hasOwnProperty(key)) ? _.template(msg[key])(bind) : key;
            }
          }
        }

        C.config('require')([
          'i18n/' + (Device.language().language || 'en') + '/messages'
        ], def(true), def(false));

      }, function(){
        window.__l = function(){
          return "ERROR_LOAD_I18N_CONFIGURATION";
        }
      });
    }


    /*
     */
    function unset_globals(root){
      // Unset require method.
      C.config('require', require);
      root['require'] = root['requirejs'] = undefined;
    }


    /* Bind 'special' window events for cordova.
     *
     * 'load', 'deviceready', 'offline', 'online', 'handleOpenURL'
     */
    function observe_window_event() {

      // Overrides URL scheme handler.
      window.handleOpenURL = function(scheme) {
        // remove protocol
        var reg = new RegExp(C.config('scheme') + "://");
        url = scheme.replace(reg,'');
        Router.open(url);
      };

      window.offline = function(){
        alert("Good bye WWW!");
      }
      window.online = function(){
        alert("Welcome back!");
      }
    }

    // Export
    return (function(){

      var instance = new App;

      if(root[C.config('namespace')] && root[C.config('namespace')].queues){
        root[C.config('namespace')].queues.map(function(cb){
          cb.call(instance, instance);
        });
      }

      // Expose
      root[C.config('namespace')] = {
        info   : instance.info,
        define : instance.define,
        Core   : instance.Core
      }

      return instance;

    })();

  });

})(this);
