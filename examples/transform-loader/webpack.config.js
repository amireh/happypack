var path = require('path');
var through = require('browserify-through');
var HappyPack = require('../../');

module.exports = {
  entry: path.resolve(__dirname, 'lib/index.js'),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },

  module: {
    // postLoaders: [
    //   {
    //     loader: "transform?brfs"
    //   }
    // ],
    loaders: [
      {
        test: /\.js$/,
        loader: path.resolve(__dirname, '../../loader') + '?id=brfs',
        include: [ path.resolve(__dirname, 'lib') ]
      },
      {
        test: /\.coffee$/,
        loader: path.resolve(__dirname, '../../loader') + '?id=coffee',
        include: [ path.resolve(__dirname, 'lib') ]
      },
    ]
  },

  plugins: [
    new HappyPack({
      id: 'coffee',
      threads: 2,
      loaders: [ 'transform?coffeeify' ],
      cache: process.env.HAPPY_CACHE === '1'
    }),

    new HappyPack({
      id: 'brfs',
      threads: 2,
      loaders: [ 'transform?brfs' ],
      cache: process.env.HAPPY_CACHE === '1'
    })
  ],

  transforms: [
    // TODO
    function(file) {
    }
  ]
};