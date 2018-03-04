var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('@happypack/test-utils');
var webpack = require('webpack');
const { assert, assertNoWebpackErrors, composeWebpackConfig } = TestUtils

describe('[Integration] Loader RPCs - this.addContextDependency()', function() {
  var testSuite = TestUtils.createIntegrationSuite(this);

  it('works', function(done) {
    var loader = testSuite.createLoader(function(s) {
      this.addContextDependency('b.js');

      return s;
    });

    var sinon = testSuite.getSinonSandbox();

    testSuite.spyOnActiveLoader(function(happyLoader) {
      sinon.spy(happyLoader, 'addContextDependency');
    });

    var compiler = webpack(composeWebpackConfig([
      ['entry', testSuite.createFile('a.js', '// a.js').path],
      ['output', {
        path: testSuite.createDirectory('dist').path,
      }],

      ['loader', {
        test: /.js$/,
        loader: TestUtils.HAPPY_LOADER_PATH
      }],

      ['plugin', [
        new HappyPlugin({
          loaders: [ loader.path ],
          verbose: false,
        })
      ]],
      ['mode', 'development'],
      ['devtool', false],
    ]));

    compiler.run(function(err, rawStats) {
      if (assertNoWebpackErrors(err, rawStats, done)) {
        return
      }

      assert.calledWith(testSuite.activeLoader.addContextDependency, 'b.js')

      done();
    });
  });
});