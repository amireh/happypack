const path = require('path');
const e = require('@happypack/example-utils')
const { HappyPack } = e;

module.exports = {
  context: path.resolve(__dirname),
  entry: e.resolve(module, 'lib/index.scss'),

  output: {
    path: e.outputDir(module),
    filename: '[name].js'
  },

  plugins: [
    new HappyPack({
      loaders: [ 'style!css?modules&importLoaders=2&sourceMap&localIdentName=[local]___[hash:base64:5]!autoprefixer?browsers=last 2 version!sass?outputStyle=expanded&sourceMap&' ],
      threads: 2
    })
  ],

  module: {
    loaders: [
      {
        test: /\.scss$/,
        loader: e.happyLoader
      }
    ]
  }
}
