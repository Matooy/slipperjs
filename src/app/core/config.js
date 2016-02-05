define([
  "module/module",
  "module/configurable",

  "config/main",
  "config/environment",
  "config/server",
  "config/route",
], function( M, C, main, environment, server, route ){

  var defaults = {
    extensions: {},
    core: {
      router: {
        default_index: "home"
      }
    },
    path: {
      'view':     'component/view',
      'template': 'component/template'
    },
    server: FM.ob.define({
      'base_path': '',
      'timeout' : 10
    })(server)
  }

  var Config = M.extend(C, {

    initialize: function(option){

      if(FM.ob.has(environment, 'init')){
        main = environment.init(main);
        delete environment['init'];
      }

      this.config(defaults);
      this.config(main);
      this.config(environment);
      this.config({server: server});
      this.config({route: route});

      console.log(this.config());
    }

  });

  return new Config;
});
