var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var webpack = require('webpack');
var composeWebpackConfig = require('../composeWebpackConfig');
var webpackVersion = require('../webpackVersion')

function extract(options) {
  if (webpackVersion.match(/^1/)) {
    return ExtractTextPlugin.extract(options.fallback, options.use)
  }
  else {
    return ExtractTextPlugin.extract(options);
  }
}

module.exports = composeWebpackConfig({
  context: path.resolve(__dirname),
  entry: path.resolve(__dirname, 'src/index.js'),
  output: {
    path: path.resolve(__dirname, 'dist--raw'),
    filename: '[name].js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel'
      }, {
        test: /\.less$/,
        loader: extract({
          fallback: 'style',
          use: 'css!less'
        })
      }, {
        test: /\.scss$/,
        loader: extract({
          fallback: 'style',
          use: 'css!sass'
        })
      }
    ]
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new ExtractTextPlugin('styles.css'),
  ]
})
