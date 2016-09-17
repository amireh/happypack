var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('../../HappyTestUtils');
var webpack = require('webpack');
var assert = require('chai').assert;

describe('[Integration] config - @threadPool', function() {
  var testSuite = TestUtils.IntegrationSuite2(this);
  var threadPool = HappyPlugin.ThreadPool({ size: 3, });

  beforeEach(function(done) {
    var sinon = testSuite.getSinonSandbox();

    sinon.spy(threadPool, 'start');
    // sinon.spy(threadPool, 'get');
    sinon.spy(threadPool, 'stop');

    var loader = testSuite.createLoader(function(s) { return s; });

    var file1 = testSuite.createFile('src/a.js', "require('./b.jsx')");
    var file2 = testSuite.createFile('src/b.jsx', "console.log('hello!');");

    var compiler = webpack({
      entry: {
        main: [
          file1.path,
          file2.path,
        ]
      },

      output: {
        filename: '[name].js',
        path: testSuite.createDirectory('dist').path,
      },

      module: {
        loaders: [{
          test: /.js$/,
          loader: TestUtils.HAPPY_LOADER_PATH + '?id=js'
        }, {
          test: /.jsx$/,
          loader: TestUtils.HAPPY_LOADER_PATH + '?id=jsx'
        }]
      },

      plugins: [
        new HappyPlugin({
          id: 'js',
          cache: false,
          verbose: false,
          loaders: [ loader.path ],
          threadPool: threadPool
        }),

        new HappyPlugin({
          id: 'jsx',
          cache: false,
          verbose: false,
          loaders: [ loader.path ],
          threadPool: threadPool
        })
      ]
    });

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