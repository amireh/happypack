var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('happypack-test-utils');
var webpack = require('webpack');
var assert = require('chai').assert;

describe('[Integration] webpack --bail', function() {
  var testSuite = TestUtils.createIntegrationSuite(this);

  it('works', function(done) {
    var loader = testSuite.createLoader(function(s) { return s; });

    var compiler = webpack({
      bail: true,

      entry: testSuite.createFile('a.js', 'require("./b1");').path,
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
          verbose: false,
          loaders: [ loader.path ],
        })
      ]
    });

    compiler.run(function(err) {
      assert.match(err.toString(), /ModuleNotFoundError/);

      done();
    });
  });
});