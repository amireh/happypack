const path = require('path');
const e = require('@happypack/example-utils');
const { HappyPack } = e;
const happyThreadPool = HappyPack.ThreadPool({ size: 2 });

module.exports = [
  ({
    context: path.resolve(__dirname),
    entry: { client: e.resolve(module, 'lib/a.js') },

    output: {
      path: e.outputDir(module),
      filename: '[name].js'
    },

    plugins: [
      new HappyPack({
        id: 'client',
        compilerId: '1',
        loaders: [{ path: e.resolve(module, 'identity-loader.js') }],
        threadPool: happyThreadPool,
      })
    ],

    module: {
      loaders: [
        {
          test: /\.js$/,
          loader: e.happyLoader + '?id=client&compilerId=1'
        }
      ]
    }
  }),

  ({
    context: path.resolve(__dirname),
    entry: { server: e.resolve(module, 'lib/b.js') },

    output: {
      path: e.outputDir(module),
      filename: '[name].js'
    },

    plugins: [
      new HappyPack({
        id: 'server',
        compilerId: '2',
        loaders: [{ path: e.resolve(module, 'identity-loader.js') }],
        threadPool: happyThreadPool,
      })
    ],

    module: {
      loaders: [
        {
          test: /\.js$/,
          loader: e.happyLoader + '?id=server&compilerId=2'
        }
      ]
    }
  }),
]