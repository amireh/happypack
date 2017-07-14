var path = require('path');
var multiline = require('multiline-slash');
var fs = require('fs');
var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('../../HappyTestUtils');
var composeWebpackConfig = require('../utils').composeWebpackConfig;
var webpack = require('webpack');
var assert = require('chai').assert;

describe('[Integration] Compiler RPCs - this.resolve()', function() {
  var testSuite = TestUtils.IntegrationSuite2(this);

  it('works', function(done) {
    var loader = testSuite.createLoaderFromString(multiline(function() {
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

    var file1 = testSuite.createFile('integration/RPC--Compiler__resolve/a.js', '// a.js');
    var file2 = testSuite.createFile('integration/RPC--Compiler__resolve/shared/b.js', '// b.js');

    var config = composeWebpackConfig([
      ['*', {
        entry: file1.path,

        output: {
          filename: 'bundle.js',
          path: testSuite.createDirectory('dist').path,
        },

        plugins: [
          new HappyPlugin({
            loaders: [ loader._name ],
            verbose: false,
          })
        ]
      }],

      ['loader', {
        test: /.js$/,
        loader: TestUtils.HAPPY_LOADER_PATH
      }],

      ['resolveLoader', {
        root: path.dirname(loader.path)
      }],

      ['resolve.modulesDirectories', [ 'shared' ]],
      ['resolveLoaderExtension'],
    ])

    var compiler = webpack(config);

    compiler.run(function(err, rawStats) {
      TestUtils.assertNoWebpackErrors(err, rawStats, done);

      assert.match(
        fs.readFileSync(testSuite.resolve('dist/bundle.js'), 'utf-8'),
        '// resolved file path: "' + file2.path + '";'
      );

      done();
    });
  });
});