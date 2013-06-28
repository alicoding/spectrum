var request = require('request');

module.exports = function (app) {
  return function (req, res) {
    var id = req.params.id;

    request(id, function (error, response, body) {

      app.use(function (err, req, res, next) {
        if (!err.status) {
          err.status = 500;
        }

        res.status(err.status);
        res.render('error.html', {
          message: err.message,
          code: err.status
        });
      });
      app.use(function (req, res, next) {
        res.status(404);
        res.render('error.html', {
          code: 404
        });
      });

      body = {
        title: "HHHH"
      };

      if (!body) {
        res.status(404);
        return res.render('error.html', {
          code: 404
        });
      }
      return res.render("single.html", body);

    });
  }
};