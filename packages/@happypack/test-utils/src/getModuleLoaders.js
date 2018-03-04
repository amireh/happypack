var { webpackVersion } = require('@happypack/webpack-config-composer');
var VERSION_ANY = '*';
var VERSION_1 = /^1/;
var VERSION_2 = /^2/;
var VERSION_3 = /^3/;
var VERSION_4 = /^4/;

module.exports = function getModuleLoaders(compiler) {
  if (versionMatches(webpackVersion)(VERSION_1)) {
    return compiler.options.module.loaders;
  }
  else if (versionMatches(webpackVersion)([ VERSION_2, VERSION_3, VERSION_4 ])) {
    return compiler.options.module.rules;
  }
}

function versionMatches(version) {
  return function(versionStrings) {
    return [].concat(versionStrings).some(function(versionString) {
      if (versionString === VERSION_ANY) {
        return true;
      }

      return version.match(versionString);
    })
  }
}
