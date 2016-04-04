var fs = require('fs');
var path = require('path');
var async = require('async');
var HappyThreadPool = require('./HappyThreadPool');
var HappyRPCHandler = require('./HappyRPCHandler');
var HappyFSCache = require('./HappyFSCache');
var HappyUtils = require('./HappyUtils');
var HappyWorker = require('./HappyWorker');
var WebpackUtils = require('./WebpackUtils');
var JSONSerializer = require('./JSONSerializer');
var OptionParser = require('./OptionParser');
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
    initialBuildCompleted: false,
    compiler: null,
    foregroundWorker: null,
  };

  this.config = OptionParser(userConfig, {
    id:                 { type: 'string' },
    tempDir:            { type: 'string', default: '.happypack' },
    threads:            { type: 'number', default: 3 },
    cache:              { type: 'boolean', default: true },
    cacheContext:       { default: {} },
    cachePath:          { type: 'string' },
    installExitHandler: { type: 'boolean', default: true },

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
  }, this.id);

  HappyUtils.mkdirSync(this.config.tempDir);

  if (isNaN(this.config.threads)) {
    throw new Error("ArgumentError: Happy[" + this.config.id + "] threads option is invalid.");
  }

  this.config.threads = Math.max(Math.ceil(parseInt(this.config.threads, 10)), 1);
  this.config.optionsPath = path.resolve(this.config.tempDir, 'options--' + this.id + '.json');
  this.cache = HappyFSCache(this.id, this.config.cachePath ?
    path.resolve(this.config.cachePath) :
    path.resolve(this.config.tempDir, 'cache--' + this.id + '.json')
  );

  return this;
}

HappyPlugin.resetUID = function() {
  uid = 0;
};

HappyPlugin.prototype.apply = function(compiler) {
  var that = this;
  var inWatchMode = Boolean(compiler.options.watch);

  this.state.compiler = compiler;

  compiler.plugin('run', start);
  compiler.plugin('watch-run', start);

  compiler.plugin('compilation', function(compilation) {
    if (compiler.options.bail) {
      compilation.plugin('failed-module', teardown);
    }
  });

  compiler.plugin('done', function(/*stats*/) {
    teardown();

    that.state.initialBuildCompleted = true;
    that.state.foregroundWorker = new HappyWorker({
      compiler: that.state.compiler,
      loaders: that.config.loaders,
    });
  });

  if (inWatchMode && this.config.installExitHandler !== false) {
    process.on('exit', teardown);
    process.on('SIGINT', function() {
      process.exit(0);
    });
  }

  function start(_, done) {
    that.start(compiler, done);
  }

  function teardown() {
    if (that.state.started) {
      if (that.config.cache) {
        that.cache.save();
      }

      if (that.threadPool) {
        that.threadPool.stop();
      }

      that.state.started = false;
    }
  }
};

HappyPlugin.prototype.start = function(compiler, done) {
  var that = this;

  if (that.state.started || that.state.initialBuildCompleted) {
    return done();
  }

  console.log('Happy[%s]: Firing up! Version: %s. Using cache? %s. Threads: %d',
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

    // TODO: accept a config file path
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

HappyPlugin.prototype.compile = function(loaderContext, done) {
  if (this.state.initialBuildCompleted) {
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
  'bail',
  'cache',
  'context',
  'debug',
  'devtool',
  'resolve',
  'resolveLoader',
  'module',
  'node',
  'output',
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

module.exports = HappyPlugin;
