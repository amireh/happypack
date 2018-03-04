var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('@happypack/test-utils');
var webpack = require('webpack');
const {
  assert,
  createIntegrationSuite,
  composeWebpackConfig,
} = TestUtils

describe('[Integration] config - @threadPool', function() {
  var testSuite = createIntegrationSuite(this);
  var threadPool = HappyPlugin.ThreadPool({ size: 3, });

  beforeEach(function(done) {
    var sinon = testSuite.getSinonSandbox();

    sinon.spy(threadPool, 'start');
    // sinon.spy(threadPool, 'get');
    sinon.spy(threadPool, 'stop');

    sinon.stub(console, 'log');
    sinon.stub(console, 'info');

    var loader = testSuite.createLoader(function(s) { return s; });

    var file1 = testSuite.createFile('src/a.js', "require('./b.jsx')");
    var file2 = testSuite.createFile('src/b.jsx', "console.log('hello!');");

    var compiler = webpack(composeWebpackConfig([
      ['entry', {
        main: [
          file1.path,
          file2.path,
        ]
      }],

      ['output', {
        filename: '[name].js',
        path: testSuite.createDirectory('dist').path,
      }],

      ['loader', {
        test: /.js$/,
        loader: TestUtils.HAPPY_LOADER_PATH + '?id=js'
      }],

      ['loader', {
        test: /.jsx$/,
        loader: TestUtils.HAPPY_LOADER_PATH + '?id=jsx'
      }],

      ['plugin', [
        new HappyPlugin({
          id: 'js',
          verbose: true,
          debug: true,
          loaders: [ loader.path ],
          threadPool: threadPool
        }),
      ]],

      ['plugin', [
        new HappyPlugin({
          id: 'jsx',
          verbose: false,
          loaders: [ loader.path ],
          threadPool: threadPool
        })
      ]],

      ['mode', 'development'],
      ['devtool', false],
    ]));

    compiler.run(function(err, rawStats) {
      if (TestUtils.assertNoWebpackErrors(err, rawStats, done)) {
        return;
      }

      done();
    });
  });

  afterEach(function() {
    assert(!threadPool.isRunning());
  });

  it('waits until the pool is started', function() {
    assert.calledTwice(threadPool.start);
  });

  // it('uses it', function() {
  //   assert.calledTwice(threadPool.get);
  // });

  it('stops the pool when it is done', function() {
    assert.calledTwice(threadPool.stop);
  });
});