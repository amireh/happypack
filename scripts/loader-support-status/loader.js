var fs = require('fs-extra');
var path = require('path');

module.exports = function(s) {
  var attrs = extractProperties(this);
  var filePath = path.resolve(this.query.match(/out=(.*)/)[1]);

  fs.ensureDirSync(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(attrs));

  return s;
};

function extractProperties(object, level) {
  var attrs = {};

  for (var key in object) {
    attrs[key] = typeof object[key];
  }

  return attrs;
}