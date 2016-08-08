var fs = require('fs');
var multiline = require('multiline-slash');
var webpack = require('webpack');
var assert = require('chai').assert;
var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('../../HappyTestUtils');

describe('[Integration] Loader RPCs - this.loadModule()', function() {
  var testSuite = TestUtils.IntegrationSuite2(this);

  it('works', function(done) {
    var loader = testSuite.createLoaderFromString(multiline(function() {
      // module.exports = function() {
      //   var callback = this.async();
      //
      //   this.loadModule('./b.js', function(err, contents) {
      //     if (err) {
      //       return callback(err);
      //     }
      //
      //     callback(null, '// loaded file: "' + contents + '";');
      //   });
      // };
    }));

    var file1 = testSuite.createFile('src/a.js', '// a.js');
    testSuite.createFile('src/b.js', 'lolol');

    var compiler = webpack({
      entry: file1.path,

      output: {
        path: testSuite.createDirectory('dist').path,
      },

      module: {
        loaders: [{
          test: file1.path,
          loader: TestUtils.HAPPY_LOADER_PATH
        }]
      },

      plugins: [
        new HappyPlugin({
          loaders: [ loader.path ],
        })
      ]
    });

    compiler.run(function(err, rawStats) {
      if (TestUtils.assertNoWebpackErrors(err, rawStats, done)) {
        return;
      }

      assert.match(
        fs.readFileSync(testSuite.resolve('dist/bundle.js'), 'utf-8'),
        '// loaded file: "lolol";'
      );

      done();
    });
  });
});