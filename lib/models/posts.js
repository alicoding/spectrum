/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function( environment, mongoInstance ) {

  var mongoosastic = require( "mongoosastic" ),
      validate = require( "mongoose-validator" ).validate,
      deferred = require( "deferred" ),
      env = environment,
      url = require( "url" ),
      mongoose = mongoInstance,
      elasticSearchURL = env.get( "FOUNDELASTICSEARCH_URL" ) ||
                         env.get( "BONSAI_URL" ) ||
                         env.get( "ELASTIC_SEARCH_URL" );

      elasticSearchURL = url.parse( elasticSearchURL );

  // Schema
  var postDetails = new mongoose.Schema({
    _id: {
      type: String,
      required: true,
      es_indexed: true,
      unique: true,
      es_index: "not_analyzed"
    },
    title: {
      type: String,
      es_indexed: true,
      required: true
    },
    content: {
      type: String,
      es_indexed: true,
      required: true
    },
    thumbnail: {
      type: String,
      es_indexed: true,
      es_index: "not_analyzed"
    },    
    author: {
      type: String,
      required: true,
      es_indexed: true,
      es_index: "not_analyzed"
    },
    published: {
      type: Boolean,
      "default": true,
      es_index: "not_analyzed"
    },
    tags: {
      type: [ String ],
      es_indexed: true,
      es_index: "not_analyzed",
      es_type: "String"
    },
    categories: {
      type: [ String ],
      es_indexed: true,
      es_index: "not_analyzed",
      es_type: "String"
    },    
    date: {
      type: Date,
      "default": Date.now,
      es_indexed: true,
      es_type: "date"
    },
  });

  var authorDetails = new mongoose.Schema({
    fullName: {
      type: String,
      required: true,
      es_indexed: true,
    },
    author: {
      type: String,
      required: true,
      es_indexed: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      es_indexed: true,
    },
    authorDesc: {
      type: String,
      required: true,
      es_indexed: true,
    }
})

  postDetails.set( "toJSON", { virtuals: true } );
  authorDetails.set( "toJSON", { virtuals: true } );

  postDetails.virtual( "id" ).get(function() {
    return this._id;
  });
  authorDetails.virtual( "id" ).get(function() {
    return this._id;
  });

  postDetails.plugin( mongoosastic, {
    port: elasticSearchURL.port || 80,
    host: ( elasticSearchURL.auth ? elasticSearchURL.auth + "@" : "" ) + elasticSearchURL.hostname,
    hydrate: true
  });

  authorDetails.plugin( mongoosastic, {
    port: elasticSearchURL.port || 80,
    host: ( elasticSearchURL.auth ? elasticSearchURL.auth + "@" : "" ) + elasticSearchURL.hostname,
    hydrate: true
  });  

  var post = mongoose.model( "post", postDetails );
  var author = mongoose.model( "author", authorDetails );

  post.createMapping(function( err, mapping ) {
    if ( err ) {
      console.log( "failed to create mapping", err.toString() );
    }
  });
  author.createMapping(function( err, mapping ) {
    if ( err ) {
      console.log( "failed to create mapping", err.toString() );
    }
  });  

  // Synchronize existing posts with Elastic Search
  post.synchronize();
  author.synchronize();

  post.publicFields = [ "_id", "title", "content", "published", "tags",
                        "thumbnail", "categories" ];
  author.publicFields = [ "fullName", "author", "email", "author", "authorDesc" ];

  return [post,author];
};
