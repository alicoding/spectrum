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

exports.fetch_md = Core.fetchMd
exports.download_md = Core.downloadMd
exports.fetch_html = Core.fetchHtml
exports.fetch_html_direct = Core.fetchHtmlDirect
exports.download_html = Core.downloadHtml
exports.fetch_pdf = Core.fetchPdf
exports.download_pdf = Core.downloadPdf

/* End Core stuff */

