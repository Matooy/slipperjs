define([
  "module/module",
  "module/configurable",
  "core/config",
  "core/debugger"
], function( Module, Configurable, C, D ){
  'use strict';

  var Request = Module.extend(Configurable, {


    get: function(p){
      return this.send('get', p);
    },


    post: function(p){
      return this.send('post', p);
    },


    /* http_request.send :: Object -> FM_Promise
     *
     */
    send: function( type, param ){

      var Debugger = C.config('require')('core/debugger');

      var df = FM.fn.promise();
      var param = param || {};


      // Prepend API server's url.
      if( param.url ){
        param.url = this.config('base_path') + param.url;
      }

      Debugger.log('info', 'Request', 'Sending request to server.' + param.url);

      param.data = param.data || {}

      // pick callbacks.
      var on_success = param.success || null;
      var on_error   = param.error   || null;

      delete param.success
      delete param.error

      // Remove header thing.
      var headers = param.headers || {};
      delete param.headers;

      var resp = function(r){
        return (r.hasOwnProperty('responseJSON') ? r.responseJSON : r);
      }

      var req = _.extend({
        type: type,
        cache: false,
        headers: _.extend({}, headers, {
          'cache-control': 'no-cache'
        }),
        success: function(res){
          clearTimeout(timeoutObserver);
          var res = resp(res);
          (typeof on_success === 'function') && on_success(res);
          (res && res.hasOwnProperty('error')) ? df.reject(res) : df.resolve(res);
        },
        error: function(res){
          clearTimeout(timeoutObserver);
          var res = resp(res);
          ( typeof on_error === 'function' ) && on_error(res);
          df.reject(res);
        }
      }, param);

      // Trigger timeout after 10 sec.
      var timeoutObserver = setTimeout(function(){
        if(df.state() === 'pending'){
          df.reject({error: __l("error.request_timeout")});
        }
      }, 1000 * (this.config('timeout') || 24));

      $.ajax(req);

      return df;
    }
  });

  return new Request;
});
