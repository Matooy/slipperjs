define([
  'module/module',
  'module/events',
  'module/configurable',
  'module/history',
  'core/config',
  'core/loader',
  'core/traffic',
  'core/debugger'
], function( Module, Events, Configurable, History, C, Loader, Traffic, Debugger ){

  //
  // * Router.open( URL )
  // |
  // * Pushing new RouterHistory to this.history
  // |
  // * this.history triggers 'push' and/or 'change' event, if current state is changed.
  // |
  // * Router triggers 'pushstate' and/or 'change' event. (passthrough)
  // |
  // * Router receives new routing state in app.js via on('pushstate')
  // |
  // * Screen tries to change current view.
  // |
  // *-*--* Cached
  // | |  |
  // | |  * Screen replaces Router.__called with cached view object. (Router.update wont be called.)
  // | |
  // | *--* Not cached
  // |    |
  // |    * Screen requests Router view connection after successful transition.
  // |
  // * Screen starts transition after View.init promise is resolved/rejected.


  var RouterTransactionState = function(o){
    this.called = "";
    this.redirects = [];
    this.matched = [];
    this.template = "",
    this.view = "";
  }

  var RouterHistory = function(url, param){
    this.url = url;
    this.param = param;
  }


  var Router = Module.extend(Events, Configurable, {

    caches: [],


    // init :: Nothing
    initialize: function(){
      // Modules.
      this.history = new History;

      // Events
      this.history.on('push',   this.passthrough('push'));
      this.history.on('change', this.passthrough('change'));

      this.on('push', function(){
        Debugger.log('info', 'Router', 'New state pushed');
      });

      this.on('change', function pass_state_view(e){
        if(this.__called){
          var r, last, action;

          r    = this.__called;
          last = this.history.last();

          if(r.view && last && last.path === e.path){
            // Trigger action callbacks.
            action = this.make_action_name(e.hash);
            e.param = e.param || {};
            r.view.__rendered(function(){
              (r.view.action) && r.view.action.call(r.view, e.param);
              (r.view[action]) && r.view[action].call(r.view, e.param);
            });
          }
        }
      });

      this.on('connect-view', this.passthrough('change'));
    },


    /* start :: Nothing
     *
     * Start Router.
     * Initialize configuration and start history.
     */
    start: function(){
      // Merge configs.
      this.config(FM.ob.merge(
        C.config("core.router"),
        {route: C.config("route")},
        {path: C.config("path")}
      ));
      this.history.start();
    },


    /* connect_view :: String -> Object -> $.Deferred
     *
     * Passthrough a url request to Core/Loader.
     */
    connect_view: function(url, param, state){
      var
        df   = FM.fn.promise()
      , url  = url.toString ? url.toString() : false
      , path = this.find_path(url)
      , pr   = param || {}
      , p    = _.extend(this.query_parse(url), pr)
      ;

      // Validate.
      if( ! url ) return df.reject("Invalid path.");

      Debugger.log('info', 'Router', 'Connecting new URL to view: ' + url);

      df.then(
        FM.fn.proxy(function(res){
          this.__called = res;
          this.trigger('connect-view', this.history.last());
          Debugger.log('info', 'Router', 'Resolving View connection', res);
          return res;
        }, this),
        FM.fn.proxy(function(res){
          this.__called = false;
          Debugger.log('info', 'Router', 'Rejecting View connection', res);
          return res;
        }, this)
      );

      var o = state || (new RouterTransactionState);
      var l = o.matched.length;

      o = this.apply_route_config(path, o);

      if(o.matched.length > l){
        // Recursively applying configuration.
        return this.connect_view(o.view, p, o).then(df.resolve, df.reject);
      }else{
        this.trigger('change', this.history.last());
        Loader.view(o.view, p, o).then(FM.fn.proxy(function(e){
          df.resolve(e);
        }, this), df.reject);

        return df;
      }

      return df;
    },


    apply_route_config: function(path, state){
      var found = false;

      var o = state || (new RouterTransactionState);

      o.view = path;
      o.template = o.called ? o.template : path;
      o.called   = o.called || path;

      FM.ob.each(C.config('route'), function(c, k){
        if(found) return;

        var regexp = new RegExp('^('+k+')');

        if(!FM.ar.has(o.matched, k) && regexp.test(o.view)){
          if(FM.ob.has(c, 'path') && c.path){
            o.view = c.path;
            o.template = c.template;
          }
          if(FM.ob.has(c, 'view') && c.view){
            o.view = c.view;
          }
          if(FM.ob.has(c, 'template') && c.template){
            o.template = c.template;
          }
          if(FM.ob.has(c, 'param') && FM.vr.valid(c.param, 'object')){
            p = FM.ob.merge((FM.vr.valid(d.param, 'function') ? c.param(o.view, p) : c.param), p);
          }
          o.redirects.push(path);
          o.matched.push(k);
          found = true;
        }
      });

      return o;
    },


    // back :: Integer -> Nothing
    //
    back: function(length){
      this.history.back(length);
    },

    error: function(name){
      return this.connect_view(C.config('default_dir_prefix') + 'error/' + (name || 'default'));
    },

    make_history: function(path, param){
      var
        path         = (path && path.length ? path : this.config('default_index'))
      , callable_url = this.make_callable_url(path)
      , query        = this.query_parse(path)

      // Make new history.
      // * valid URL from <base href>.
      //   like: something?foo=bar#favorite
      // * passing parameters.
      return new RouterHistory(callable_url, FM.ob.merge({}, query, param));
    },


    // state :: String -> Nothing
    state: function(url, param, track){
      this.history.push(this.make_history(url, param), track);
    },


    open: function(url, p, track){
      Debugger.log('info', 'Router', 'Opening...' + url);
      var url = url || "";
      if(url.match(/^http(s)?:\/\//)){
        window.open(url, '_system');
      }else{
        this.state(url, p, track);
      }
    },


    // move :: String -> Object -> $.Deferred
    move: function(path, p){
      Debugger.log('info', 'Router: moving', path);
      this.state(path, p);
      return this.connect_view(path, p);
    },


    make_action_name: function(hash){
      var pt = hash.split(/[-]/);
      var nw = pt.reduce(function(m,v){
        return m + '_' + v;
      }, "");

      return 'do' + nw;
    },


    remove_non_path_part: function(str){
      var
        full = str.replace(/index\.html$/, "")
      , rep = new RegExp("^" + location.protocol)
      , reh = new RegExp("^/*" + location.host)
      , res = new RegExp("^/*")
      , reb = new RegExp("^/*" + this.config("path.root"))
      ;

      var rel = full;
      rel = rel.replace(rep, "").replace(res, "/");
      rel = rel.replace(reh, "").replace(res, "/");
      rel = rel.replace(reb, "").replace(res, "");
      return rel;
    },


    current: function(){
      return this.history.last();
    },

    current_url: function(){
      //return this.make_callable_url(location.pathname);
      return location.pathname + location.search + '' + location.hash;
    },


    make_callable_url: function(str){
      var p = this.remove_non_path_part(str);
      var t = trim_query(p);

      if(!t.length)
        p = this.history.current().path + p;

      if(p.match(/\/$/))
        p += this.config('default_index');

      return (!p.length) ? this.config('default_index') : p;
    },


    /* query_parse :: String -> Object
     *
     * Parse query
     */
    query_parse: function(url){

      if(!url) return {};

      var match
      ,pl     = /\+/g
      ,search = /([^&=]+)=?([^&]*)/g
      ,decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); }
      ,query  = (url.match(/\?/)) ? url.split('?').pop().split("#").shift() : ""
      ,param  = {}
      ;

      while (match = search.exec(query))
        param[decode(match[1])] = decode(match[2]);

      return param;
    },


    /* serialize :: Object -> (String -> ) String
     * Object to query string.
     */
    serialize: function(obj, prefix){
      var str = [];
      for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
          var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
          str.push(typeof v == "object" ? serialize(v, k) : encodeURIComponent(k) + "=" + encodeURIComponent(v));
        }
      }
      return str.join("&");
    },


    find_path: function(path, def){
      var p = path;

      p = this.make_callable_url(path);
      p = p.split("?").shift().replace(/\.html$/, "");
      p = p.split("#").shift();

      return p;
    }

  });



  //=========== HELPERS =============//

  function looking_protected_path(path){
    return (new RegExp('/'+ C.config('default_dir_prefix') )).test(path);
  }

  // Remove query-string
  function trim_query(path){
    return ((path || "").split("?").shift().replace(/\.html$/, ""))
  }

  // Like as Singleton.
  return new Router;

});
