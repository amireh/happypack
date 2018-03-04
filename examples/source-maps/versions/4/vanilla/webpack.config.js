const path = require('path');
const e = require('@happypack/example-utils');

module.exports = ({
  context: path.resolve(__dirname),
  entry: e.resolve(module, 'lib/a.js'),
  devtool: 'source-map',
  mode: 'development',

  output: {
    path: e.outputDir(module),
    filename: '[name].js'
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          e.resolve(module, 'identity-loader.js'),
          'babel-loader'
        ]
      }
    ]
  }
});