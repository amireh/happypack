var path = require('path');
var rootFragments = [ __dirname, '../../../../' ];
var resolve = path.resolve.bind(path);

exports.join = function() {
  var relativePath = Array.prototype.slice.call(arguments);

  return resolve.apply(null, rootFragments.concat(relativePath));
};
