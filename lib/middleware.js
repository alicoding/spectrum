module.exports = function( elasticsearch, es, env ) {

  var request 	= require('request');
return {

	getAuthorDetails: function ( req, res, next ) {

		var name = req.params.id;

		es.get({index: 'spectrum', type:'author', id: "1"}, function(err, result) {
			if(err) {
				res.status(404)
				return res.render("error.html", {message: err.message, code: 404 } );
			}
			res.render( "author.html",{fullName:result._source.fullName,author:result._source.author,
				email:result._source.email,authorDesc:result._source.authorDesc});
		});

	},

  getAuthorSetting: function ( req, res, next ) {
    
    es.get({index: 'spectrum', type:'author', id: "1"}, function(err, result) {
    	console.log(err);
			if(err) {
				return res.render("error.html", {message: "user not exist", code: 404 } );
			}
			res.send({fullName:result._source.fullName,author:result._source.author,
				email:result._source.email,authorDesc:result._source.authorDesc});
		});
  },  

  	getPost: function( req, res, next ) {
    var _id = req.params.id;

		es.get({index: 'spectrum', type:'post', id: _id}, function(err, result) {
			if(err) {
				return res.render("error.html", {message: "page not found :(", code: 404 } );
			}
			res.render("single.html", result);
		});
	},

	getRecentPost: function ( req, res, next ) {

		es.queryAll({index:"spectrum", type:"post"}, function(err, result) {
			if(err) {
				return res.render("error.html", err.message);
			}
			var content = result.hits;
			res.render("index.html", content);
		});
		

	},

  saveAuthorSetting: function ( req, res, next ) {
    
    var parsed = req.body; 
		es.add({index: 'spectrum', type:'author', id:parsed.author}, {fullName:parsed.fullName,author:parsed.author,
			email:parsed.email,authorDesc:parsed.authorDesc, refresh: true},
		 function(err, result) {
			if(err) {
				return res.send(err);
			}
		});
  },	

  createPost: function( req,  res ){
	var title = req.params.id;
		es.add({index: 'spectrum', type:'post', id:title}, 
			{content:"Ali", author:"Hello world", email: "ali@ali.com",
			postedOn: Date.now(), refresh: true}, function(err, result) {
			if(err) {
				return res.send(err);
			}
			console.log(result);
			res.render("single.html", result);
		});

},
	// use this with extreme careful 
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