var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('../../HappyTestUtils');
var webpack = require('webpack');
var assert = require('chai').assert;

describe('[Integration] Loader RPCs - this.addContextDependency()', function() {
  TestUtils.IntegrationSuite(this);

  it('works', function(done) {
    var loader = TestUtils.createLoader(function(s) {
      this.addContextDependency('b.js');

      return s;
    });

    var sinon = TestUtils.getSinonSandbox();
    TestUtils.spyOnActiveLoader(function(happyLoader) {
      sinon.spy(happyLoader, 'addContextDependency');
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

      assert.calledWith(TestUtils.activeLoader.addContextDependency, 'b.js')

      done();
    });
  });
});