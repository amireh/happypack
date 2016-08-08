var fs = require('fs');
var path = require('path');
var async = require('async');
var assert = require('assert');
var HappyThreadPool = require('./HappyThreadPool');
var HappyFSCache = require('./HappyFSCache');
var HappyUtils = require('./HappyUtils');
var HappyWorker = require('./HappyWorker');
var HappyFakeCompiler = require('./HappyFakeCompiler');
var WebpackUtils = require('./WebpackUtils');
var OptionParser = require('./OptionParser');
var JSONSerializer = require('./JSONSerializer');
var SourceMapSerializer = require('./SourceMapSerializer');
var fnOnce = require('./fnOnce');
var pkg = require('../package.json');
var uid = 0;

function HappyPlugin(userConfig) {
  if (!(this instanceof HappyPlugin)) {
    return new HappyPlugin(userConfig);
  }

  this.id = String(userConfig.id || ++uid);
  this.name = 'HappyPack';
  this.state = {
    started: false,
    loaders: [],
    baseLoaderRequest: '',
    foregroundWorker: null,
  };

  this.config = OptionParser(userConfig, {
    id:                       { type: 'string' },
    tempDir:                  { type: 'string', default: '.happypack' },
    threads:                  { type: 'number', default: 3 },
    threadPool:               { type: 'object', default: null },
    cache:                    { type: 'boolean', default: true },
    cachePath:                { type: 'string' },
    cacheContext:             { type: 'object', default: {} },
    cacheSignatureGenerator:  { type: 'function' },
    verbose:                  { type: 'boolean', default: true },
    debug:                    { type: 'boolean', default: process.env.DEBUG === '1' },
    enabled:                  { type: 'boolean', default: true },
    loaders:                  {
      validate: function(value) {
        if (!Array.isArray(value)) {
          return 'Loaders must be an array!';
        }
        else if (value.length === 0) {
          return 'You must specify at least one loader!';
        }
        else if (value.some(function(loader) {
          return typeof loader !== 'string' && !loader.path;
        })) {
          return 'Loader must have a @path property or be a string.'
        }
      },
    }
  }, "HappyPack[" + this.id + "]");

  this.threadPool = this.config.threadPool || HappyThreadPool({
    id: this.id,
    size: this.config.threads,
    verbose: this.config.verbose,
    debug: this.config.debug,
  });

  this.cache = HappyFSCache({
    id: this.id,
    path: this.config.cachePath ?
      path.resolve(this.config.cachePath.replace(/\[id\]/g, this.id)) :
      path.resolve(this.config.tempDir, 'cache--' + this.id + '.json'),
    verbose: this.config.verbose,
    generateSignature: this.config.cacheSignatureGenerator
  });

  HappyUtils.mkdirSync(this.config.tempDir);

  return this;
}

HappyPlugin.resetUID = function() {
  uid = 0;
};

HappyPlugin.prototype.apply = function(compiler) {
  if (this.config.enabled === false) {
    return;
  }

  var that = this;
  var engageWatchMode = fnOnce(function() {
    // Once the initial build has completed, we create a foreground worker and
    // perform all compilations in this thread instead:
    compiler.plugin('done', function() {
      that.state.foregroundWorker = createForegroundWorker(
        compiler,
        that.state.loaders,
        that.threadPool.getRPCHandler()
      );
    });

    // TODO: anything special to do here?
    compiler.plugin('failed', function(err) {
      console.warn('fatal watch error!!!', err);
    });
  });

  compiler.plugin('watch-run', function(_, done) {
    if (engageWatchMode() === fnOnce.ALREADY_CALLED) {
      done();
    }
    else {
      that.start(compiler, done);
    }
  });

  compiler.plugin('run', that.start.bind(that));

  // cleanup hooks:
  compiler.plugin('done', that.stop.bind(that));

  if (compiler.options.bail) {
    compiler.plugin('compilation', function(compilation) {
      compilation.plugin('failed-module', that.stop.bind(that));
    });
  }
};

