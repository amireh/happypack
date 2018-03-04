const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const e = require('@happypack/example-utils')

module.exports = {
  devtool: false,
  context: path.resolve(__dirname),

  entry: {
    sass: path.join(e.exampleDir(module), 'src/sass.scss'),
    less: path.join(e.exampleDir(module), 'src/less.less'),
  },

  output: {
    path: e.outputDir(module),
    filename: '[name].js'
  },

  module: {
    loaders: [
      {
        test: /\.less$/,
        loader: ExtractTextPlugin.extract('style', 'css!less')
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract('style', 'css!sass')
      }
    ]
  },

  plugins: [
    new ExtractTextPlugin('[name].css')
  ],
}
