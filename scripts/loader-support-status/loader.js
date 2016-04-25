var fs = require('fs');

module.exports = function(s) {
  var attrs = {};

  for (var key in this) {
    attrs[key] = typeof this[key];
  }

  fs.writeFileSync(this.query.match(/out=(.*)/)[1], JSON.stringify(attrs));

  return s;
};