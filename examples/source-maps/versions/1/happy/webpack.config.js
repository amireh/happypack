const path = require('path');
const e = require('@happypack/example-utils');
const { HappyPack } = e;

module.exports = ({
  context: path.resolve(__dirname),
  entry: e.resolve(module, 'lib/a.js'),
  devtool: 'source-map',

  output: {
    path: e.outputDir(module),
    filename: '[name].js'
  },

  plugins: [
    new HappyPack({
      loaders: [
        e.resolve(module, 'identity-loader.js'),
        'babel',
      ],
      threads: 2
    })
  ],

  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: [ e.happyLoader ]
      }
    ]
  }
});