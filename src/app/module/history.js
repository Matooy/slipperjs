define([
  "module/module",
  "module/events",
  "core/debugger"
], function( Module, Events, Debugger ){


  var History = Module.extend(Events, {

    __histories: [],
    __last: null,


    initialize: function(){
    },


    make_empty_one: function(){
      return {url:"", path: "", param: {}};
    },


    start: function(){
      this.attachListener(window, 'popstate',
        (function(self){ return function(e){

          e.preventDefault();

          var curr = e.state;
          var last = self.last();

          if(curr && last){
            if(curr.timestamp > last.timestamp){
              self.trigger('pop_forward', curr);
            }else if(curr.timestamp < last.timestamp){
              self.trigger('pop_backward', curr);
            }
          }

          if(curr){
            self.trigger('popped', curr);
            self.push(curr, true, false);
          }

        }})(this));
    },


    /* push :: Object -> Boolean -> Boolean -> Nothing
     */
    push: function(s, trigger, push){

      var last = this.last();
      var t = (typeof trigger === 'undefined' || trigger === true) ? true : false;
      var p = (typeof push    === 'undefined' || push    === true) ? true : false;

      var next = this.__consolidate_state_change(last, s);

      // Stop.
      if(!next){
        Debugger.log('info', 'History', 'Nothing to do');
        return;
      }

      var next_url = (next.url) + (next.hash.length ? '#' + next.hash : '');

      setTimeout(FM.fn.proxy(function(){
        Debugger.log('info', 'History', 'Triggering History events', this.last());
        (p) && this.__histories.push(next);
        (p) && window.history.pushState(next, "", next_url);
        (t && !next.hashchanged && !next.querychanged) && this.trigger('push', next);
        (next.hashchanged || next.querychanged) && this.trigger('change', next);
        (next.hashchanged) && $(window).trigger('hashchange');
        this.last(next);
        window.history.replaceState(next, "", next_url);
      }, this));
    },


    __consolidate_state_change: function(last, next){

      next.hash = next.hash || find_hash(next.url);
      next.path = next.path || make_path(next.url);
      next.url  = trim_hash(next.url);
      next.timestamp    = next.timestamp || new Date().getTime();
      next.hashchanged  = false;
      next.querychanged = false;

      if((last && last.path === next.path) || next.path.length === 0){
        var qdif = last ? FM.ob.diff(last.param, next.param) : next.param;
        if(next.path.length === 0){
          next.path = last.path;
        }
        if(next.url.length === 0){
          next.url = last.url;
        }
        if(next.url.match(/^#/)){
          next.url = last.url + '#' + next.hash;
        }

        if(next.hash != last.hash){
          next.hashchanged = true;
        }else if(FM.ob.keys(qdif).length > 0){
          next.querychanged = true;
        }else{
          return false; // Do nothing!!
        }
      }

      return next;
    },


    back: function(length){
      var ev = (this.__histories.length >= length)
             ? this.__histories.slice( -1 * length).shift()
             : this.__histories.slice(1).shift();
      this.push(ev, true, false);
    },


    has: function(e){
      return (e && e.timestamp)
        && (function(c){
          var has = false;
          c.__histories.every(function(v){
            if(v.timestamp === e.timestamp){ has = true;} return v;
          });
          return has;
        })(this);
    },


    current: function(){
      var avl = this.__histories.slice(-1).shift();
      return FM.ob.keys(avl).length ? avl : this.make_empty_one();
    },


    last: function(o){
      if(o){
        return this.__last = o;
      }else{
        return this.__last;
      }
    }

  });


  function str(n){
    return (n || "");
  }

  function trim_hash(path){
    return str(path).split('#').shift();
  }

  function trim_query_string(path){
    return str(path).split('?').shift();
  }

  function find_hash(path){
    var p = str(path);
    var h = (p.match(/#/)) ? p.split('#').pop().split("?").shift() : '';
    return h;
  }

  function make_path(path, def){
    var p = str(path);

    p = trim_hash(p);
    p = trim_query_string(p);

    return p;
  }


  return History;

});
