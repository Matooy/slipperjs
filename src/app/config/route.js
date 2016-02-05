define([], function(){

  return {
    'doc/(?!(sample/))': {
      'view': "doc/@layout/main",
      'param': function(path, param){
        console.log(path, param);
        return param;
      }
    }
  }

});
