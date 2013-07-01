module.exports = function( elasticsearch, es, env ) {

var functions = {};

	functions.getAuthorDetails = function ( req, res, next ) {

		var name = req.params.id;

		es.get({index: 'spectrum', type:'author', id: "1"}, function(err, result) {
			if(err) {
				res.status(404)
				return res.render("error.html", {message: err.message, code: 404 } );
			}
			res.render( "author.html",{fullName:result._source.fullName,author:result._source.author,
				email:result._source.email,authorDesc:result._source.authorDesc});
		});
	};

  functions.getAuthorSetting = function ( req, res, next ) {
    
    es.get({index: 'spectrum', type:'author', id: "1"}, function(err, result) {
			if(err) {
				return res.render("error.html", {message: "user not exist", code: 404 } );
			}
			res.send({fullName:result._source.fullName,author:result._source.author,
				email:result._source.email,authorDesc:result._source.authorDesc});
		});
  };

  	functions.getPost = function( req, res, next ) {
    var _id = req.params.id;

		es.get({index: 'spectrum', type:'post', id: _id}, function(err, result) {
			if(err) {
				return res.render("error.html", {message: "page not found :(", code: 404 } );
			}
			var content = objectBeautifier(result);
			res.render("single.html", content);
		});
	};

	functions.getRecentPost = function ( req, res, next ) {

		es.queryAll({index:"spectrum", type:"post"}, function(err, result) {
			if(err) {
				return res.render("error.html", err.message);
			}
			var content = objectBeautifier(result.hits.hits);
			res.render("index.html", content);
		});
	};

  functions.saveAuthorSetting = function ( req, res, next ) {
    
    var parsed = req.body; 
		es.add({index: 'spectrum', type:'author', id:parsed.author}, {fullName:parsed.fullName,author:parsed.author,
			email:parsed.email,authorDesc:parsed.authorDesc, refresh: true},
		 function(err, result) {
			if(err) {
				return res.send(err);
			}
		});
  };

  functions.createPost = function( req,  res ){
	var title = req.params.id;
	var d = new Date();
	d.toDateString();
		es.add({index: 'spectrum', type:'post', id:title}, 
			{content:"Ali", author:"Hello world", email: "ali@ali.com",
			postedOn: d, refresh: true}, function(err, result) {
			if(err) {
				return res.send(err);
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

		var index = new elasticsearch.Index({name:'spectrum'});

		index.delete(function(err, result) {
			if(err){
				return res.send(err.message);
			}
			return res.send(result);
			next();
		});
	};
	return functions;
};