var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('../../HappyTestUtils');
var webpack = require('webpack');
var assert = require('chai').assert;

describe('[Integration] Loader RPCs - this.clearDependencies()', function() {
  var testSuite = TestUtils.IntegrationSuite2(this);

  it('works', function(done) {
    var sinon = testSuite.getSinonSandbox();
    var loader = testSuite.createLoader(function(s) {
      this.addDependency(this.resourcePath.replace('a.js', 'b.js'));
      this.addContextDependency(this.resourcePath.replace('a.js', 'c.js'));
      this.clearDependencies();

      return s;
    });

    testSuite.spyOnActiveLoader(function(happyLoader) {
      sinon.spy(happyLoader, 'addDependency');
      sinon.spy(happyLoader, 'addContextDependency');
      sinon.spy(happyLoader, 'clearDependencies');
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

      assert.called(testSuite.activeLoader.addDependency);
      assert.called(testSuite.activeLoader.addContextDependency);
      assert.called(testSuite.activeLoader.clearDependencies);

      done();
    });
  });
});