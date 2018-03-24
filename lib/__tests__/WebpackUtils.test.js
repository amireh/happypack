var assert = require('@happypack/test-utils').assert;
var webpack = require('webpack');
var Subject = require('../WebpackUtils');
var createIntegrationSuite = require('@happypack/test-utils').createIntegrationSuite;
var composeWebpackConfig = require('@happypack/test-utils').composeWebpackConfig;
var getModuleLoaders = require('@happypack/test-utils').getModuleLoaders;

describe('WebpackUtils', function() {
  describe('.resolveLoaders', function() {
    var testSuite = createIntegrationSuite(this);
    var compiler;
    var fakeLoader;

    beforeEach(function() {
      fakeLoader = testSuite.createFile('node_modules/babel-loader/index.js', '');
    });

    it('resolves the full path of a loader', function(done) {
      runWithLoaders([{ test: /.js$/, loader: 'babel' }], function(err, loaders) {
        if (err) return done(err);

        assert.equal(loaders.length, 1);
        assert.equal(loaders[0], fakeLoader.path);

        done();
      });
    });

    function runWithLoaders(loaders, done) {
      var mandatoryEntryFile = testSuite.createFile('foo.js', '')

      compiler = webpack(
        composeWebpackConfig(
          loaders.map(function(loader) {
            return ['loader', loader]
          }).concat([
            ['*', {
              entry: mandatoryEntryFile.path
            }],

            ['resolveLoader', {
              root: testSuite.resolve('node_modules'),
            }],

            ['resolveLoaderExtension']
          ])
        )
      );

      Subject.resolveLoaders(compiler, getModuleLoaders(compiler).map(function(l) {
        return l.loader;
      }), done);
    }
  });

  // the samples cover two variants:
  //
  // 1. a single loader defined on the entry, like { loader: ..., query?: ... }
  // 2. multiple loaders: { loaders: [{ ... }] }
  //
  // Queries can be:
  //
  // 1. embedded in the loader string:
  //
  //     { loader: "babel?foo=bar" }
  //
  // 2. defined as a string:
  //
  //     { loader: 'babel', query: 'foo=bar' }
  //
  // 3. defined as a string with ? prefix:
  //
  //     { loader: 'babel', query: '?foo=bar' }
  //
  // 4. defined as an object:
  //
  //     { loader: 'babel', query: { foo: 'bar' } }
  //
  var samples = [
    {
      description: 'a single string loader with no query',
      input: {
        loader: 'react-hot',
      },

      output: {
        path: 'react-hot',
      }
    },

    {
      description: 'a single string loader with an embedded query',
      input: {
        loader: 'babel?foo=bar',
      },

      output: {
        path: 'babel',
        query: '?foo=bar'
      },
    },

    {
      description: 'a single string loader with a string query',
      input: {
        loader: 'babel',
        query: 'foo=bar'
      },

      output: {
        path: 'babel',
        query: '?foo=bar'
      },
    },

    {
      description: 'a single string loader with a string query prefixed by ?',
      input: {
        loader: 'babel',
        query: '?foo=bar'
      },

      output: {
        path: 'babel',
        query: '?foo=bar'
      },
    },

    {
      description: 'a single string loader with an object query',
      input: {
        loader: 'babel',
        query: {
          foo: 'bar'
        }
      },

      output: {
        path: 'babel',
        query: '?{"foo":"bar"}'
      },
    },

    {
      description: 'a single string loader with an object options',
      input: {
        loader: 'babel',
        options: {
          foo: 'bar'
        }
      },

      output: {
        path: 'babel',
        query: '?{"foo":"bar"}'
      },
    },

    {
      description: 'multiple string loaders,',
      input: {
        loaders: [ 'react-hot', 'babel' ]
      },

      output: [
        {
          path: 'react-hot'
        },
        {
          path: 'babel'
        },
      ],
    },

    {
      description: 'multiple string loaders with embedded queries',
      input: {
        loaders: [
          'react-hot',
          'babel?foo=bar'
        ]
      },

      output: [
        {
          path: 'react-hot'
        },
        {
          path: 'babel',
          query: '?foo=bar'
        }
      ],
    },

    {
      description: 'multiple loaders with string queries',
      input: {
        loaders: [
          'react-hot',

          {
            loader: 'babel',
            query: 'foo=bar'
          }
        ]
      },

      output: [
        {
          path: 'react-hot',
        },
        {
          path: 'babel',
          query: '?foo=bar'
        }
      ]
    },

    {
      description: 'multiple loaders with string queries prefixed by ?',
      input: {
        loaders: [
          'react-hot',

          {
            loader: 'babel',
            query: '?foo=bar'
          }
        ]
      },

      output: [
        {
          path: 'react-hot',
        },
        {
          path: 'babel',
          query: '?foo=bar'
        }
      ]
    },

    {
      description: 'multiple loaders with object queries',
      input: {
        loaders: [
          'react-hot',

          {
            loader: 'babel',
            query: {
              foo: 'bar'
            }
          }
        ]
      },

      output: [
        {
          path: 'react-hot',
        },
        {
          path: 'babel',
          query: '?{"foo":"bar"}'
        }
      ]
    },

    {
      description: 'multiple loaders in a string',
      input: {
        loader: 'react-hot!babel'
      },

      output: [
        {
          path: 'react-hot',
        },
        {
          path: 'babel'
        }
      ]
    },

    {
      description: 'multiple loaders in a string with an embedded query',
      input: {
        loader: 'react-hot!babel?presets[]=es2015'
      },

      output: [
        {
          path: 'react-hot',
        },
        {
          path: 'babel',
          query: '?presets[]=es2015',
        }
      ]
    },
    {
      description: 'multiple loaders in a string with multiple embedded queries',
      input: {
        loader: 'style!css?modules&importLoaders=2&sourceMap&localIdentName=[local]___[hash:base64:5]!autoprefixer?browsers=last 2 version!sass?outputStyle=expanded&sourceMap',
      },

      output: [
        {
          path: 'style',
        },
        {
          path: 'css',
          query: '?modules&importLoaders=2&sourceMap&localIdentName=[local]___[hash:base64:5]',
        },
        {
          path: 'autoprefixer',
          query: '?browsers=last 2 version',
        },
        {
          path: 'sass',
          query: '?outputStyle=expanded&sourceMap',
        },
      ]
    },

    {
      description: 'multiple loaders in a string array',
      input: {
        loaders: [ 'style!css', 'less' ]
      },

      output: [
        {
          path: 'style',
        },
        {
          path: 'css',
        },
        {
          path: 'less',
        },
      ]
    },

    {
      description: 'loaders defined in the "use" property',
      input: {
        use: [ 'style-loader!css-loader', 'less-loader' ]
      },

      output: [
        {
          path: 'style-loader',
        },
        {
          path: 'css-loader',
        },
        {
          path: 'less-loader',
        },
      ]
    },
  ];

  describe('.normalizeLoader', function() {
    var subject = Subject.normalizeLoader;

    samples.filter(function(x) { return !!x.output; }).forEach(function(sample) {
      it(sample.description, function() {
        var loaders = [].concat( subject(sample.input) );
        var expectedLoaders = [].concat(sample.output);

        assert.equal(loaders.length, expectedLoaders.length);

        loaders.forEach(function(loader, index) {
          assert.deepEqual(loader, expectedLoaders[index]);
        });
      });
    })
  });
});
