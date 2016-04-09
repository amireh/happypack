var fs = require('fs');
var path = require('path');
var async = require('async');
var assert = require('assert');
var HappyThreadPool = require('./HappyThreadPool');
var HappyRPCHandler = require('./HappyRPCHandler');
var HappyFSCache = require('./HappyFSCache');
var HappyUtils = require('./HappyUtils');
var HappyWorker = require('./HappyWorker');
var HappyFakeCompiler = require('./HappyFakeCompiler');
var WebpackUtils = require('./WebpackUtils');
var JSONSerializer = require('./JSONSerializer');
var OptionParser = require('./OptionParser');
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
    foregroundWorker: null,
  };

  this.config = OptionParser(userConfig, {
    id:                 { type: 'string' },
    tempDir:            { type: 'string', default: '.happypack' },
    threads:            { type: 'number', default: 3 },
    cache:              { type: 'boolean', default: true },
    cacheContext:       { default: {} },
    cachePath:          { type: 'string' },

    loaders: {
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
      isRequired: true,
    }
  }, "HappyPack[" + this.id + "]");

  if (isNaN(this.config.threads)) {
    throw new Error("ArgumentError: Happy[" + this.config.id + "] threads option is invalid.");
  }

  this.config.threads = Math.max(Math.ceil(parseInt(this.config.threads, 10)), 1);
  this.config.optionsPath = path.resolve(this.config.tempDir, 'options--' + this.id + '.json');
  this.cache = HappyFSCache(this.id, this.config.cachePath ?
    path.resolve(this.config.cachePath) :
    path.resolve(this.config.tempDir, 'cache--' + this.id + '.json')
  );

  HappyUtils.mkdirSync(this.config.tempDir);

  return this;
}

HappyPlugin.resetUID = function() {
  uid = 0;
};

HappyPlugin.prototype.apply = function(compiler) {
  var that = this;

  var engageWatchMode = fnOnce(function() {
    // Once the initial build has completed, we create a foreground worker and
    // perform all compilations in this thread instead:
    compiler.plugin('done', function() {
      that.state.foregroundWorker = createForegroundWorker(compiler, that.config.loaders);
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

  assert(!that.state.started, "HappyPlugin has already been started!");

  console.log('Happy[%s]: Version: %s. Using cache? %s. Threads: %d',
    that.id, pkg.version, that.config.cache ? 'yes' : 'no', that.config.threads);

  async.series([
    function registerCompilerForRPCs(callback) {
      HappyRPCHandler.registerActiveCompiler(compiler);

      callback();
    },

    function normalizeLoaders(callback) {
      var loaders = that.config.loaders
        .map(WebpackUtils.disectLoaderString)
        .reduce(function(allLoaders, loadersFoundInString) {
          return allLoaders.concat(loadersFoundInString);
        }, [])
      ;

      that.config.loaders = loaders;

      callback();
    },

    function resolveLoaders(callback) {
      var loaderPaths = that.config.loaders.map(function(loader) {
        if (loader.query) {
          return loader.path + loader.query;
        }
        return loader.path;
      });

      WebpackUtils.resolveLoaders(compiler, loaderPaths, function(err, loaders) {
        if (err) return callback(err);

        that.config.loaders = loaders;
        that.baseLoaderRequest = that.config.loaders.map(function(loader) {
          return loader.path + (loader.query || '');
        }).join('!');

        callback();
      });
    },

    function loadCache(callback) {
      if (that.config.cache) {
        that.cache.load({
          loaders: that.config.loaders,
          external: that.config.cacheContext
        });
      }

      callback();
    },

    function serializeOptions(callback) {
      // serialize the options so that the workers can pick them up
      try {

        fs.writeFileSync(that.config.optionsPath, JSONSerializer.serialize({
          loaders: that.config.loaders,
          compilerOptions: HappyPlugin.extractCompilerOptions(compiler.options)
        }), 'utf-8');

        callback();
      }
      catch(e) {
        console.error('Happy[%s]: Unable to serialize options!!! This is an internal error.', that.id);
        console.error(compiler.options || compiler);

        callback(e);
      }
    },

    function launchThreads(callback) {
      that.threadPool = HappyThreadPool(that.config);
      that.threadPool.start(callback);
    },

    function markStarted(callback) {
      console.log('Happy[%s]: All set; signalling webpack to proceed.', that.id);

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

  if (this.threadPool) {
    this.threadPool.stop();
    this.threadPool = null;
  }
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
    return done(null, fs.readFileSync(cache.getCompiledPath(filePath), 'utf-8'));
  }

  if (process.env.HAPPY_DEBUG) {
    console.warn('File had changed, re-compiling... (%s)', filePath);
  }

  this._performCompilationRequest(this.threadPool.get(), loaderContext, done);
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
    compiledPath: path.resolve(this.config.tempDir, HappyUtils.generateCompiledPath(filePath)),
    loaderContext: loaderContext,
  }, function(result) {
    var contents = fs.readFileSync(result.compiledPath, 'utf-8')

    if (!result.success) {
      cache.updateMTimeFor(filePath, null, contents);
      done(contents);
    }
    else {
      cache.updateMTimeFor(filePath, result.compiledPath);
      done(null, contents, null /* TODO: SourceMaps */);
    }
  });
};

HappyPlugin.prototype.generateRequest = function(resource) {
  return this.baseLoaderRequest + '!' + resource;
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

function createForegroundWorker(compiler, loaders) {
  var fakeCompiler = new HappyFakeCompiler('foreground', function executeCompilerRPC(message) {
    // TODO: DRY alert, see HappyThread.js
    HappyRPCHandler.execute(message.data.type, message.data.payload, function serveRPCResult(error, result) {
      fakeCompiler._handleResponse({
        id: message.data.id,
        payload: {
          error: error || null,
          result: result || null
        }
      });
    });
  }, compiler.options);

  return new HappyWorker({ compiler: fakeCompiler, loaders: loaders });
}

module.exports = HappyPlugin;
