var elasticsearch = require('elasticsearch'),
    express       = require( "express" ),
    nunjucks      = require( "nunjucks" ),
    path          = require( "path" ),
    route         = require( "./routes" );

var app           = express(),
    env           = require('./config/environment'),
    nunjucksEnv   = new nunjucks.Environment( new nunjucks.FileSystemLoader( path.join( __dirname, 'views' )));
    logger        = require('./lib/logger'),
    opts          = {index: 'spectrum', type:'post'},
    es            = elasticsearch(opts);
    middleware    = require( "./lib/middleware" )( elasticsearch, es, opts, env );


// Express Configuration
app.configure( function() {


  nunjucksEnv.express( app );
  app.disable( "x-powered-by" );
  app.use(express.logger());
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

app.get('/', route ("index"));
app.get('/admin/setting/author', middleware.createPost, route("admin/author-setting"));

app.get('/:id', middleware.getPost);
app.get('/post/create/:id', middleware.createPost);

app.get('/admin/delete/all', middleware.dropEScontent);


app.listen( env.get('PORT'), function() {
  logger.info("HTTP server listening on port " + env.get('PORT') + ".");
});