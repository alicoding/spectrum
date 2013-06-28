var express = require( "express" ),
		habitat = require( "habitat" ),
    nunjucks = require( "nunjucks" ),
    path = require( "path" ),
    route = require( "./routes" );


var app = express(),
					env = new habitat(),
					// Mongo = require( "./lib/mongoose" )( env ),
					nunjucksEnv = new nunjucks.Environment( new nunjucks.FileSystemLoader( path.join( __dirname, 'views' )));

nunjucksEnv.express( app );
app.disable( "x-powered-by" );

app.use( express.compress() );
app.use( express.static( path.join( __dirname, "public" )));
app.use( express.bodyParser() );

app.use( app.router );
app.use( function( err, req, res, next) {
  if ( !err.status ) {
    err.status = 500;
  }

  res.status( err.status );
  res.render( 'error.html', { message: err.message, code: err.status });
});
app.use( function( req, res, next ) {
  res.status( 404 );
  res.render( 'error.html', { code: 404 });
});


app.get('/', route.home ("index"));
app.get('/:id', route.post.getPost);
app.get('/post/create', route.post.create);
app.get('/page/create', route.page.create);


app.listen( 3000, function(){
  console.log('Express server listening on port  3000')});
