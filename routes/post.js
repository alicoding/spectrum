var request = require('request');

exports.getPost = function (req, res) {
    var id = req.params.id;

    request(id, function (error, response, body) {
    	if (error) {
			return res.render( 'error.html', { code: 500, message: error });
    	}
    	if (!body) {
    		return res.render( 'error.html', { code: 404, message: "Page not found :(" });
    	}
		var parsed = JSON.parse(body);   

      if (!body) {
        res.status(404);
        return res.render('error.html', {
          code: 404
        });
      }
      return res.render("single.html", body);

    });
};

exports.create = function(req,res){

      return res.render("single.html", {title:"You are about to create a post"});


};