var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('../../HappyTestUtils');
var webpack = require('webpack');
var assert = require('chai').assert;

describe('[Integration] webpack --bail', function() {
  TestUtils.IntegrationSuite(this);

  it('works', function(done) {
    var loader = TestUtils.createLoader(function(s) { return s; });

    var compiler = webpack({
      bail: true,

      entry: TestUtils.createFile('a.js', 'require("./b1");').getPath(),
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
          cache: false,
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