define([
  'module/module'
], function(Module){

  /* Event Module
   *
   */
  var Events = Module.extend({

    __event_holder: [],

    config: {
      identifier_separeter: "."
    },


    // attachListener :: DOMElement -> String -> Function -> (Boolean) -> ??
    //
    // This will return addEventListener or attachEvent results.
    // If both method are not available, this will return false.
    //
    attachListener: function(element, ev, c, useCapture){

      if(element.addEventListener) {
        return element.addEventListener(ev, c, useCapture || false);
      }else if(element.attachEvent){
        return element.attachEvent('on' + ev, c);
      }else{
        return false;
      }

    },


    // on :: String -> Function -> Context -> Object
    //
    // This will return event object.
    // It is required when call off().
    //
    // click.ActionName
    //
    on: function(ev, callback, context){
      switch(arguments.length){
        case 1:
          return (function(c){ return (function(callback, context){
            return c.on(ev, callback, context || c);
          }); })(this);
        case 2:
        case 3:
          this.__event_holder.push(this._make_event_object(ev, callback, (context || this)));
      }
    },


    // off :: String -> Object -> Object -> MaybeObject
    //
    // * If the event has been successfully unboud,
    // * this will return NULL!
    //
    off: function(ev, e, context){
      if(arguments.length === 0) return this.__event_holder = [];

      var ei = this._parse_event_name(ev);
      var c = context || this;
      var f = (e)
            // If specific event object passed,
            // unbind only event that has same event object.
            ? function(v, i){
                return ( v === e ); }
            // If no specific event object passed,
            // unbind all events related "this".
            : function(v, i){
                if(ei.type && ei.id){
                  return (v.type !== ei.type && v.id !== ei.id);
                }else if(ei.type){
                  return (v.type !== ei.type);
                }else if(ei.id){
                  return (v.id !== ei.id);
                }
              }

      c.__event_holder = _.filter(c.__event_holder, f);

      return c.__event_holder;
    },


    // observe :: Object -> String -> {Closure} -> MaybeObject
    //
    // Observe an other Events.
    //
    observe: function(context, ev, callback){
      // Check if context has __event_holder at least...
      if(context.__event_holder){
        return context.on.apply(this, [ev, callback]);
      }
    },


    // unobserve :: Object -> String -> Nothing
    //
    // Stop observing other context.
    //
    // See also this article.
    // https://answers.yahoo.com/question/index?qid=20100128010520AAPZEzg
    //
    unobserve: function(context, ev){
      var c = this;
      if(context.__event_holder && context.__event_holder[ev]){
        _.each(context._retrieve_holder(ev), function(v,i){
          if(v.context === c) context.__event_holder.splice(i,1);
        });
      }
    },


    // trigger :: String -> Callback -> undefined
    //
    trigger: function(/* Event Name, Arguments... */){
      var args = Array.prototype.slice.call(arguments);
      var ev = args.shift();
      return this._event_call(ev, args);
    },


    // passthrough :: String -> Function
    //
    // Almost same as proxy thing.
    passthrough: function(ev){
      return (function(c){
        return function(){
          c.trigger.apply(c, [ev].concat(Array.prototype.slice.call(arguments)));
        }
      })(this);
    },


    // ----------- Helpers ----------- //

    _make_event_object: function(ev, callback, context){
      var ei = this._parse_event_name(ev);
      return {
        'id': ei.id,
        'type': ei.type,
        'callback': callback,
        'context': context};
    },

    _init_holder: function(ev){
      if(!this.__event_holder) return false;
      if(ev){
        var e = this._parse_event_name(ev);
        this.__event_holder = this.__event_holder || [];
      }
      return this.__event_holder;
    },


    _retrieve_holder: function(ev){
      return this.__event_holder.filter(this._make_filter(ev));
    },

    _make_filter: function(ev){
      var ei = this._parse_event_name(ev);
      return function(e){
        if(ei.id && ei.type){
          return (e.id === ei.id && e.type === ei.type)
        }else if(ei.id){
          return (e.id === ei.id)
        }else if(ei.type){
          return (e.type === ei.type)
        }
      }
    },


    _parse_event_name: function(ev){
      var evi = ev.split(this.config.identifier_separeter);
      var ev  = evi.shift() || undefined;
      var nm  = evi.shift() || undefined;
      return {
        'type': ev,
        'id' : nm
      }
    },


    //
    _event_call: function(ev, args, context){
      _.each(this._retrieve_holder(ev), this._callback_proxy.apply(this, args))
    },


    // _callback_proxy :: a -> {Closure}
    _callback_proxy: function(param){
      var args = Array.prototype.slice.call(arguments);
      return (function(c){
        return c ? c.callback.apply(c.context, args) : false;
      });
    }

  });


  return Events;

});
