var webpackVersion = require('webpack/package.json').version;

module.exports = function getWebpackVersion() {
  return webpackVersion;
}