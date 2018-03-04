var fs = require('fs');
var multiline = require('multiline-slash');
var webpack = require('webpack');
var HappyPlugin = require('../../HappyPlugin');
var TestUtils = require('@happypack/test-utils');
const {
  assert,
  createIntegrationSuite,
  composeWebpackConfig,
} = TestUtils

describe('[Integration] Loader RPCs - this.loadModule()', function() {
  var testSuite = createIntegrationSuite(this);

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

    var config = composeWebpackConfig([
      ['*', {
        entry: file1.path,

        output: {
          filename: 'bundle.js',
          path: testSuite.createDirectory('dist').path,
        },

        plugins: [
          new HappyPlugin({
            loaders: [ loader.path ],
            verbose: false,
          })
        ]
      }],

      ['loader', {
        test: file1.path,
        loader: TestUtils.HAPPY_LOADER_PATH
      }],

      ['mode', 'development'],
      ['devtool', false],
    ])

    var compiler = webpack(config);

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