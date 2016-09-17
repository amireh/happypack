var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('../../HappyTestUtils');
var webpack = require('webpack');
var assert = require('chai').assert;

describe('[Integration] Loader RPCs - this.addDependency()', function() {
  var testSuite = TestUtils.IntegrationSuite2(this);

  it('works', function(done) {
    var sinon = testSuite.getSinonSandbox();
    var loader = testSuite.createLoader(function(s) {
      this.addDependency('b.js');

      return s;
    });

    testSuite.spyOnActiveLoader(function(happyLoader) {
      sinon.spy(happyLoader, 'addDependency');
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

      assert.calledWith(testSuite.activeLoader.addDependency, 'b.js');

      done();
    });
  });
});