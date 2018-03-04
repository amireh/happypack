const path = require('path');
const e = require('@happypack/example-utils');
const { HappyPack } = e;

module.exports = {
  context: path.resolve(__dirname),
  entry: e.resolve(module, 'lib/index.js'),

  output: {
    path: e.outputDir(module),
    filename: '[name].js'
  },

  plugins: [
    new HappyPack({
      threads: 2,
      loaders: [
        'json'
      ]
    }),
  ],

  module: {
    loaders: [
      {
        test: /\.json$/,
        loader: e.happyLoader,
      },
    ],
  }
}
