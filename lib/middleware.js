module.exports = function (es, app) {

  var request = require('request'),
  dateformat = require('dateformat'),
  slug = require('slug'),
  util = require('util'),
  path = require('path'),
  fs = require("fs"),
  crypto = require('crypto'),
  exec = require('child_process').exec,
  child;


  var functions = {};

  functions.getAuthorDetails = function (req, res, next) {

    var name = req.params.id;

    es.get({
      _index: 'spectrum',
      _type: 'post',
      _id: "abcd"
    }, function (err, result) {
      if (err) {
        res.status(404)
        return res.render("error.html", {
          message: err.message,
          code: 404
        });
      }
      var content = objectBeautifier(result);
      res.render("author.html", content);
    });
  };

  functions.getAuthorSetting = function (req, res, next) {

    es.get({
      _id: "abcd"
    }, function (err, result) {
      if (err) {
        return res.render("error.html", {
          message: "user not exist",
          code: 404
        });
      }
      objectBeautifier(result, function (content) {
       res.send(content);
     });

    });
  };

  functions.getPost = function (req, res, next) {

    var id = req.params.id;

    es.get({
      _id: id
    }, function (err, result) {
      if (err) {
        return res.render("error.html", {
          message: '"' + id + '"' + " Does not exist :(",
            code: 404
          });
      }

      objectBeautifier(result, function (content) {

        parseToHTML(content.content, fileNameGenerator(), function(data) { 
          content.content = data;
          res.render("single.html", content);
        });
      });      
    });
  };

  functions.getRecentPost = function (req, res, next) {

    var pageNum = req.params.page - 1 || 0;

    // handle bad page number request
    if (pageNum < 0) {
      return res.redirect('/');
    }
    var limit = 10;
    var postFrom = limit * pageNum;
    var query = {
      from: postFrom,
      size: limit,
      sort: {
        _postedOn: {
          order: "desc"
        }
      }
    };

    es.search(query, function (err, data) {
      if (err) {
        return res.redirect('/new/post');
      }
      objectBeautifier(data.hits.hits, function (content) {
        // if the page requested doesn't have any data redirect them to the home page
        if (!content.posts.length) {
          return res.redirect('/');
        };

        content.hasPrevious = hasPreviousPage(pageNum);
        hasNextPage(limit, pageNum, function (data) {

          content.hasNext = data;
          content.nextPage = pageNum + 2;
          content.prevPage = pageNum;
          return res.render("index.html", content);

        });
      });
    });
  };

  functions.createPost = function (req, res) {

    var content = req.body.data,
    title = req.body.title,
    url = slug(req.body.url);

    es.exists({
      "_index": "spectrum",
      "_type": "post",
      "_id": url
    }, function (err, data) {
      if (err) {
        console.log(err.message);
      }
      if (!data.exists) {

        es.index({
          _id: url
        }, {
          _author: "Hello world",
          _content: content,
          _email: "ali@ali.com",
          _postedOn: Date.now(),
          _title: title,
          _url: url
        },

        function (err, result) {
          if (err) {
            return res.send(err.message);
          }
          return res.json(200, {
            message: "ok",
            url: url
          });
        });
      } else {
        res.json(401, {
          message: "title already exist",
          url: url
        });
      }
    });

  };

  function objectBeautifier(content, callback) {

    var newObject = {},
    arrayObject = [];
    if (content instanceof Array) {
      content.forEach(function (item) {
        newObject = {
          title: item._source._title,
          url: item._source._url,
          content: item._source._content,
          email: item._source._email,
          author: item._source._author,
          postedOn: dateformat(item._source._postedOn, "dddd, mmmm dS, yyyy - h:MM:ss TT")
        }
        arrayObject.push(newObject);
      });
      callback({
        posts: arrayObject
      });
    } else {
      newObject = {
        title: content._source._title,
        content: content._source._content,
        email: content._source._email,
        author: content._source._author,
        postedOn: date = dateformat(content._source._postedOn, "dddd, mmmm dS, yyyy - h:MM:ss TT"),
        url: content._source._url
      }
      callback(newObject);
    }
  };

  function hasNextPage(limit, pageNum, callback) {

    var nextPage = limit * (pageNum + 1);
    var query = {
      from: nextPage,
      size: limit,
      sort: {
        _postedOn: {
          order: "desc"
        }
      }
    };
    es.search(query, function (err, data) {

      if (data.hits.hits.length) {
        return callback(true);
      }
      return callback(false);
    });
  };

  function hasPreviousPage(pageNum) {

    if (pageNum > 0) {
      return true;
    }

  };

  // use this with extreme careful 
  functions.dropEScontent = function (req, res, next) {

    es.indices.deleteIndex({
      _index: 'spectrum'
    }, function (err, result) {
      if (err) {
        res.send(err.message);
      }
    });
  };

  functions.saveAuthorSetting = function (req, res, next) {

    console.log("he");

  };

  functions.editPost = function (req, res) {

    var url = req.params.id;

    es.exists({
      "_index": "spectrum",
      "_type": "post",
      "_id": url
    }, function (err, data) {

      if (err) {
        return res.render("error.html", {
          message: err.message,
          code: 500
        });
      }
      if (!data.exists) {
        return res.redirect('/new/post');
      }

      es.get({
        _id: url
      }, function (err, result) {
        res.render("editor/index.html", {
          content: result._source._content,
          title: result._source._title,
          mode: "edit"
        });
      });
    });
  };

  functions.publishEditPost = function (req, res) {


    var content = req.body.data,
    title = req.body.title,
    url = slug(req.body.url);

    es.index({
      _id: url
    }, {
      _author: "Hello world",
      _content: content,
      _email: "ali@ali.com",
      _postedOn: Date.now(),
      _title: title,
      _url: url
    },

    function (err, result) {
      if (err) {
        return res.send(err.message);
      }
      return res.json(200, {
        message: "ok",
        url: url
      });
    });
  };

  function parseToHTML(data, filename, callback) {
    
    fs.writeFile(filename, data, function (err) {
      if (err) throw err;
      child = exec('kramdown ' + filename, function (error, stdout, stderr) {
        if (error) {
          callback(500);
        }
        fs.unlink(filename, function (err) {
          if (err) throw err;
        });
        callback(stdout);
      });
    });
  };

  function fileNameGenerator () {
    return filename = path.join(__dirname + crypto.randomBytes(4).readUInt32LE(0));
  }

  functions.editorPreview = function ( req, res ) {

    var data = req.body.text;

    parseToHTML(data, fileNameGenerator(), function (err, data) {
      if(err) {
        return res.json(err);
      }
      return res.json(data);
    });
  };

  return functions;
};
