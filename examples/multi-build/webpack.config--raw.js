var path = require('path');
var composeWebpackConfig = require('../composeWebpackConfig')

module.exports = [
  composeWebpackConfig({
    context: path.resolve(__dirname),
    entry: { client: path.resolve(__dirname, 'lib/a.js') },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].raw.js'
    },

    module: {
      loaders: [
        {
          test: /\.js$/,
          loader: path.resolve(__dirname, 'identity-loader.js')
        }
      ]
    }
  }),
  composeWebpackConfig({
    context: path.resolve(__dirname),
    entry: { server: path.resolve(__dirname, 'lib/b.js') },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].raw.js'
    },

    module: {
      loaders: [
        {
          test: /\.js$/,
          loader: path.resolve(__dirname, 'identity-loader.js')
        }
      ]
    }
  }),
];