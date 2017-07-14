var composer = require('webpack-config-composer');

module.exports = function composeWebpackConfig(webpack1Config) {
  return composer.fromWebpack1(require('webpack/package.json').version, webpack1Config);
}