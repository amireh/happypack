'use strict';

const fs = require('fs');
const webpack = require('webpack');
const TestUtils = require('../../HappyTestUtils');
const HappyPlugin = require('../../HappyPlugin');
const { assert, } = require('../../HappyTestUtils');

describe('[Integration] transform-loader with coffeeify for compiling CoffeeScripts', function() {
  TestUtils.IntegrationSuite(this);

  it("works", function(done) {
    const compiler = webpack({
      entry: TestUtils.fixturePath('integration/a.coffee'),

      output: {
        path: TestUtils.tempDir('integration-[guid]')
      },

      module: {
        loaders: [{
          test: /.coffee$/,
          loader: TestUtils.HAPPY_LOADER_PATH
        }]
      },

      plugins: [
        new HappyPlugin({
          loaders: [ 'transform?coffeeify' ],
        })
      ]
    });

    compiler.run(function(err, rawStats) {
      TestUtils.assertNoWebpackErrors(err, rawStats, done);

      assert.match(
        fs.readFileSync(TestUtils.getWebpackOutputBundlePath(rawStats), 'utf-8'),
        "console.log('Hello World!');"
      );

      done();
    });
  });
});