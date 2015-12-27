var fs = require('fs');
var path = require('path');
var assert = require('assert');
var HappyCompiler = require('./HappyCompiler');
var HappyFSCache = require('./HappyFSCache');
var HappyUtils = require('./HappyUtils');
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
  this.name = 'HappyPack';
  this.id = String(config.id || ++uid);

  assert(config.transformer,
    "You must pass a path to a transformer module in the @transformer config parameter."
  );

  this.config = {};
  this.config.tempDir = String(config.tempDir || '.happypack');
  this.config.threads = Math.max(parseInt(config.threads, 10) || 0, 1);
  this.config.cache = Boolean(config.cache);
  this.config.cachePath = String(config.cachePath || '.happypack/cache--' + this.id + '.json');
  this.config.transformer = config.transformer;
  this.config.installExitHandler = config.installExitHandler;

  this.state = {
    initialBuildCompleted: false,
  };

  this.cache = HappyFSCache(this.id, this.config.cachePath, this.config.transformer);
  this.compiler = HappyCompiler(this.config);

  try {
    fs.mkdirSync(this.config.tempDir);
  }
  catch (e) {
    if (!e.message.match('EEXIST')) {
      throw e;
    }
  }

  if (this.config.cache) {
    console.log('Happy[%s]: will be using the cache.', this.id);
    this.cache.load();
  }

  this.compiler.start();

  return this;
}

HappyPlugin.prototype.apply = function(compiler) {
  var that = this;
  var state = this.state;
  var inWatchMode = Boolean(compiler.options.watch);

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

  function teardown() {
    if (that.config.cache) {
      that.cache.save();
    }

    that.compiler.teardown();
  }
};

HappyPlugin.prototype.compile = function(filePath, done) {
  var cache = this.cache;

  if (!cache.hasChanged(filePath) && !cache.hasErrored(filePath)) {
    return done(null, cache.getCompiledPath(filePath));
  }

  this.cache.invalidateEntryFor(filePath);

  this.compiler.compile(filePath, function(err, compiledFilePath) {
    if (err) {
      cache.updateMTimeFor(filePath, null, err);
    }
    else {
      cache.updateMTimeFor(filePath, compiledFilePath);
    }

    done(err, compiledFilePath);
  });
};

HappyPlugin.prototype.compileSync = function(filePath) {
  // in case the transformer errors, we don't want to hold on to the previously
  // successful version (if any)
  this.cache.invalidateEntryFor(filePath);

  var compiled = this.compiler.compileSync(filePath);
  var compiledPath = path.resolve(this.config.tempDir, HappyUtils.generateCompiledPath(filePath));

  fs.writeFileSync(compiledPath, compiled, 'utf-8');

  this.cache.updateMTimeFor(filePath, compiledPath);

  return compiled;
};

HappyPlugin.prototype.isAcceptingSyncRequests = function() {
  return !!this.state.initialBuildCompleted;
};

module.exports = HappyPlugin;