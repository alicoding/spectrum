var
  elasticsearch = require('elasticsearch'),
  config = {
    _index : 'spectrum',
    _type: 'post'
  },
  es = elasticsearch(config);

es.indices.exists(function (err, data) {
  if (err) {
    console.log(err);
    return;
  }

  if (!data.exists) {
    es.indices.createIndex(function (err, data) {
      // response here
    });
  }
});

module.exports = es;
