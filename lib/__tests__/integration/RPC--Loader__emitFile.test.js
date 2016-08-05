var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('../../HappyTestUtils');
var webpack = require('webpack');
var assert = require('chai').assert;

describe('[Integration] Loader RPCs - this.emitFile()', function() {
  TestUtils.IntegrationSuite(this);

  it('works', function(done) {
    var sinon = TestUtils.getSinonSandbox();
    var loader = TestUtils.createLoader(function(s) {
      this.emitFile('b.js', 'foo', { 1: 'zxc' });

      return s;
    });

    TestUtils.spyOnActiveLoader(function(happyLoader) {
      sinon.spy(happyLoader, 'emitFile');
    });

    var compiler = webpack({
      entry: TestUtils.createFile('a.js', '// a.js').getPath(),
      output: {
        path: TestUtils.tempDir('integration-[guid]')
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
        })
      ]
    });

    compiler.run(function(err, rawStats) {
      TestUtils.assertNoWebpackErrors(err, rawStats, done);

      assert.calledWith(TestUtils.activeLoader.emitFile, 'b.js', 'foo', { 1: 'zxc' });

      done();
    });
  });
});