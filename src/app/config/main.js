define([
], function( M, C ){
  return {

    // Global namespace for views
    namespace: "Slipper",

    singlr: true,

    // Router will ignore prefixed-directory.
    // Please dont remove these prefixed dirs.
    default_dir_prefix: "@",


    //
    main_screen_id: 'container',


    // Change paths for 'components'.
    path: {
      // You can put 'component' into outsides of app/ dir.
      // view:     "/component/view",
      // template: "/templates",
    },


    // Alternative extensions for paths.
    extensions: {
      template: "html"
    },


    debug: false,


    scheme: ""

  }
});
