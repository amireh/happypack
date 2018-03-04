var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('@happypack/test-utils');
var webpack = require('webpack');
const {
  assert,
  assertNoWebpackErrors,
  createIntegrationSuite,
  composeWebpackConfig
} = TestUtils

describe('[Integration] Loader RPCs - this.emitFile()', function() {
  var testSuite = createIntegrationSuite(this);

  it('works', function(done) {
    var sinon = testSuite.getSinonSandbox();
    var loader = testSuite.createLoader(function(s) {
      this.emitFile('b.js', 'foo', { 1: 'zxc' });

      return s;
    });

    testSuite.spyOnActiveLoader(function(happyLoader) {
      sinon.spy(happyLoader, 'emitFile');
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

      assert.calledWith(testSuite.activeLoader.emitFile, 'b.js', 'foo', { 1: 'zxc' });

      done();
    });
  });
});