module.exports = function( es, app ) {

	var request 	= require('request'),
	slug 					= require('slug'),
  fs 						= require('fs'),
  path 					= require('path'),
	markdown 			= require("node-markdown").Markdown;

	var functions = {};

	functions.getAuthorDetails = function ( req, res, next ) {

		var name = req.params.id;

		es.get({_index: 'spectrum', _type:'post', _id:"abcd"}, function(err, result) {
			if(err) {
				res.status(404)
				return res.render("error.html", {message: err.message, code: 404 } );
			}
			var content = objectBeautifier(result);
			res.render( "author.html",content);
		});
	};

	functions.getAuthorSetting = function ( req, res, next ) {

		es.get({_id: "abcd"}, function(err, result) {
			if(err) {
				return res.render("error.html", {message: "user not exist", code: 404 } );
			}
			var content = objectBeautifier(result);
			res.send(content);
		});
	};

	functions.getPost = function( req, res, next ) {

		var id = req.params.id;
		console.log(id);
		es.get({ _id: id}, function(err, result) {
			if(err) {
				return res.render("error.html", {message: '"' + id + '"' + " Does not exist :(", code: 404 } );
			}
			var content = objectBeautifier(result);
			res.render("single.html", content);
		});
	};

	functions.getRecentPost = function ( req, res, next ) {

		var _page = req.params.page-1 || 0;

		// handle bad page number request
		if (_page < 0 ) {
			return res.redirect('/');
		}

		var query = { sort : { _postedOn : { order : "desc" }}, from:_page, size:"10" };

		es.search(query, function (err, data) {
			if(err) {
				return res.redirect('/new/post');
			}
			console.log(data.hits.hits);
			var content = objectBeautifier(data.hits.hits);
    	// if the page requested doesn't have any data redirect them to the home page
    	if (!content.posts.length) {
    		return res.redirect('/');
    	};
    	content.hasPrevious = hasPreviousPage(_page);
    	hasNextPage(content, _page, content.posts.length, function (data) {

    		content.hasNext = data;
    		content.nextPage = _page + 2;
    		content.prevPage = _page;
    		return res.render("index.html", content);

    	});
    });
	};

	functions.createPost = function( req,  res ){
				
		var content = req.body.data,
		title   = req.body.title,
		url 		= slug(req.body.url);
		
		es.exists({"_index":"spectrum","_type":"post","_id":url}, function (err, data) {
			if ( err ) {
				console.log(err.message);
		}
		if(!data.exists) {
					es.index({_id:url}, 
		{
			_author: "Hello world", 
			_content: content,  
			_email: "ali@ali.com",
			_postedOn: Date.now(),
			_title: title,
			_url: url
		}, 

		function(err, result) {
			if(err) {
				return res.send(err.message);
			}
			return res.json(200, { message: "ok", url:url });
		});
		} else {
			res.json (401, { message: "title already exist", url:url });
		}
		});

	};

	function objectBeautifier ( content ) {

		var newObject = {},
		arrayObject = [];
		if (content instanceof Array) {
			content.forEach(function(item) { 
				newObject = {
					title: item._source._title,
					url: item._source._url,
					content: markdown(item._source._content),
					email: item._source._email,
					author: item._source._author,
					postedOn: item._source._postedOn
				}
				arrayObject.push(newObject);
			});
			return {posts:arrayObject};
		}	
		else {
			newObject = {
				title: content._source._title,
				content: markdown(content._source._content),
				email: content._source._email,
				author: content._source._author,
				postedOn: content._source._postedOn,
				url: content._source._url
			}
			return newObject;
		}
	};

	function hasNextPage (content, pageNum, totalPost, callback) {

		var query = { sort : { _postedOn : { order : "desc" }}, from:pageNum+2, size:"2" };
		es.search(query, function (err, data) {			
			if(data.hits.hits.length) {
				return callback(true);
			}
			return callback(false);
		});
	};

	function hasPreviousPage ( pageNum ) {
		
		if ( pageNum > 0 ) { return true; }

	};

	// use this with extreme careful 
	functions.dropEScontent = function ( req, res, next ) {

		es.indices.deleteIndex({_index: 'spectrum'}, function (err, result) {
			if (err) {
				res.send (err.message);
			}
		});
	};

	functions.saveAuthorSetting = function ( req, res, next ) {

		console.log("he");

};	

	functions.editPost = function ( req, res ) {

		var url = req.params.id;
		app.locals.editParam = true;

		es.exists({"_index":"spectrum","_type":"post","_id":url}, function (err, data) { 

			if(err) {
				return res.render("error.html", {message: err.message ,code: 500 } );
			}
			if(!data.exists){
				return res.redirect('/new/post');
			}
					
			es.get({ _id: url}, function(err, result) {
				res.render("editor/index.html", {
					content: result._source._content,
					title: result._source._title 
				});
			});
		});
	};	

	functions.publishEditPost = function ( req, res ) {


		var content = req.body.data,
		title   = req.body.title,
		url 		= slug(req.body.url);

							es.index({_id:url}, 
		{
			_author: "Hello world", 
			_content: content,  
			_email: "ali@ali.com",
			_postedOn: Date.now(),
			_title: title,
			_url: url
		}, 

		function(err, result) {
			if(err) {
				return res.send(err.message);
			}
			return res.json(200, { message: "ok", url:url });
		});
	};

return functions;
};

