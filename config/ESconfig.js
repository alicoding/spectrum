var
  elasticsearch = require('elasticsearch'),
  config = {
    _index : 'spectrum',
    _type: 'post'
  },
  es = elasticsearch(config);


var options = { _index : "spectrum", _type: "post" },
mapping = {


"spectrum" : {
    "post" : {
      "properties" : {
        "author" : {
          "type" : "string",
          "index" : "not_analyzed",
          "omit_norms" : true,
          "index_options" : "docs"
        },
        "contentType" : {
          "type" : "string",
          "index" : "not_analyzed",
          "omit_norms" : true,
          "index_options" : "docs"
        },
        "createdAt" : {
          "type" : "long"
        },
        "deletedAt" : {
          "type" : "long"
        },
        "description" : {
          "type" : "string"
        },
        "email" : {
          "type" : "string",
          "index" : "not_analyzed",
          "omit_norms" : true,
          "index_options" : "docs"
        },
        "locale" : {
          "type" : "string",
          "index" : "not_analyzed",
          "omit_norms" : true,
          "index_options" : "docs"
        },
        "published" : {
          "type" : "object"
        },
        "remixedFrom" : {
          "type" : "string",
          "index" : "not_analyzed",
          "omit_norms" : true,
          "index_options" : "docs"
        },
        "tags" : {
          "type" : "string",
          "index" : "not_analyzed",
          "omit_norms" : true,
          "index_options" : "docs"
        },
        "thumbnail" : {
          "type" : "string",
          "index" : "not_analyzed",
          "omit_norms" : true,
          "index_options" : "docs"
        },
        "title" : {
          "type" : "string"
        },
        "updatedAt" : {
          "type" : "long"
        },
        "url" : {
          "type" : "string",
          "index" : "not_analyzed",
          "omit_norms" : true,
          "index_options" : "docs"
        }
      }
    }
  }

};

es.indices.putMapping(options, mapping, function ( err, result) {
	if(err) {
		return console.log("error" + err.message);
	}
	console.log("succeed");
})


module.exports = es;
