var fs = require('fs');
var Utils = require('./HappyUtils');
var assert = require('assert');

/**
 * @param {String} id
 *        HappyPack Plugin ID, for logging purposes.
 *
 * @param {Object} params
 * @param {String} params.path
 *        Absolute path to where the JSON representation of the cache should
 *        be stored. Path must be writable.
 *
 * @param {Object} params.context
 *        An object that should fully represent the context in which the plugin
 *        was run. This object will be used to determine whether previous cache
 *        entries are still valid or not.
 *
 *        This MUST be JSON-serializable!
 *
 */
module.exports = function HappyFSCache(id, params) {
  var exports = {};
  var cache = {
    context: params.context,
    mtimes: {}
  };

  assert(typeof params.path === 'string',
    "HappyFSCache requires a @path parameter that points to where it will be stored.");

  assert(typeof params.context === 'object' && !!params.context,
    "HappyFSCache requires a @context parameter to work.");

  exports.load = function() {
    var oldCache;

    if (Utils.isReadable(params.path)) {
      oldCache = JSON.parse(fs.readFileSync(params.path, 'utf-8'));

      if (toJSON(oldCache.context) === toJSON(cache.context)) {
        cache.mtimes = oldCache.mtimes;

        var staleEntryCount = removeStaleEntries(cache.mtimes);

        console.log('Happy[%s]: Loaded %d entries from cache. (%d were stale)',
          id, Object.keys(cache.mtimes).length, staleEntryCount
        );
      }
      else {
        console.log('Happy[%s]: Cache is no longer valid, starting fresh.', id);
      }
    }
    else {
      console.log('Happy[%s]: No cache was found, starting fresh.', id);
    }
  };

  exports.save = function() {
    fs.writeFileSync(params.path, JSON.stringify(cache));
  };

  exports.getCompiledPath = function(filePath) {
    return cache.mtimes[filePath] && cache.mtimes[filePath].compiledPath;
  };

  exports.hasChanged = function(filePath) {
    var nowMTime = getMTime(filePath);
    var lastMTime = getMTimeAtCompilationTime(filePath);

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
      mtime: getMTime(filePath),
      compiledPath: compiledPath,
      error: error
    };
  };

  exports.dump = function() {
    return cache;
  };

  function getMTimeAtCompilationTime(filePath) {
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

function removeStaleEntries(mtimes) {
  var filePaths = Object.keys(mtimes);

  return filePaths.reduce(function(acc, filePath) {
    var entry = mtimes[filePath];

    if (!Utils.isReadable(filePath) || !Utils.isReadable(entry.compiledPath)) {
      delete mtimes[filePath];
      return acc + 1;
    }

    return acc;
  }, 0);
}
