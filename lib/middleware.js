module.exports = function( es, opts, env ) {

  var request 	= require('request');
return {

  saveAuthorSetting: function ( req, res, next ) {

    res.json( 200, { contents: req.body } );
  },

  createPost: function( req,  res ){
	var id = req.params.id;
		es.add({index: 'spectrum', type:'post', id:"a"}, {hi:"Ali", name:"Hello world"}, function(err, result)
		{
			if(err)
			{
				return res.send(err);
			}

			console.log(result);

			res.render("single.html", result);

		});

    res.json({success:"Done"});

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
	}
};
};