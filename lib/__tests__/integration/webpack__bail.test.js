'use strict';

const HappyPlugin = require('../../HappyPlugin');
const TestUtils = require('../../HappyTestUtils');
const webpack = require('webpack');
const { assert, } = require('../../HappyTestUtils');

describe('[Integration] webpack --bail', function() {
  TestUtils.IntegrationSuite(this);

  it('works', function(done) {
    const loader = TestUtils.createLoader(s => s);

    const compiler = webpack({
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