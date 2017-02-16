var assert = require('chai').assert;
var webpack = require('webpack');
var Subject = require('../WebpackUtils');
var HappyTestUtils = require('../HappyTestUtils');

describe('WebpackUtils', function() {
  describe('.resolveLoaders', function() {
    var testSuite = HappyTestUtils.IntegrationSuite2(this);
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
      compiler = webpack({
        module: {
          loaders: loaders
        },

        resolveLoader: {
          root: testSuite.resolve('node_modules'),
        }
      });

      Subject.resolveLoaders(compiler, compiler.options.module.loaders.map(function(l) {
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
      },

      outputNormal: {
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

      outputNormal: {
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
        query: 'foo=bar'
      },

      outputNormal: {
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

      outputNormal: {
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
        query: {
          foo: 'bar'
        }
      },

      outputNormal: {
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

      outputNormal: [
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

      outputNormal: [
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
          query: 'foo=bar'
        }
      ],

      outputNormal: [
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
      ],

      outputNormal: [
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
          query: {
            foo: 'bar'
          }
        }
      ],

      outputNormal: [
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
          path: 'babel',
        }
      ],

      outputNormal: [
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
      ],

      outputNormal: [
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
      ],

      outputNormal: [
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
      ],

      outputNormal: [
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

  ];

  describe('.extractLoaders', function() {
    var subject = Subject.extractLoaders;

    samples.filter(function(x) { return !!x.output; }).forEach(function(sample) {
      it(sample.description, function() {
        var loaders = [].concat( subject(sample.input) );
        var expectedLoaders = [].concat(sample.output);

        assert.equal(loaders.length, expectedLoaders.length);

        loaders.forEach(function(loader, index) {
          assert.deepEqual(loader, expectedLoaders[index]);
        });
      });
    });
  });

  describe('.normalizeLoader', function() {
    var subject = Subject.normalizeLoader;

    samples.filter(function(x) { return !!x.outputNormal; }).forEach(function(sample) {
      it(sample.description, function() {
        var loaders = [].concat( subject(sample.input) );
        var expectedLoaders = [].concat(sample.outputNormal);

        assert.equal(loaders.length, expectedLoaders.length);

        loaders.forEach(function(loader, index) {
          assert.deepEqual(loader, expectedLoaders[index]);
        });
      });
    })
  });
});
