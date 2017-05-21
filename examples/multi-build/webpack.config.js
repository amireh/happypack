var path = require('path');
var HappyPack = require('../../');
var happyThreadPool = HappyPack.ThreadPool({ size: 2 });

module.exports = [
  {
    entry: { client: path.resolve(__dirname, 'lib/a.js') },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js'
    },

    plugins: [
      new HappyPack({
        id: 'client',
        compilerId: '1',
        loaders: [{ path: path.resolve(__dirname, 'identity-loader.js') }],
        threadPool: happyThreadPool,
      })
    ],

    module: {
      loaders: [
        {
          test: /\.js$/,
          loader: path.resolve(__dirname, '../../loader') + '?id=client&compilerId=1'
        }
      ]
    }
  },
  {
    entry: { server: path.resolve(__dirname, 'lib/b.js') },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js'
    },

    plugins: [
      new HappyPack({
        id: 'server',
        compilerId: '2',
        loaders: [{ path: path.resolve(__dirname, 'identity-loader.js') }],
        threadPool: happyThreadPool,
      })
    ],

    module: {
      loaders: [
        {
          test: /\.js$/,
          loader: path.resolve(__dirname, '../../loader') + '?id=server&compilerId=2'
        }
      ]
    }
  },

]