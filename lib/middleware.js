module.exports = function( es ) {
var request = require('request');

var functions = {};

	functions.getAuthorDetails = function ( req, res, next ) {

		var name = req.params.id;

		es.get({_index: 'spectrum', _type:'post', _id: "1"}, function(err, result) {
			if(err) {
				res.status(404)
				return res.render("error.html", {message: err.message, code: 404 } );
			}
			res.render( "author.html",{fullName:result._source.fullName,author:result._source.author,
				email:result._source.email,authorDesc:result._source.authorDesc});
		});
	};

  functions.getAuthorSetting = function ( req, res, next ) {
    
    es.get({_index: 'spectrum', _type:'author', id: "1"}, function(err, result) {
			if(err) {
				return res.render("error.html", {message: "user not exist", code: 404 } );
			}
			res.send({fullName:result._source.fullName,author:result._source.author,
				email:result._source.email,authorDesc:result._source.authorDesc});
		});
  };

  	functions.getPost = function( req, res, next ) {
    var id = req.params.id;

		es.get({ _id: id}, function(err, result) {
			if(err) {
				return res.render("error.html", {message: "page not found :(" + err.message, code: 404 } );
			}
			var content = objectBeautifier(result);
			res.render("single.html", content);
		});
	};

	functions.getRecentPost = function ( req, res, next ) {
	 
 		var 
    	options = { _index : "spectrum", _type: "post" },
    	query = { sort : { postedOn : { order : "desc" } } };

  	es.search(options, query, function (err, data) {
  		console.log(data);
  		if(err) {
  			return res.render("error.html", {message: "page not found :(" + err.message, code: 404 } );
  		}
    	var content = objectBeautifier(data.hits.hits);
			res.render("index.html", content);
  	});


	};

  functions.saveAuthorSetting = function ( req, res, next ) {
    console.log(JSON.parse(req.body));
  //   var parsed = req.body; 
		// es.add({index: 'spectrum', type:'author', id:parsed.author}, {fullName:parsed.fullName,author:parsed.author,
		// 	email:parsed.email,authorDesc:parsed.authorDesc, refresh: true},
		//  function(err, result) {
		// 	if(err) {
		// 		return res.send(err);
		// 	}
		// });
  };

  functions.createPost = function( req,  res ){

    var content = req.body.data;
		es.index({_index: 'spectrum', _type:'post', _id:"hello"}, 
			{content:content, author:"Hello world", email: "ali@ali.com",
			postedOn: Date.now() }, function(err, result) {
			if(err) {
				return res.send(err.message);
			}
			res.render("single.html", result);
		});

};

	function objectBeautifier ( content ) {

		var newObject = {},
			arrayObject = [];
		var i;
		if (content instanceof Array) {
			content.forEach(function(item) { 
				newObject = {
					title: item._id,
					content: item._source.content,
					email: item._source.email,
					author: item._source.author,
					postedOn: item._source.postedOn
				}
				arrayObject.push(newObject);
			});
			return {posts:arrayObject};
		}	
		else {
			newObject = {
				title: content._id,
				content: content._source.content,
				email: content._source.email,
				author: content._source.author,
				postedOn: content._source.postedOn
			}
			return newObject;
		}
		
	};

	// use this with extreme careful 
	functions.dropEScontent = function ( req, res, next ) {

		es.indices.deleteIndex({_index: 'spectrum'}, function (err, result) {

			if (err) {
				res.send (err.message);
			}

		});
		
	};
	return functions;
};