HappyPlugin.prototype.start = function(compiler, done) {
  var that = this;

  if (that.config.verbose) {
    console.log('Happy[%s]: Version: %s. Using cache? %s. Threads: %d%s',
      that.id, pkg.version,
      that.config.cache ? 'yes' : 'no',
      that.threadPool.size,
      that.config.threadPool ? ' (shared pool)' : ''
    );
  }

  async.series([
    function registerCompilerForRPCs(callback) {
      that.threadPool.getRPCHandler().registerActiveCompiler(compiler);

      callback();
    },

    function normalizeLoaders(callback) {
      var loaders = that.config.loaders;

      // if no loaders are configured, try to infer from existing module.loaders
      // list if any entry has a "{ happy: { id: ... } }" object
      if (!loaders) {
        var sourceLoaderConfig = compiler.options.module.loaders.filter(function(loader) {
          return loader.happy && loader.happy.id === that.id;
        })[0];

        if (sourceLoaderConfig) {
          loaders = [].concat(WebpackUtils.extractLoaders(sourceLoaderConfig));

          // yeah, yuck... we need to overwrite, ugly!
          sourceLoaderConfig.loader = path.resolve(__dirname, 'HappyLoader.js') + '?id=' + that.id;
          delete sourceLoaderConfig.query;
          delete sourceLoaderConfig.loaders;

          // TODO: it would be nice if we can restore those mutations at some
          // point
        }
      }

      assert(loaders && loaders.length > 0,
        "HappyPlugin[" + that.id + "]; you have not specified any loaders " +
        "and there is no matching loader entry with this id either."
      );

      that.state.loaders = loaders.reduce(function(list, entry) {
        return list.concat(WebpackUtils.normalizeLoader(entry));
      }, []);

      callback(null);
    },

    function resolveLoaders(callback) {
      var loaderPaths = that.state.loaders.map(function(loader) {
        if (loader.query) {
          return loader.path + loader.query;
        }

        return loader.path;
      });

      WebpackUtils.resolveLoaders(compiler, loaderPaths, function(err, loaders) {
        if (err) return callback(err);

        that.state.loaders = loaders;
        that.state.baseLoaderRequest = loaders.map(function(loader) {
          return loader.path + (loader.query || '');
        }).join('!');

        callback();
      });
    },

    function loadCache(callback) {
      if (that.config.cache) {
        that.cache.load({
          loaders: that.state.loaders,
          external: that.config.cacheContext
        });
      }

      callback();
    },

    function launchAndConfigureThreads(callback) {
      that.threadPool.start(function() {
        var serializedOptions;
        var compilerOptions = HappyPlugin.extractCompilerOptions(compiler.options);

        try {
          serializedOptions = JSONSerializer.serialize(compilerOptions);
        }
        catch(e) {
          console.error('Happy[%s]: Unable to serialize options!!! This is an internal error.', that.id);
          console.error(compilerOptions);

          return callback(e);
        }

        that.threadPool.configure(serializedOptions, callback);
      });
    },

    function markStarted(callback) {
      if (that.config.verbose) {
        console.log('Happy[%s]: All set; signalling webpack to proceed.', that.id);
      }

      that.state.started = true;

      callback();
    }
  ], done);
};

HappyPlugin.prototype.stop = function() {
  assert(this.state.started, "HappyPlugin can not be torn down until started!");

  if (this.config.cache) {
    this.cache.save();
  }

  this.threadPool.stop();
};

HappyPlugin.prototype.compile = function(loaderContext, done) {
  if (this.state.foregroundWorker) {
    return this.compileInForeground(loaderContext, done);
  }
  else {
    return this.compileInBackground(loaderContext, done);
  }
};

