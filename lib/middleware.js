module.exports = function( elasticsearch, es, opts, env ) {

  var request 	= require('request');
return {

  saveAuthorSetting: function ( req, res, next ) {

    res.json( 200, { contents: req.body } );

  },

  createPost: function( req,  res ){
	var title = req.params.id;
		es.add({index: 'spectrum', type:'post', id:title}, {hi:"Ali", name:"Hello world", refresh: true}, function(err, result) {
			if(err) {
				return res.send(err);
			}
			console.log(result);
			res.render("single.html", result);
		});

},

  	getPost: function( req, res, next ) {
    var id = req.params.id,
		url = env.get("ELASTIC_SEARCH_QUERY")+id;

		console.log(url);
		request( url, function(error, req, body ){

			if (error){
				res.json(error.message);
			}

			var parsed = JSON.parse(body); 

			if (!parsed._source) {
				res.status( 404 );
    		return res.render( 'error.html', { code: 404, message: "Page not found :(" });
			}

  		return res.render("single.html", parsed._source);
  });
	},
	dropEScontent: function ( req, res, next ) {

		var index = new elasticsearch.Index({name:'spectrum'});

		index.delete(function(err, result) {
			if(err){
				return res.send(err.message);
			}
			return res.send(result);
			next();
		});
	}
};
};