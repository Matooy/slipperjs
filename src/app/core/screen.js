define([
  "core/app",
  "module/view",
  "config/main",
  "core/router",
  "core/debugger"
], function(App, View, Config, Router, Debugger){

  var Screen = View.extend({

    name: "main_screen",

    el:       '#'+Config.main_screen_id,

    /* Content yield selector.
     */
    yield_id: 'yield',

    /* Default template.
     */
    template: '<div id="yield"></div>',

    caches: {},

    state: {
      is_transiting: false,
      current_view:  null,
      toggle_show_method: 'show',
      toggle_hide_method: 'hide'
    },


    init: function(df){
      this.observe_window();
      df.resolve();
    },


    /* Observe window events.
     *
     */
    observe_window: function(){
      $(window).on('resize.main_screen_resize', this.observe_window_resize);
      window.onbeforeunload = FM.fn.proxy(function(e){
        e.cancelBubble = true;
        if(e.stopPropagation){
          e.stopPropagation(); e.preventDefault();
        }
        return e.returnValue = this.observe_window_beforeunload(e);
      }, this);
    },


    bind: function(){
      this.$el.find('[data-controller]').each(function(e){
        console.log(e);
      });
    },


    observe_window_resize: function(e){ Debugger.log('info', 'Screen', "hook.window_resize"); },
    observe_window_beforeunload: function(e){
      return "You are just reloading or leaving.\nYou can't undo this operation.";
    },


    /* Return current active $element.
     */
    yield: function(){
      return this.$el.find('#' + this.yield_id);
    },


    // Show & Hide
    show: function(){
      var df = FM.fn.promise();
      this.yield().show().animate({opacity: 1}, {
        complete: df.resolve
      });
      return df;
    },
    hide: function(){
      var df = FM.fn.promise();
      var style = {'opacity': 0};
      var el = this.yield();
      el.animate(style, {
        complete: function(){
          el.hide().css((function(){
            var k = _.keys(style);
            var e = Array.apply(null, new Array(k.length)).map(function(){return ""});
            return _.object(k, e);
          })()).css(style);
          df.resolve();
        }
      });
      return df;
    },


    change_content: function(r){

      // Success
      var data = r.data;
      var v = r.view;

      if( v.overrides.cacheable ){
        Debugger.log('info', 'Screen', 'view cacheable', r);
        this.caches[r.path] = r;
      }

      // Ignore rerendering when cache is enabled.
      if( ! r.cache ){
        v.render(data);
      }

      if( this.state.current_view && !this.state.current_view.cache && this.state.current_view.view ){
        this.state.current_view.view.destroy.call(this.state.current_view.view);
      }

      this.state.current_view = r;

      var y = this.yield();

      y.empty();
      v.insert(y, data);

      ( this.content_changed && typeof this.content_changed === 'function' )
        && this.content_changed(r);

      return this[this.state.toggle_show_method]().always((function(self){
        self.state.is_transiting = false;
      })(this));
    },


    show_error: function(name, e){
      this.toggle_page(Config.default_dir_prefix + 'error/' + name, e, {
        error_handling: true
      });
    },


    /* toggle_page :: String -> Object -> FM_Promise
     *
     */
    toggle_page: function(path, state, option){

      // If main screen is in transtion state,
      // stop too much toggle_page() request.
      // Ignore abortion when error_handling === true.
      if(this.is_transiting() && !option.error_handling){
        return setTimeout((function(c){ return function(){
          c.state.is_transiting = false;
          c.toggle_page(path, state, option);
        }})(this), 100);
      }

      Debugger.log('info', 'Screen', 'Starting toggle_page() process...');

      // Transition state start.
      this.state.is_transiting = true;

      // Make callbacks.
      var c_d = FM.fn.proxy(this.change_content, this);
      var c_f = this._make_callback_router_call_failure.call(this, arguments);

      // Toggle main screen's contents.
      //
      // 1. Hide main screen.
      // 2. Fetch new view object via Router.
      // 3. If fetching succeeded, change current view.
      //
      return this[this.state.toggle_hide_method]().then(FM.fn.proxy(function(){
        if(this.caches[path]){
          var c = this.caches[path];
          return FM.fn.promise(function(r){
            r(c);
          }).then(c_d, c_f);
        }else{
          Debugger.log('info', 'Screen', 'Requesting Router view connection.');
          return Router.connect_view(path, state).then(c_d, c_f)
        }
      }, this), c_f);
    },


    _make_callback_router_call_failure: function(path, state, option){
      return (function(self){ return (function(r){
        if( r && (!option || !option.error_handling) ){
          self.show_error((r.code || 'default'), r);
        }else{
          Router.open("home");
        }
      }); })(this);
    },


    is_transiting: function(){
      return this.state.is_transiting ? true : false;
    }


  });


  return new Screen;
});
