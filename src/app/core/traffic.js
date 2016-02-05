define([
  'module/module',
  'module/events',
  'module/configurable',
  'core/config',
  'core/request',
  'core/debugger'
], function( Module, Events, Configurable, C, Request, Debugger ){

  var Traffic = Module.extend(Events, Configurable, {

    initialize: function(){
    },


    inquire: function(url){
      Debugger.log('info', 'Traffic', 'inquire -> ' + url);
      return Request.get({
        url: '/__adapter/' + url
      });
    }


  });

  return new Traffic;

});