HappyPlugin.prototype.compileInBackground = function(loaderContext, done) {
  var cache = this.cache;
  var filePath = loaderContext.resourcePath;

  if (!cache.hasChanged(filePath) && !cache.hasErrored(filePath)) {
    var cached = this.readFromCache(filePath);

    return done(null, cached.sourceCode, cached.sourceMap);
  }

  if (process.env.HAPPY_DEBUG || this.config.debug) {
    console.warn('File had changed, re-compiling... (%s)', filePath);
  }

  this._performCompilationRequest(this.threadPool.get(), loaderContext, done);
};

HappyPlugin.prototype.readFromCache = function(filePath) {
  var cached = {};
  var sourceCodeFilePath = this.cache.getCompiledSourceCodePath(filePath);
  var sourceMapFilePath = this.cache.getCompiledSourceMapPath(filePath);

  cached.sourceCode = fs.readFileSync(sourceCodeFilePath, 'utf-8');

  if (HappyUtils.isReadable(sourceMapFilePath)) {
    cached.sourceMap = SourceMapSerializer.deserialize(
      fs.readFileSync(sourceMapFilePath, 'utf-8')
    );
  }

  return cached;
};

// compile the source using the foreground worker instead of sending to the
// background threads:
HappyPlugin.prototype.compileInForeground = function(loaderContext, done) {
  this._performCompilationRequest(this.state.foregroundWorker, loaderContext, done);
};

HappyPlugin.prototype._performCompilationRequest = function(worker, loaderContext, done) {
  var cache = this.cache;
  var filePath = loaderContext.resourcePath;

  cache.invalidateEntryFor(filePath);

  worker.compile({
    loaders: this.state.loaders,
    compiledPath: path.resolve(this.config.tempDir, HappyUtils.generateCompiledPath(filePath)),
    loaderContext: loaderContext,
  }, function(result) {
    var contents = fs.readFileSync(result.compiledPath, 'utf-8')
    var compiledMap;

    if (!result.success) {
      cache.updateMTimeFor(filePath, null, contents);
      done(contents);
    }
    else {
      cache.updateMTimeFor(filePath, result.compiledPath);
      compiledMap = SourceMapSerializer.deserialize(
        fs.readFileSync(cache.getCompiledSourceMapPath(filePath), 'utf-8')
      );

      done(null, contents, compiledMap);
    }
  });
};

HappyPlugin.prototype.generateRequest = function(resource) {
  return this.state.baseLoaderRequest + '!' + resource;
};

// export this so that users get to override if needed
HappyPlugin.SERIALIZABLE_OPTIONS = [
  'amd',
  'bail',
  'cache',
  'context',
  'entry',
  'externals',
  'debug',
  'devtool',
  'devServer',
  'loader',
  'module',
  'node',
  'output',
  'profile',
  'recordsPath',
  'recordsInputPath',
  'recordsOutputPath',
  'resolve',
  'resolveLoader',
  'target',
  'watch',
];

HappyPlugin.extractCompilerOptions = function(options) {
  var ALLOWED_KEYS = HappyPlugin.SERIALIZABLE_OPTIONS;

  return Object.keys(options).reduce(function(hsh, key) {
    if (ALLOWED_KEYS.indexOf(key) > -1) {
      hsh[key] = options[key];
    }

    return hsh;
  }, {});
};

function createForegroundWorker(compiler, loaders, happyRPCHandler) {
  var fakeCompiler = new HappyFakeCompiler('foreground', function executeCompilerRPC(message) {
    // TODO: DRY alert, see HappyThread.js
    happyRPCHandler.execute(message.data.type, message.data.payload, function serveRPCResult(error, result) {
      fakeCompiler._handleResponse(message.id, {
        payload: {
          error: error || null,
          result: result || null
        }
      });
    });
  });

  fakeCompiler.options = compiler.options;

  return new HappyWorker({ compiler: fakeCompiler, loaders: loaders });
}

// convenience accessor to relieve people from requiring the file directly:
HappyPlugin.ThreadPool = HappyThreadPool;

module.exports = HappyPlugin;
