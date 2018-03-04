var webpack = require('webpack');
var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('@happypack/test-utils');
const {
  assert,
  createIntegrationSuite,
  composeWebpackConfig,
} = TestUtils

describe('[Integration] config - @threadPool (with preLoaders and postLoaders)', function() {
  var testSuite = createIntegrationSuite(this);
  var threadPool = HappyPlugin.ThreadPool({ size: 2, });
  var compiler;

  beforeEach(function() {
    var sinon = testSuite.getSinonSandbox();

    sinon.spy(threadPool, 'start');
    // sinon.spy(threadPool, 'get');
    sinon.spy(threadPool, 'stop');

    var loader = testSuite.createLoader(function(s) { return s; });
    var preLoader = testSuite.createLoader(function(s) { return s; });

    var files = [
      testSuite.createFile('src/a.js', "require('./b')"),
      testSuite.createFile('src/b.js', "require('./c');\nrequire('./d');"),
      testSuite.createFile('src/c.js', ""),
      testSuite.createFile('src/d.js', "console.log('success');"),
    ];
    var config = composeWebpackConfig([
      ['*', {
        entry: {
          main: files[0].path
        },

        output: {
          filename: '[name].js',
          path: testSuite.createDirectory('dist').path,
        },

        plugins: [
          new HappyPlugin({
            id: 'main',
            verbose: false,
            loaders: [ loader.path ],
            threadPool: threadPool
          }),

          new HappyPlugin({
            id: 'pre',
            verbose: false,
            loaders: [ preLoader.path ],
            threadPool: threadPool
          })
        ]
      }],

      ['module.loader', {
        test: /.js$/,
        loader: TestUtils.HAPPY_LOADER_PATH + '?id=main',
        include: [
          testSuite.resolve('src')
        ]
      }],

      ['module.preLoader', {
        test: /.js$/,
        loader: TestUtils.HAPPY_LOADER_PATH + '?id=pre',
        include: [
          testSuite.resolve('src')
        ]
      }],

      ['mode', 'development'],
      ['devtool', false],
    ])

    compiler = webpack(config);
  });

  afterEach(function() {
    assert(!threadPool.isRunning());
  });

  it('works', function(done) {
    compiler.run(function(err, rawStats) {
      if (TestUtils.assertNoWebpackErrors(err, rawStats, done)) {
        return;
      }

      done();
    });
  });
});