var path = require('path');
var composeWebpackConfig = require('../composeWebpackConfig');

module.exports = composeWebpackConfig({
  context: path.resolve(__dirname),
  entry: path.resolve(__dirname, 'lib/a.js'),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].raw.js'
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        include: [ path.resolve(__dirname, 'lib') ],
        loaders: [ 'cache-loader', 'babel-loader?presets[]=es2015&presets[]=react' ],
      }
    ]
  }
});