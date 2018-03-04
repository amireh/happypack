var { webpackVersion } = require('@happypack/webpack-config-composer');

module.exports = function multiWebpackAssert(specs) {
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