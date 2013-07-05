exports.pages = function( view ) {
  return function( req, res ) {
    res.render( view + ".html" );
  };
};

// Show the home page
exports.index = function(req, res) {
  
  return res.render('editor/index.html');
  
};
