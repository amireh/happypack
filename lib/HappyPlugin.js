var fs = require('fs');
var path = require('path');
var assert = require('assert');
var HappyThreadPool = require('./HappyThreadPool');
var HappyFSCache = require('./HappyFSCache');
var HappyUtils = require('./HappyUtils');
var JSONSerializer = require('./JSONSerializer');
var applyLoaders = require('./applyLoaders');
var pkg = require('../package.json');
var uid = 0;

/**
 * @param {Object} config
 * @param {Array.<String>} config.include
 *        List of absolute directory names!!!
 *
 * @param {Array.<String>} config.exclude
 *        List of absolute directory names!!!
 */
function HappyPlugin(config) {
  if (!(this instanceof HappyPlugin)) {
    return new HappyPlugin(config);
  }

  this.name = 'HappyPack';
  this.id = String(config.id || ++uid);

  assert(config.loaders && config.loaders.length > 0,
    "You must pass at least one loader module to HappyPlugin."
  );

  this.config = {};
  this.config.tempDir = String(config.tempDir || '.happypack');
  this.config.threads = Math.max(parseInt(config.threads, 10) || 0, 1);
  this.config.cache = config.cache !== false;
  this.config.cachePath = path.resolve(
    String(config.cachePath || this.config.tempDir),
    'cache--' + this.id + '.json'
  );

  this.config.optionsPath = path.resolve(
    this.config.tempDir,
    'options--' + this.id + '.json'
  );

  this.config.installExitHandler = config.installExitHandler;
  this.config.loaders = config.loaders;

  this.state = {
    started: false,
    initialBuildCompleted: false,
  };

  HappyUtils.mkdirSync(this.config.tempDir);

  this.cache = HappyFSCache(this.id, this.config.cachePath, this.config.loaders);

  return this;
}

HappyPlugin.prototype.apply = function(compiler) {
  var that = this;
  var state = this.state;
  var inWatchMode = Boolean(compiler.options.watch);

  this._compilerOptions = compiler.options;

  compiler.plugin('run', start);
  compiler.plugin('watch-run', start);

  compiler.plugin('compilation', function(compilation) {
    if (compiler.options.bail) {
      compilation.plugin('failed-module', teardown);
    }
  });

  compiler.plugin('done', function(/*stats*/) {
    teardown();

    state.initialBuildCompleted = true;
  });

  if (inWatchMode && this.config.installExitHandler !== false) {
    process.on('exit', teardown);
    process.on('SIGINT', function() {
      process.exit(0);
    });
  }

  function start(_, done) {
    if (that.state.started || that.state.initialBuildCompleted) {
      return done();
    }

    console.log('Happy[%s]: firing up! Version: %s', that.id, pkg.version);

    // serialize the options so that the workers can pick them up
    try {
      fs.writeFileSync(that.config.optionsPath, JSONSerializer.serialize({
        loaders: that.config.loaders,
        compilerOptions: HappyPlugin.extractOptions(compiler.options)
      }), 'utf-8');
    }
    catch(e) {
      console.error('Happy[%s]: unable to serialize options!!!', that.id);
      console.error(compiler.options || compiler);

      return done(e);
    }

    that.threadPool = HappyThreadPool(that.config);

    if (that.config.cache) {
      console.log('Happy[%s]: will be using the cache.', that.id);
      that.cache.load();
    }

    // TODO: we need to block webpack until we bootstrap
    that.threadPool.start(function(err) {
      if (err) { return done(err); }

      that.state.started = true;

      console.log('Happy[%s]: signalling webpack to start.', that.id);

      done();
    });
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

HappyPlugin.prototype.compile = function(source, map, filePath, done) {
  if (this.state.initialBuildCompleted) {
    return this.compileInForeground(source, map, filePath, done);
  }
  else {
    return this.compileInBackground(source, map, filePath, done);
  }
};

HappyPlugin.prototype.compileInBackground = function(source, map, filePath, done) {
  var cache = this.cache;

  if (!cache.hasChanged(filePath) && !cache.hasErrored(filePath)) {
    return done(null, fs.readFileSync(cache.getCompiledPath(filePath), 'utf-8'));
  }

  if (process.env.HAPPY_DEBUG) {
    console.warn('File had changed, re-compiling... (%s)', filePath);
  }

  this.cache.invalidateEntryFor(filePath);

  this.threadPool.getThread().compile(filePath, function(result) {
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

HappyPlugin.prototype.compileInForeground = function(source, map, filePath, done) {
  var options = {
    loaders: this.config.loaders,
    compilerOptions: this._compilerOptions
  };

  // in case the transformer errors, we don't want to hold on to the previously
  // successful version (if any)
  this.cache.invalidateEntryFor(filePath);

  applyLoaders(options, source, map, filePath, function(err, result) {
    if (err) {
      return done(err);
    }

    var compiledPath = path.resolve(
      this.config.tempDir,
      HappyUtils.generateCompiledPath(filePath)
    );

    fs.writeFileSync(compiledPath, result.code, 'utf-8');

    // TODO: SourceMaps??
    this.cache.updateMTimeFor(filePath, compiledPath);

    done(null, result.code, result.map);
  }.bind(this));
};

HappyPlugin.prototype.isAcceptingSyncRequests = function() {
  return !!this.state.initialBuildCompleted;
};

// export this so that users get to override if needed
HappyPlugin.SERIALIZABLE_OPTIONS = [
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

HappyPlugin.extractOptions = function(options) {
  var ALLOWED_KEYS = HappyPlugin.SERIALIZABLE_OPTIONS;

  return Object.keys(options).reduce(function(hsh, key) {
    if (ALLOWED_KEYS.indexOf(key) > -1) {
      hsh[key] = options[key];
    }

    return hsh;
  }, {});
};

module.exports = HappyPlugin;
