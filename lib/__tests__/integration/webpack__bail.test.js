var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('@happypack/test-utils');
var webpack = require('webpack');
const {
  assert,
  createIntegrationSuite,
  composeWebpackConfig,
} = TestUtils

describe('[Integration] webpack --bail', function() {
  var testSuite = createIntegrationSuite(this);

  it('works', function(done) {
    var loader = testSuite.createLoader(function(s) { return s; });

    var compiler = webpack(composeWebpackConfig([
      ['bail', true],

      ['entry', testSuite.createFile('a.js', 'require("./b1");').path],
      ['output', {
        path: testSuite.createDirectory('dist').path,
      }],

      ['loader', {
        test: /.js$/,
        loader: TestUtils.HAPPY_LOADER_PATH
      }],

      ['plugin', [
        new HappyPlugin({
          verbose: false,
          loaders: [ loader.path ],
        })
      ]],

      ['mode', 'development'],
      ['devtool', false],
    ]));

    compiler.run(function(err) {
      assert.match(err.toString(), /ModuleNotFoundError/);

      done();
    });
  });
});