var getWebpackVersion = require('webpack-config-composer').getWebpackVersion;
var VERSION_ANY = '*';
var VERSION_1 = /^1/;
var VERSION_2 = /^2/;
var VERSION_3 = /^3/;

module.exports = function getModuleLoaders(compiler) {
  var webpackVersion = getWebpackVersion();

  if (versionMatches(webpackVersion)(VERSION_1)) {
    return compiler.options.module.loaders;
  }
  else if (versionMatches(webpackVersion)([ VERSION_2, VERSION_3 ])) {
    return compiler.options.module.rules;
  }
}

function versionMatches(webpackVersion) {
  return function(versionStrings) {
    return [].concat(versionStrings).some(function(versionString) {
      if (versionString === VERSION_ANY) {
        return true;
      }

      return webpackVersion.match(versionString);
    })
  }
}
