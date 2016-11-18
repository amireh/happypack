var fs = require('fs');
var path = require('path');
var async = require('async');
var assert = require('assert');
var HappyThreadPool = require('./HappyThreadPool');
var HappyForegroundThreadPool = require('./HappyForegroundThreadPool');
var HappyFSCache = require('./HappyFSCache');
var HappyUtils = require('./HappyUtils');
var WebpackUtils = require('./WebpackUtils');
var OptionParser = require('./OptionParser');
var JSONSerializer = require('./JSONSerializer');
var SourceMapSerializer = require('./SourceMapSerializer');
var fnOnce = require('./fnOnce');
var pkg = require('../package.json');

function HappyPlugin(userConfig) {
  if (!(this instanceof HappyPlugin)) {
    return new HappyPlugin(userConfig);
  }

  this.name = 'HappyPack';
  this.state = {
    started: false,
    loaders: [],
    baseLoaderRequest: '',
    foregroundThreadPool: null,
    verbose: false,
    debug: false,
  };

  this.config = OptionParser(userConfig, {
    id:                       { type: 'string', default: '1' },
    compilerId:               { type: 'string', default: 'default' },
    tempDir:                  { type: 'string', default: '.happypack' },
    threads:                  { type: 'number', default: 3 },
    threadPool:               { type: 'object', default: null },
    cache:                    { type: 'boolean', default: true },
    cachePath:                { type: 'string' },
    cacheContext:             { type: 'object', default: {} },
    cacheSignatureGenerator:  { type: 'function' },
    verbose:                  { type: 'boolean', default: true },
    verboseWhenProfiling:     { type: 'boolean', default: false },
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
          return typeof loader !== 'string' && !loader.path && !loader.loader;
        })) {
          return 'Loader must have a @path or @loader property or be a string.'
        }
      },
    }
  }, "HappyPack[" + this.id + "]");

  this.id = this.config.id;

  HappyUtils.mkdirSync(this.config.tempDir);

  return this;
}

HappyPlugin.prototype.apply = function(compiler) {
  var that, engageWatchMode;

  if (this.config.enabled === false) {
    return;
  }

  that = this;

  this.state.verbose = isVerbose(compiler, this);
  this.state.debug = isDebug(compiler, this);

  this.threadPool = this.config.threadPool || HappyThreadPool({
    id: this.id,
    size: this.config.threads,
    verbose: this.state.verbose,
    debug: this.state.debug,
  });

  this.cache = HappyFSCache({
    id: this.id,
    path: this.config.cachePath ?
      path.resolve(this.config.cachePath.replace(/\[id\]/g, this.id)) :
      path.resolve(this.config.tempDir, 'cache--' + this.id + '.json'),
    verbose: this.state.verbose,
    generateSignature: this.config.cacheSignatureGenerator
  });

  engageWatchMode = fnOnce(function() {
    // Once the initial build has completed, we create a foreground worker and
    // perform all compilations in this thread instead:
    compiler.plugin('done', function() {
      that.state.foregroundThreadPool = HappyForegroundThreadPool({
        loaders: that.state.loaders,
      });

      that.state.foregroundThreadPool.start(that.config.compilerId, compiler, '{}', Function.prototype);
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

  if (that.state.verbose) {
    console.log('Happy[%s]: Version: %s. Using cache? %s. Threads: %d%s',
      that.id, pkg.version,
      that.config.cache ? 'yes' : 'no',
      that.threadPool.size,
      that.config.threadPool ? ' (shared pool)' : ''
    );
  }

  async.series([
    function normalizeLoaders(callback) {
      var loaders = that.config.loaders;

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

      that.threadPool.start(that.config.compilerId, compiler, serializedOptions, callback);
    },

    function markStarted(callback) {
      if (that.state.verbose) {
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

  this.threadPool.stop(this.config.compilerId);
};

HappyPlugin.prototype.compile = function(loader, loaderContext, done) {
  if (this.state.foregroundThreadPool) {
    return compileInForeground.call(this, loader, loaderContext, done);
  }
  else {
    return compileInBackground.call(this, loader, loaderContext, done);
  }
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

// convenience accessor to relieve people from requiring the file directly:
HappyPlugin.ThreadPool = HappyThreadPool;

function isVerbose(compiler, plugin) {
  return plugin.config.verbose && (
    !compiler.options.profile ||
    plugin.config.verboseWhenProfiling
  );
};

function isDebug(compiler, plugin) {
  return plugin.config.debug && (
    !compiler.options.profile ||
    plugin.config.verboseWhenProfiling
  );
};

function compileInBackground(loader, loaderContext, done) {
  var filePath = loaderContext.resourcePath;

  if (!this.cache.hasChanged(filePath) && !this.cache.hasErrored(filePath)) {
    var cached = readFromCache(this.cache, filePath);

    return done(null, cached.sourceCode, cached.sourceMap);
  }

  if (this.state.debug) {
    console.warn('File had changed, re-compiling... (%s)', filePath);
  }

  compileAndUpdateCache.call(this, this.threadPool, loader, loaderContext, done);
}

// compile the source using the foreground worker instead of sending to the
// background threads:
function compileInForeground(loader, loaderContext, done) {
  compileAndUpdateCache.call(this, this.state.foregroundThreadPool, loader, loaderContext, done);
}

function readFromCache(cache, filePath) {
  var cached = {};
  var sourceCodeFilePath = cache.getCompiledSourceCodePath(filePath);
  var sourceMapFilePath = cache.getCompiledSourceMapPath(filePath);

  cached.sourceCode = fs.readFileSync(sourceCodeFilePath, 'utf-8');

  if (HappyUtils.isReadable(sourceMapFilePath)) {
    cached.sourceMap = SourceMapSerializer.deserialize(
      fs.readFileSync(sourceMapFilePath, 'utf-8')
    );
  }

  return cached;
}

function compileAndUpdateCache(threadPool, loader, loaderContext, done) {
  var cache = this.cache;
  var filePath = loaderContext.resourcePath;

  cache.invalidateEntryFor(filePath);

  threadPool.compile(loaderContext.remoteLoaderId, loader, {
    loaders: this.state.loaders,
    compiledPath: path.resolve(this.config.tempDir, HappyUtils.generateCompiledPath(filePath)),
    loaderContext: loaderContext,
  }, function(result) {
    var contents = fs.readFileSync(result.compiledPath, 'utf-8')
    var compiledMap;

    if (!result.success) {
      cache.set(filePath, contents, null);

      done(contents);
    }
    else {
      cache.set(filePath, null, result.compiledPath);

      compiledMap = SourceMapSerializer.deserialize(
        fs.readFileSync(cache.getCompiledSourceMapPath(filePath), 'utf-8')
      );

      done(null, contents, compiledMap);
    }
  });
};

module.exports = HappyPlugin;
