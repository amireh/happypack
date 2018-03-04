var path = require('path');
var multiline = require('multiline-slash');
var fs = require('fs');
var webpack = require('webpack');
var HappyPlugin = require('../../HappyPlugin');
var HAPPY_LOADER_PATH = require('@happypack/test-utils').HAPPY_LOADER_PATH;
var createIntegrationSuite = require('@happypack/test-utils').createIntegrationSuite;
var composeWebpackConfig = require('@happypack/test-utils').composeWebpackConfig;
var assertNoWebpackErrors = require('@happypack/test-utils').assertNoWebpackErrors;
var assert = require('@happypack/test-utils').assert;

describe('[Integration] Compiler RPCs - this.resolve()', function() {
  var testSuite = createIntegrationSuite(this);

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
      ['entry', file1.path],

      ['output', {
        filename: 'bundle.js',
        path: testSuite.createDirectory('dist').path,
      }],

      ['plugin', new HappyPlugin({
        loaders: [ loader._name ],
        verbose: false,
      })],

      ['loader', {
        test: /.js$/,
        loader: HAPPY_LOADER_PATH
      }],

      ['resolveLoader', {
        root: path.dirname(loader.path)
      }],

      ['resolve.modulesDirectories', [ 'shared' ]],
      ['resolveLoaderExtension'],
      ['mode', 'development'],
      ['devtool', false],
    ])

    var compiler = webpack(config);

    compiler.run(function(err, rawStats) {
      if (assertNoWebpackErrors(err, rawStats, done)) {
        return
      }

      assert.match(
        fs.readFileSync(testSuite.resolve('dist/bundle.js'), 'utf-8'),
        '// resolved file path: "' + file2.path + '";'
      );

      done();
    });
  });
});