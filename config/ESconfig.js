var
  elasticsearch = require('elasticsearch'),
  config = {
    _index : 'spectrum',
    _type: 'post'
  },
  es = elasticsearch(config);

es.indices.exists(config, function (err, data) {
  if (err) {
    es.indices.createIndex(function (err, data) {
    });
  }
});

module.exports = es;
