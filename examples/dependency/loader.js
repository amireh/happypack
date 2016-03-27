var path = require('path');

module.exports = function(s) {
  this.cacheable();
  console.log('adding deps')
  console.log(this.dependency)
  this.dependency('some-non-existing-file.js');
  this.dependency(path.resolve(__dirname, 'lib/other.js'));

  return s;
};