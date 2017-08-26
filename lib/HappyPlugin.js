var async = require('async');
var HappyThreadPool = require('./HappyThreadPool');
var HappyForegroundThreadPool = require('./HappyForegroundThreadPool');
var WebpackUtils = require('./WebpackUtils');
var OptionParser = require('./OptionParser');
var JSONSerializer = require('./JSONSerializer');
var SourceMapSerializer = require('./SourceMapSerializer');
var fnOnce = require('./fnOnce');
var ErrorSerializer = require('./ErrorSerializer');
var pick = require('./pick');
var pkg = require('../package.json');

function HappyPlugin(userConfig) {
  if (!(this instanceof HappyPlugin)) {
    return new HappyPlugin(userConfig);
  }

  this.name = 'HappyPack';
  this.state = {
    loaders: [],
    baseLoaderRequest: '',
    foregroundThreadPool: null,
    verbose: false,
    debug: false,
  };

  this.config = OptionParser(userConfig, {
    id:                       { type: 'string', default: '1' },
    compilerId:               { type: 'string', default: 'default' },
    tempDir:                  { deprecated: true },
    threads:                  { type: 'number', default: 3 },
    threadPool:               { type: 'object', default: null },
    cache:                    { deprecated: true },
    cachePath:                { deprecated: true },
    cacheContext:             { deprecated: true },
    cacheSignatureGenerator:  { deprecated: true },
    verbose:                  { type: 'boolean', default: true },
    verboseWhenProfiling:     { type: 'boolean', default: false },
    debug:                    { type: 'boolean', default: process.env.DEBUG === '1' },
    enabled:                  { deprecated: true },
    // we don't want this to be documented / exposed since it's an
    // implementation detail + not having it on means a bug, but we're making it
    // configurable for testing purposes
    bufferedMessaging:        { type: 'boolean', default: process.platform === 'win32' },
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
  }, "HappyPack");

  this.id = this.config.id;

  return this;
}

HappyPlugin.prototype.apply = function(compiler) {
  var that, engageWatchMode;

  that = this;

  this.state.verbose = isVerbose(compiler, this);
  this.state.debug = isDebug(compiler, this);

  this.threadPool = this.config.threadPool || HappyThreadPool({
    id: this.id,
    size: this.config.threads,
    verbose: this.state.verbose,
    debug: this.state.debug,
    bufferedMessaging: this.config.bufferedMessaging,
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
    console.log('Happy[%s]: Version: %s. Threads: %d%s',
      that.id, pkg.version,
      that.threadPool.size,
      that.config.threadPool ? ' (shared pool)' : ''
    );
  }

  async.series([
    function resolveLoaders(callback) {
      var normalLoaders = that.config.loaders.reduce(function(list, entry) {
        return list.concat(WebpackUtils.normalizeLoader(entry));
      }, []);

      var loaderPaths = normalLoaders.map(function(loader) {
        return loader.path;
      });

      WebpackUtils.resolveLoaders(compiler, loaderPaths, function(err, resolvedPaths) {
        if (err) return callback(err);

        var withResolvedPaths = normalLoaders.map(function(loader, index) {
          var resolvedPath = resolvedPaths[index];

          return Object.assign({}, loader, {
            path: resolvedPath,
            request: loader.query ? (loader.path + loader.query) : loader.path
          })
        })

        that.state.loaders = withResolvedPaths;
        that.state.baseLoaderRequest = withResolvedPaths.map(function(loader) {
          return loader.path + (loader.query || '');
        }).join('!');

        callback();
      });
    },

    function launchAndConfigureThreads(callback) {
      var serializedOptions;
      var compilerOptions = pick(HappyPlugin.SERIALIZABLE_OPTIONS)(compiler.options);

      try {
        serializedOptions = JSONSerializer.serialize(compilerOptions);
      }
      catch(e) {
        console.error('Happy[%s]: Internal error; unable to serialize options!!!', that.id);
        console.error(compilerOptions);

        return callback(e);
      }

      that.threadPool.start(that.config.compilerId, compiler, serializedOptions, callback);
    },

    function announceReadiness(callback) {
      if (that.state.verbose) {
        console.log('Happy[%s]: All set; signaling webpack to proceed.', that.id);
      }

      callback();
    }
  ], done);
};

HappyPlugin.prototype.stop = function() {
  this.threadPool.stop(this.config.compilerId);
};

HappyPlugin.prototype.compile = function(loader, loaderContext, done) {
  var threadPool = this.state.foregroundThreadPool || this.threadPool;

  threadPool.compile(loaderContext.remoteLoaderId, loader, {
    loaders: this.state.loaders,
    loaderContext: loaderContext,
  }, function(err, result) {
    if (err) {
      done(ErrorSerializer.deserialize(err));
    }
    else {
      done(null,
        result.compiledSource || '',
        SourceMapSerializer.deserialize(result.compiledMap)
      );
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

module.exports = HappyPlugin;
