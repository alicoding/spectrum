var express   = require( "express" ),
		habitat   = require( "habitat" ),
    nunjucks  = require( "nunjucks" ),
    path      = require( "path" ),
    route     = require( "./routes" );

// Load config from ".env"
habitat.load();

var app = express(),
					env = new habitat(),
          Mongo = require( "./lib/mongoose" )( env ),
          Posts = require( "./lib/models/posts" )( env, Mongo.mongoInstance() ),
					nunjucksEnv = new nunjucks.Environment( new nunjucks.FileSystemLoader( path.join( __dirname, 'views' )));

var middleware = require( "./lib/middleware" )( Posts, env );

// Express Configuration
app.configure( function() {

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
    res.render( 'error.html', { code: 404, message: "Page not found :(" });
  });

});

app.get('/', Mongo.isDbOnline, route ("index"));
app.get('/console', Mongo.isDbOnline, route("console"));

app.post('/console', function(req, res){
  var obj = {};
  console.log('body: ' + JSON.stringify(req.body));
  res.send(req.body);
});

app.get('/:id', middleware.getPost);
app.get('/post/create', middleware.create);


app.listen( env.get("PORT"), function(){
  console.log('Express server listening on port ' + env.get("PORT"))});
