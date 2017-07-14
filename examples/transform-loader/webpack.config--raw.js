var path = require('path');
var composeWebpackConfig = require('../composeWebpackConfig');

module.exports = composeWebpackConfig({
  context: path.resolve(__dirname),
  entry: path.resolve(__dirname, 'lib/index.js'),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].raw.js'
  },

  module: {
    postLoaders: [
      {
        loader: "transform?brfs"
      }
    ],
    loaders: [
      {
        test: /\.js$/,
        include: [ path.resolve(__dirname, 'lib') ],
        loaders: ["transform?brfs"],
      },
      {
        test: /\.coffee$/,
        include: [ path.resolve(__dirname, 'lib') ],
        loader: "transform?coffeeify"
      },
    ]
  }
});