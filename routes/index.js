exports.pages = function( view ) {
  return function( req, res ) {
    res.render( view + ".html" );
  };
};


var path = require('path')
  , Core = require( path.resolve(__dirname, '../plugins/core/core.js') ).Core;
// Show the home page
exports.index = function(req, res) {
  
  return res.render('editor/index.html');
  
};

// /* Core stuff */

exports.fetch_html_direct = Core.fetchHtmlDirect

/* End Core stuff */

