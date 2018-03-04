const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const e = require('@happypack/example-utils');
const { HappyPack } = e;

const happyThreadPool = HappyPack.ThreadPool({ size: 5 });

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
    rules: [
      {
        test: /\.less$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: e.happyLoader + '?id=less'
        })
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: e.happyLoader + '?id=sass'
        })
      }
    ]
  },

  plugins: [
    new ExtractTextPlugin('[name].css'),
    createHappyPlugin('less', ['css-loader!less-loader']),
    createHappyPlugin('sass', ['css-loader!sass-loader'])
  ],
}

function createHappyPlugin(id, loaders) {
  return new HappyPack({
    id: id,
    loaders: loaders,
    threadPool: happyThreadPool,
    verbose: false,
  });
}
