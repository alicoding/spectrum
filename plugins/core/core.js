var fs = require('fs')
  , path = require('path')
  , request = require('request')
  , qs = require('querystring')
  , markdown = require('node-markdown').Markdown
  // , phantomjs = require('phantomjs')
  // , child = require('child_process')

exports.Core = (function(){
  
  function _generateRandomMdFilename(ext){
    return 'spectrum_' +(new Date()).toISOString().replace(/[\.:-]/g, "_")+ '.' + ext
  }
  
  function _getHtml(str){
    return markdown(str) 
  }

  return {
    fetchHtmlDirect: function(req,res){
      var unmd = req.body.unmd
        , json_response = 
        {
          data: ''
        , error: false
        };
      var html = _getHtml(req.body.unmd)  ;

      json_response.data = html;
      res.json( json_response );
    }
  }
  
})()
