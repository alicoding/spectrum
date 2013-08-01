
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Article = mongoose.model('Article')
  , utils = require('../../lib/utils')
  , _ = require('underscore')
  , path = require('path')
  , fs = require("fs")
  , crypto = require('crypto')
  , exec = require('child_process').exec
  , child;


/**
 * Load
 */

exports.load = function(req, res, next, id){
  var User = mongoose.model('User')

  Article.load(id, function (err, article) {
    if (err) return next(err)
    if (!article) return next(new Error('not found'))
    req.article = article
    next()
  })
}

/**
 * List
 */

exports.index = function(req, res){
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1
  var perPage = 10
  var options = {
    perPage: perPage,
    page: page
  }

  Article.list(options, function(err, articles) {
    if (err) return res.render('500')
    Article.count().exec(function (err, count) {
      res.render('articles/index.html', {
        title: 'Articles',
        articles: articles,
        page: page + 1,
        pages: Math.ceil(count / perPage)
      })
    })
  })
}

/**
 * New article
 */

exports.new = function(req, res){
  res.render('articles/new.html', {
    title: 'New Article',
    article: new Article({})
  })
}

/**
 * Create an article
 */

exports.create = function (req, res) {
  var article = new Article(req.body);
  article.user = req.user;

  article.save(function (err) {
    if (!err) {
      req.flash('success', 'Successfully created article!');
      return res.json(200, {url: article._id});
    }
  });
}

/**
 * Edit an article
 */

exports.edit = function (req, res) {

  htmlToMD(req.article.body, fileNameGenerator(), function (data) {
    req.article.body = data;
    res.render('articles/edit.html', {
      title: 'Edit ' + req.article.title,
      article: req.article,
      mode: "edit"
    });
  });
}

/**
 * Update article
 */

exports.update = function(req, res){
  var article = req.article
  article = _.extend(article, req.body)

  article.save(function(err) {
    if (!err) {
      req.flash('success', 'Your article has been updated!');
      return res.json(200, {url: article._id});
    }
  });
}

/**
 * Show
 */

exports.show = function(req, res){
  res.render('articles/show.html', {
    title: req.article.title,
    article: req.article
  })
}

/**
 * Delete an article
 */

exports.destroy = function(req, res){
  var article = req.article
  article.remove(function(err){
    req.flash('info', 'Deleted successfully')
    res.redirect('/')
  })
}

exports.editorPreview = function (req, res){
  var data = req.body.text;

    parseToHTML(data, fileNameGenerator(), function (err, data) {
      if(err) {
        return res.json(err);
      }
      return res.json(data);
    });
}

  function fileNameGenerator () {
    return path.join(__dirname + crypto.randomBytes(4).readUInt32LE(0));
  }

function htmlToMD (data, filename, callback) { 

    fs.writeFile(filename, data, function (err) {
      if (err) throw err;
      child = exec('kramdown -i html ' + filename + ' -o kramdown', function (error, stdout, stderr) {
        if (error) {
          callback(500);
        }
        fs.unlink(filename, function (err) {
          if (err) throw err;
        });
        callback(stdout);
      });
    });
  }  

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
