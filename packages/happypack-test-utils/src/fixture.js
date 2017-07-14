var fs = require('fs');
var fixturePath = require('./fixturePath');

module.exports = function fixture(fileName) {
  return fs.readFileSync(fixturePath(fileName), 'utf-8');
};
