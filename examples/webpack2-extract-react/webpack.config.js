var path = require('path');
var webpack = require('webpack');
var HappyPack = require('../../');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var happyThreadPool = HappyPack.ThreadPool({ size: 5 });

module.exports = {
  entry: path.resolve(__dirname, 'src/index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: path.resolve(__dirname, '../../loader') + '?id=js'
      }, {
        test: /\.less$/,
        loader: ExtractTextPlugin.extract({
          fallbackLoader: 'style',
          loader: path.resolve(__dirname, '../../loader') + '?id=less'
        })
      }, {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract({
          fallbackLoader: 'style',
          loader: path.resolve(__dirname, '../../loader') + '?id=sass'
        })
      }
    ]
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new ExtractTextPlugin('styles.css'),
    createHappyPlugin('js', ['babel']),
    createHappyPlugin('less', ['css!less']),
    createHappyPlugin('sass', ['css!sass'])
  ]
}

function createHappyPlugin(id, loaders) {
  return new HappyPack({
    id: id,
    loaders: loaders,
    threadPool: happyThreadPool,

    // disable happy caching with HAPPY_CACHE=0
    cache: process.env.HAPPY_CACHE !== '0',

    // make happy more verbose with HAPPY_VERBOSE=1
    verbose: process.env.HAPPY_VERBOSE === '1',
  });
}
