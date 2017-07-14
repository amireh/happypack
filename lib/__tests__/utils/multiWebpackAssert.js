var webpackVersion = require('webpack/package.json').version;

module.exports = function multiWebpackAssert(specs) {
  specs
    .filter(function(x) { return webpackVersion.match(x[0]) })
    .forEach(function(x) {
      x[1]();
    })
  ;
}