define([
  'module/module',
  'module/events',
  'core/loader'
],function( Module, Events, Loader ){
  'use strict';

  return Module.extend(Events).extend({

    el:       "",
    template: "",
    events:   {},
    includes: {/* PARTIAL_NAME: "path/to/partials" */},
    partial:  {},
    state:    {
      rendered: false,
    },

    // To override default beheivior
    overrides: {
      // Override template name.
      // Defaults, view/sample.js will call templates/sample.html.
      template: null,
      // Cacheable?
      cacheable: true
    },


    initialize: function(){
      /* Do something */
    },


    __make_property: function(){
      if(typeof this.overrides === 'function'){
        this.overrides = this.overrides.call(this);
        this.overrides = FM.ob.merge({},
          { cacheable: true
          , template: null
          },
          (FM.vartype(this.overrides) === 'object'
              ? this.overrides
              : {}
          )
        );
      }
      this.state.rendered = new FM.fn.promise();
    },

    /*
     */
    __rendered: function(f){
      return this.state.rendered.then(f);
    },

    // Delegate events.
    __apply_events: function(){
      (this.events) && (function(self){ // binding
        _.each(self.events, function(callback, ev){
          var s, e, t, cs;
          s = ev.split(' ');
          e = s.shift();
          t = s.join(' ');
          cs = FM.vr.valid(callback, 'array') ? callback : [callback];
          cs.map(function(c){
            self.$el.on.apply(self.$el,
              [e].concat(t.length > 0 ? [t] : [])
                  .concat([(typeof c === 'function')
                    ? FM.fn.proxy(c, self)
                    : (typeof self[c] !== undefined
                      ? FM.fn.proxy(self[c], self)
                      : function(){})])
            );
          });
        });
      })(this);
    },




    // make :: Object -> $.Deferred
    //
    // Make view.
    make: function(param){
      var df = new $.Deferred;
      var p  = param || {};
      this.$el = $(this.el || "<div>");

      this.load_partials.apply(this, [this.includes, p]).then(
        FM.fn.proxy(function(){
          this.__make_property();
          if(this.init && typeof this.init === 'function'){
            this.init.apply(this, [df, p])
          }else{
            df.resolve(p);
          }
        }, this),
        function(){
          df.reject("error_load_main_screen_partials");
        }
      );

      return df;
    },


    // load_partials :: Object -> Object -> $.Deferred
    //
    // When all 'this.includes' is loaded, $.Deferred will be resolved.
    //
    load_partials: function(includes, param){
      var df = FM.fn.promise();
      var self = this;

      // Nothing to do.
      if(!includes || FM.vr.type(includes) !== 'object' || _.keys(includes).length === 0){
        df.resolve();
        return df;
      }

      Loader.view(_.values(includes)).then(
        function(){
          var views = FM.ar.clone(arguments);
          var loaded = _.object(_.keys(includes), views);

          FM.ob.each(loaded, function(r, n){
            self.partial[n] = r.view;
          });

          df.resolve(views);
        },
        function(){
          df.reject("View.load_partials Failed to load partials.")
        }
      );

      return df;
    },


    // load_template :: String -> $.Deferred
    //
    // Load template file as text.
    // When loaded, $.Deferred will be resolved.
    // If successfully loaded, template will be set to `this.template`.
    //
    load_template: function(path, param){
      var df = new $.Deferred();
      var path = (this.overrides.template || path);

      var loader   = null;
      var template = null;

      if(typeof this.template === 'function'){
        loader = this.template(param);
      }else if(typeof this.template === 'string'){
        template = this.template;
      }

      if(!FM.vr.valid(loader, 'object') || !loader.hasOwnProperty('then')){
        template = loader;
        loader = null;
      }

      if(!loader && !template){
        loader = Loader.load('template', path);
      }

      var done = function(res){
        this.template = res;
        this.loaded && this.loaded.call(this);
        df.resolve(res);
      };

      if(loader && loader.then){
        loader.then(
          FM.fn.proxy(done, this),
          FM.fn.proxy(function(res){
            return df.reject(res);
          }, this)
        );
      }else{
        done(template);
      }
      return df;
    },


    /* render :: Object -> Nothing
     *
     * When called, update `this.$el.html` with `this.template`.
     * And `this.rendered` method will be called after updating DOM.
     */
    render: function(param){
      this.update(param);

      setTimeout((function(c){
        return function(){
          (!c.state.rendered.state()) && c.state.rendered.resolve();
          // Call rendered().
          (c.rendered && typeof c.rendered === 'function') && c.rendered.call(c, param);
          // Apply view.events.
          c.__apply_events();
        }
      })(this));
    },
    // Alias of render.
    refresh: function(attr){ this.render(attr); },


    /* update :: Object -> Nothing
     */
    update: function(attr){
      // Observe element insertion.
      if(this.$el && this.template){
        this.$template = this.$template || $("<div>" + this.template + "</div>");
        this.$el.html(_.template(FM.html.trim(this.template, 'script'))(attr || {}));
      }else{
        this.$el.html("");
      }
    },


    /* dispose :: View -> String
     *
     * Dispose view.$el to other view.$el
     *
     * position: Choose from jQuery collection's methods.
     */
    dispose: function(view, position, param){
      var s = !FM.vr.empty(view.$el[position]) ? view.$el[position] : view.$el['append'];
      this.observe_insertion(param);
      s.call(view.$el, this.$el);
      return this;
    },


    insert: function(el, param){
      this.observe_insertion(param);
      el.append(this.$el);
    },


    /* observe_insertion :: Object -> Nothing
     *
     * Observe a DOMNodeInserted event.
     * When that event triggered, call view.inserted() method.
     *
     */
    observe_insertion: function(param){
      /* @TODO DOMNodeInserted is deprecated.
       *
       * But, only modern(20141002) browsers support MutationObserver.
       * To implement MutationObserver, I have to wait more.
       *
       * See also mozilla: Mutation_events, MutationObserver
       *
       * https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Mutation_events
       * https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
       */
      var c = this;
      c.$el.one('DOMNodeInserted.viewInsertion', function(){
        setTimeout(function(){
          (c.inserted && typeof c.inserted === 'function')
            && c.inserted.call(c, param);
        });
      });
    },


    /* This will be called when ...
     *  view.overrides.cacheable === false
     *  &&
     *  view has been changed to other.
     */
    destroy: function(){
    },



    /*-------~~
     | Hooks  |
     |-------~~      __________________________________________
     |              |                                          |
     |              | Router -> loaded -> rendered -> inserted |
     |              |__________________________________________|
     |                  | |                             | |
     */

    // Called after template load finished.
    // If you are using .md or something not html formatted files,
    // You may want to override this.template value before compiling.
    loaded: function(){
    },

    // Called after this.render() method called.
    rendered: function(e){
    },

    // Called after DOMNodeInserted event fired.
    // @TODO DOMNodeInserted is deprecated
    inserted: function(e){
    },

    // Called when only hash is changed
    hashchanged: function(e){
    },


  });

});
