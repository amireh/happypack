var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('../../HappyTestUtils');
var webpack = require('webpack');
var assert = require('chai').assert;

describe('[Integration] Loader RPCs - this.clearDependencies()', function() {
  TestUtils.IntegrationSuite(this);

  it('works', function(done) {
    var sinon = TestUtils.getSinonSandbox();
    var loader = TestUtils.createLoader(function(s) {
      this.addDependency(this.resourcePath.replace('a.js', 'b.js'));
      this.addContextDependency(this.resourcePath.replace('a.js', 'c.js'));
      this.clearDependencies();

      return s;
    });

    TestUtils.spyOnActiveLoader(function(happyLoader) {
      sinon.spy(happyLoader, 'addDependency');
      sinon.spy(happyLoader, 'addContextDependency');
      sinon.spy(happyLoader, 'clearDependencies');
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
        new HappyPlugin({ loaders: [ loader.path ], })
      ]
    });

    compiler.run(function(err, rawStats) {
      TestUtils.assertNoWebpackErrors(err, rawStats, done);

      assert.called(TestUtils.activeLoader.addDependency);
      assert.called(TestUtils.activeLoader.addContextDependency);
      assert.called(TestUtils.activeLoader.clearDependencies);

      done();
    });
  });
});