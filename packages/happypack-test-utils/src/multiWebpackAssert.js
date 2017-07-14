var getWebpackVersion = require('webpack-config-composer').getWebpackVersion;

module.exports = function multiWebpackAssert(specs) {
  var webpackVersion = getWebpackVersion();

  specs
    .filter(function(x) {
      return [].concat(x[0]).some(function(versionString) {
        return webpackVersion.match(versionString);
      })
    })
    .forEach(function(x) {
      x[1]();
    })
  ;
}