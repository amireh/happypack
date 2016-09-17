var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('../../HappyTestUtils');
var webpack = require('webpack');
var assert = require('chai').assert;

describe('[Integration] Loader RPCs - this.emitFile()', function() {
  var testSuite = TestUtils.IntegrationSuite2(this);

  it('works', function(done) {
    var sinon = testSuite.getSinonSandbox();
    var loader = testSuite.createLoader(function(s) {
      this.emitFile('b.js', 'foo', { 1: 'zxc' });

      return s;
    });

    testSuite.spyOnActiveLoader(function(happyLoader) {
      sinon.spy(happyLoader, 'emitFile');
    });

    var compiler = webpack({
      entry: testSuite.createFile('a.js', '// a.js').path,
      output: {
        path: testSuite.createDirectory('dist').path,
      },

      module: {
        loaders: [{
          test: /.js$/,
          loader: TestUtils.HAPPY_LOADER_PATH
        }]
      },

      plugins: [
        new HappyPlugin({
          loaders: [ loader.path ],
          verbose: false,
        })
      ]
    });

    compiler.run(function(err, rawStats) {
      TestUtils.assertNoWebpackErrors(err, rawStats, done);

      assert.calledWith(testSuite.activeLoader.emitFile, 'b.js', 'foo', { 1: 'zxc' });

      done();
    });
  });
});