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
        use: [{ path: e.resolve(module, 'identity-loader.js') }],
        threadPool: happyThreadPool,
      })
    ],

    module: {
      rules: [
        {
          test: /\.js$/,
          use: e.happyLoader + '?id=client&compilerId=1'
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
        use: [{ path: e.resolve(module, 'identity-loader.js') }],
        threadPool: happyThreadPool,
      })
    ],

    module: {
      rules: [
        {
          test: /\.js$/,
          use: e.happyLoader + '?id=server&compilerId=2'
        }
      ]
    }
  }),
]