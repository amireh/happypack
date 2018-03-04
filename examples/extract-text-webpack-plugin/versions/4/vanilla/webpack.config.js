const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const e = require('@happypack/example-utils')

module.exports = {
  mode: 'development',
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
    rules: [
      {
        test: /\.less$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader!less-loader'
        })
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader!sass-loader'
        })
      }
    ]
  },

  plugins: [
    new ExtractTextPlugin('[name].css')
  ],
}
