var path = require('path');
var composeWebpackConfig = require('../composeWebpackConfig');

module.exports = composeWebpackConfig({
  context: path.resolve(__dirname),
  entry: path.resolve(__dirname, 'lib/a.js'),
  devtool: 'source-map',

  output: {
    path: path.resolve(__dirname, 'dist--raw'),
    filename: '[name].js'
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: [
          require.resolve('./identity-loader.js'),
          'babel'
        ]
      }
    ]
  }
});