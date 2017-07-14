var path = require('path');
var webpack = require('webpack');
var HappyPack = require('../../');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var composeWebpackConfig = require('../composeWebpackConfig');
var happyThreadPool = HappyPack.ThreadPool({ size: 5 });
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
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  resolve: {
    extensions: [ '', '.less', '.scss', '.js' ],
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: path.resolve(__dirname, '../../loader') + '?id=js'
      }, {
        test: /\.less$/,
        loader: extract({
          fallback: 'style-loader',
          use: path.resolve(__dirname, '../../loader') + '?id=less'
        })
      }, {
        test: /\.scss$/,
        loader: extract({
          fallback: 'style-loader',
          use: path.resolve(__dirname, '../../loader') + '?id=sass'
        })
      }
    ]
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new ExtractTextPlugin('styles.css'),
    createHappyPlugin('js', ['babel-loader']),
    createHappyPlugin('less', ['css-loader!less-loader']),
    createHappyPlugin('sass', ['css-loader!sass-loader'])
  ]
})

function createHappyPlugin(id, loaders) {
  return new HappyPack({
    id: id,
    loaders: loaders,
    threadPool: happyThreadPool,

    // make happy more verbose with HAPPY_VERBOSE=1
    verbose: process.env.HAPPY_VERBOSE === '1',
  });
}
