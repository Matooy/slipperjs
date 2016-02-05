define([], function(){
  'use strict';

  /*
   * Eternal extendation.
   *
   * You can make insane constructor easily.
   *
   *
   * var some_mod = Module.extend({name: "sample"});
   *
   * var insane_constructor =
   *   some_mod
   *     .extend(something_1, something_2, something_3)
   *     ..... ;
   *
   */

  // Module :: a -> Constructor(a)
  //
  var Module = function(){
    // Append identifier.
    this.identifier = "Module_" + (new Date).getTime();
    (typeof this.initialize === 'function')
      && this.initialize.apply(this, arguments);
  };


  // cp :: Objet -> a -> Nothing
  //
  // Destructive function. Overrides properties to dst.
  //
  function cp(dst, src, recr){
    var r;
    r = (recr === undefined) ? 1 : parseInt(recr);
    r = (r < 0) ? 0 : r;
    for(var i in src){
      var c = src[i];
      // !null && ( [object Object] || [object Array] )
      // To cut off references, clone an object for each props.
      if(c && typeof c === 'object'){
        // Make a new property.
        Object.defineProperty(dst, i, {
          value: (c.constructor) ? new (c.constructor) : {},
          configurable: true, enumerable: true, writable: true
        });
        // Prevent infinity-loop.
        r && cp(dst[i], c, r-1);
      }else{
        dst[i] = c;
      }
      c = null;
    }
  }


  // dilator :: [a...] -> Constructor
  //
  // Take variable arguments. Return a new Constructor.
  //
  function dilator( /* Arguments */ ){

    var args , p, o ;

    // Prepare parent and arguments.
    args = Array.prototype.slice.apply(arguments);
    p = this;

    // Make a new Constructor.
    var M = function(){
      return p.apply(this, arguments);
    };

    // Make a surrogate.
    var Stack = function(){
      this.constructor = Module;
    }

    // Phase shifting,
    Stack.prototype  = p.prototype;
    M.prototype = new Stack;
    M.extend    = dilator;

    M.prototype.__super__ = p.prototype;

    // Slice first argument.
    // And check it's construcable or not.
    o = args.shift();
    o = (typeof o === "function" && o.constructor) ? new o : o;

    // Do copy do.
    (function(x){
      cp(M.prototype, x, 10);
    }).call(o,o);

    // More more more extensions!!
    M = (args.length > 0) ? dilator.apply(M, args) : M;

    return M;
  }


  Module.extend = dilator;

  return Module;


});
