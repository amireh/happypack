const path = require('path');
const e = require('@happypack/example-utils');

module.exports = ({
  context: path.resolve(__dirname),
  entry: e.resolve(module, 'lib/a.js'),
  devtool: 'source-map',

  output: {
    path: e.outputDir(module),
    filename: '[name].js'
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: [
          e.resolve(module, 'identity-loader.js'),
          'babel'
        ]
      }
    ]
  }
});