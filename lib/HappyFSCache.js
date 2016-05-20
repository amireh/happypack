var fs = require('fs');
var Utils = require('./HappyUtils');
var assert = require('assert');

/**
 * @param {Object} config
 * @param {String} config.id
 *        HappyPack Plugin ID, for logging purposes.
 *
 * @param {Boolean} config.verbose
 * @param {Function?} config.generateSignature
 * @param {String} config.path
 *        Absolute path to where the JSON representation of the cache should
 *        be stored. Path must be writable.
 *
 */
module.exports = function HappyFSCache(config) {
  var exports = {};
  var id = config.id;
  var cachePath = config.path;
  var cache = { context: {}, mtimes: {} };
  var generateSignature = config.generateSignature || getMTime;

  assert(typeof cachePath === 'string',
    "HappyFSCache requires a @path parameter that points to where it will be stored.");

 /**
  * @param {Object} params.context
  *        An object that should fully represent the context in which the plugin
  *        was run. This object will be used to determine whether previous cache
  *        entries are still valid or not.
  *
  *        This MUST be JSON-serializable!
  *
  * @return {Boolean}
  *         Whether the cache was loaded from disk.
  */
  exports.load = function(currentContext) {
    var oldCache, staleEntryCount;

    cache.context = currentContext;

    assert(typeof currentContext === 'object' && !!currentContext,
      "HappyFSCache requires a @context parameter to work.");

    if (!Utils.isReadable(cachePath)) {
      if (config.verbose) {
        console.log('Happy[%s]: No cache was found, starting fresh.', id);
      }

      return false;
    }

    try {
      oldCache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    } catch(e) {
      oldCache = null;
    }

    if (!oldCache || toJSON(oldCache.context) !== toJSON(currentContext)) {
      if (config.verbose) {
        console.log('Happy[%s]: Cache is no longer valid, starting fresh.', id);
      }

      return false;
    }

    cache.mtimes = oldCache.mtimes;
    cache.context = currentContext;

    staleEntryCount = removeStaleEntries(cache.mtimes, generateSignature);

    if (config.verbose) {
      console.log('Happy[%s]: Loaded %d entries from cache. (%d were stale)',
        id,
        Object.keys(cache.mtimes).length,
        staleEntryCount
      );
    }

    return true;
  };

  exports.save = function() {
    fs.writeFileSync(cachePath, JSON.stringify(cache));
  };

  exports.getCompiledSourceCodePath = function(filePath) {
    return cache.mtimes[filePath] && cache.mtimes[filePath].compiledPath;
  };

  exports.getCompiledSourceMapPath = function(filePath) {
    return cache.mtimes[filePath] && cache.mtimes[filePath].compiledPath + '.map';
  };

  exports.hasChanged = function(filePath) {
    var nowMTime = generateSignature(filePath);
    var lastMTime = getSignatureAtCompilationTime(filePath);

    return nowMTime !== lastMTime;
  };

  exports.hasErrored = function(filePath) {
    return cache.mtimes[filePath] && cache.mtimes[filePath].error;
  };

  exports.invalidateEntryFor = function(filePath) {
    delete cache.mtimes[filePath];
  };

  exports.updateMTimeFor = function(filePath, compiledPath, error) {
    cache.mtimes[filePath] = {
      mtime: generateSignature(filePath),
      compiledPath: compiledPath,
      error: error
    };
  };

  exports.dump = function() {
    return cache;
  };

  function getSignatureAtCompilationTime(filePath) {
    if (cache.mtimes[filePath]) {
      return cache.mtimes[filePath].mtime;
    }
  }

  return exports;
}

function toJSON(object) {
  return JSON.stringify(object);
}

function getMTime(filePath) {
  try {
    return fs.statSync(filePath).mtime.getTime();
  }
  catch (e) {
    return -1;
  }
}

function removeStaleEntries(mtimes, generateSignature) {
  return Object.keys(mtimes).reduce(function(acc, filePath) {
    var entry = mtimes[filePath];

    if (isStale(entry, filePath)) {
      delete mtimes[filePath];
      return acc + 1;
    }

    return acc;
  }, 0);

  function isStale(entry, filePath) {
    return (
      // was the source removed?
      !Utils.isReadable(filePath)
      // was the compiled version removed or never created?
      || !Utils.isReadable(entry.compiledPath)
      // has source been modified since we last compiled it?
      || entry.mtime !== generateSignature(filePath)
    );
  }
}
