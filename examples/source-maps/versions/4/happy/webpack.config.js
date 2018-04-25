const path = require('path');
const e = require('@happypack/example-utils');
const { HappyPack } = e;

module.exports = ({
  context: path.resolve(__dirname),
  entry: e.resolve(module, 'lib/a.js'),
  mode: 'development',
  devtool: 'source-map',

  output: {
    path: e.outputDir(module),
    filename: '[name].js'
  },

  plugins: [
    new HappyPack({
      use: [
        e.resolve(module, 'identity-loader.js'),
        'babel-loader',
      ],
      threads: 2
    })
  ],

  module: {
    rules: [
      {
        test: /\.js$/,
        use: [ e.happyLoader ]
      }
    ]
  }
});