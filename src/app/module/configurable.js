define(["module/module"], function(Module){

  var Configurable = Module.extend({

    __configuration: {},

    //
    //
    config: function(){
      var args = Array.prototype.slice.call(arguments);

      switch(args.length){
        case 0:
          return this.__configuration;

        case 2: // Setting
          return this.__configuration[args[0]] = args[1];

        case 1: // Getting or MASS setting.
          switch(typeof args[0]){
            // Simple getter.
            // Getting one configuration by key.
            case 'string':
              var lit = args[0].split(".");
              var dp = lit.reduce(function(m, k){
                return (m && m.hasOwnProperty(k)) ? m[k] : undefined;
              }, this.__configuration);
              return dp;
            // Object? Array? Constructor?
            case 'object':
              switch(args[0].toString()){
                case '[object Object]': // Mass setting.
                  this.__configuration = FM.ob.merge(this.__configuration, args[0]);
                  break;
                case '[object Array]': // Picking.
                  return _.pick.apply(this.__configuration, _.union([this.__configuration], args[0]));
                  break;
                case '[object Function]':
                  /* Do something */
                  break;
              };
              break;
          }
          break;
      }

    },


    config_fetch_safe: function(key, def){
      return this.config(key) || ((typeof def !== 'undefined') ? def : null);
    }

  });

  return Configurable;

});
