define([
  'module/module',
  'module/events',
  'module/configurable',
  'core/config',
  'core/debugger',
], function( Module, Events, Configurable, C, D ){

  var prxy = FM.fn.proxy;

  var make_error = function(code, message, opt){
    return FM.ob.merge({
      code: code,
      message: message || null
    }, opt || {});
  }


  var Loader = Module.extend(Events, Configurable, {

    STATUS:{
      'VIEW_NOT_FOUND':      404,
      'VIEW_NOT_CONTRUCTOR': 500,
      'VIEW_MAKE_FAILURE' :  500,
      'TEMPLATE_NOT_FOUND':  404,
    },

    initialize: function(){
    },


    /* path :: String -> String -> String
     */
    path: function(type, file){
      var
        base = (this.config_fetch_safe(type, false) || "component/" + type)
      , file = file.replace(/^\//, '')
      , ext  = this.file_ext(type)
      , path = ( base.match(/^\//) )
             ? this.config_fetch_safe("root", "")
               + base.replace(/^\//, '')
               + '/' + file + (ext ? '.' + ext : '')
             : base + "/" + file + (ext && ext != 'js' ? '.' + ext : '')
      ;

      D.log('info', "Loader", "Type: "+type, "Path: "+path);

      return path;
    },


    /* file_prefix :: String -> String -> String
     */
    file_prefix: function(name, file){
      switch(name){
        case 'template':
          return 'textify!' + file;
        default:
          return file;
      }
    },


    /* file_ext :: String -> String
     */
    file_ext: function(name){
      switch(name){
        case 'view':
          return 'js';
        case 'template':
          return C.config('extensions.template');
        default:
          return 'js';
      }
    },


    /* make_path_for_require :: String -> String
     *
     * Prepare requirejs-friendly path string.
     */
    make_path_for_require: function(name, file){
      var pt = this.path(name, file);
      var pr = this.file_prefix(name, pt);
      return pr;
    },


    /* load :: String -> String -> FM_Promise
     */
    load: function(name, file){
      var df = FM.fn.promise();
      var ls = (FM.vr.type(file) === 'array'
             ? file.map(prxy(function(f){ return this.make_path_for_require(name, f); }, this))
             : [this.make_path_for_require(name, file)]);

      D.log('info', 'Loader', 'loading ', name, ls);

      C.config('require')(ls,
        prxy(function(){ df.resolve.apply(this, arguments); }, this),
        function(r){ df.reject(r); }
      );
      return df;
    },


    view: function(path, param, option){
      var df = FM.fn.promise();
      var op = option || {};

      this.load('view', path).then(
        this.__c_view_fetch_done.apply(this,  [df, path, param, op]),
        this.__c_view_fetch_error.apply(this, [df, path, param, op])
      );
      return df;
    },


    // Callbacks ----

      __c_view_fetch_done: function(df, path, param, option){
        return prxy(function(res){

          var t = (typeof res);
          var view = (t === 'function') ? new res : false;

          // STOP
          if(!view){
            return df.reject(make_error(
              this.STATUS.VIEW_NOT_CONTRUCTOR,
              'core.loader.error.view_invalid_type',
              {type: t}
            ));
          }

          var requirements = [];
          /* Do something with requirements. */

          $.when.apply(null, requirements)
            .then(
              prxy(this.__c_view_requirement_filled(df, path, param, view, option), this),
              prxy(this.__c_view_requirement_missed(df, path, param, view, option), this));

          return option;

        }, this);
      },
      __c_view_fetch_error: function(df, path, p, param){
        return prxy(function(){
          return df.reject(make_error(
            this.STATUS.VIEW_NOT_FOUND,
            "core.loader.error.view_not_found",
            {path: path}
          ));
        }, this);
      },
      __c_view_requirement_filled: function(df, path, param, view, option){
        return prxy(function(){
          return view.make.call(view, param)
            .then( prxy(this.__c_view_make_done(df, path, param, view, option), this),
                   prxy(this.__c_view_make_fail(df, path, param, view, option), this));
        }, this);
      },
      __c_view_requirement_missed: function(df, path, param, view, option){
        return prxy(function(){
          return df.reject(make_error(
            this.STATUS.VIEW_REQUIREMENT_MISSED,
            "core.loader.error.view_partial_fail"
          ));
        }, this);
      },
      __c_view_make_done: function(df, path, param, view, option){
        return (function(p){
          return view.load_template(view.template || option.template || path, param)
          .then( prxy(this.__c_template_fetch_done(df, path, p, view, option), this),
                 prxy(this.__c_template_fetch_error(df, path, p, view, option), this));
        });
      },
      __c_view_make_fail: function(df, path, param, view, option){
        return prxy(function(r){
          df.reject(make_error(
            r.code || this.STATUS.VIEW_MAKE_FAILURE,
            r.message || 'core.loader.error.view_make',
            r
          ));
        }, this);
      },
      __c_template_fetch_done: function(df, path, data, v, option){
        return (function(res){
          return df.resolve({ path: path, data: data, view: v, option: option.option || {}});
        });
      },
      __c_template_fetch_error: function(df, path, data, v, option){
        return prxy(function(){
          return df.reject(make_error(
            this.STATUS.TEMPLATE_NOT_FOUND,
            'core.loader.error.template_fetch'
          ));
        }, this);
      }

  });


  return new Loader;

});
