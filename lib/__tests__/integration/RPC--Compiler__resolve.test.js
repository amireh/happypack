'use strict';

const HappyPlugin = require('../../HappyPlugin');
const TestUtils = require('../../HappyTestUtils');
const webpack = require('webpack');
const path = require('path');
const { assert, } = require('../../HappyTestUtils');
const multiline = require('multiline-slash');
const fs = require('fs');

describe('[Integration] Compiler RPCs - this.resolve()', function() {
  TestUtils.IntegrationSuite(this);

  it('works', function(done) {
    const loader = TestUtils.createLoaderFromString(multiline(function() {
      // module.exports = function() {
      //   var callback = this.async();
      //
      //   this.resolve(this.context, 'b.js', function(err, filePath) {
      //     if (err) {
      //       return callback(err);
      //     }
      //
      //     callback(null, '// resolved file path: "' + filePath + '";');
      //   });
      // };
    }));

    const file1 = TestUtils.createFile('integration/RPC--Compiler__resolve/a.js', '// a.js');
    const file2 = TestUtils.createFile('integration/RPC--Compiler__resolve/shared/b.js', '// b.js');

    const compiler = webpack({
      entry: file1.getPath(),

      output: {
        path: TestUtils.tempDir('integration/RPC--Compiler__resolve')
      },

      module: {
        loaders: [{
          test: /.js$/,
          loader: TestUtils.HAPPY_LOADER_PATH
        }]
      },

      resolve: {
        modulesDirectories: [ 'shared' ],
      },

      resolveLoader: {
        root: path.dirname(loader.path)
      },

      plugins: [
        new HappyPlugin({
          loaders: [ loader._name ],
        })
      ]
    });

    compiler.run(function(err, rawStats) {
      TestUtils.assertNoWebpackErrors(err, rawStats, done);

      assert.match(
        fs.readFileSync(TestUtils.getWebpackOutputBundlePath(rawStats), 'utf-8'),
        '// resolved file path: "' + file2.getPath() + '";'
      );

      done();
    });
  });
});