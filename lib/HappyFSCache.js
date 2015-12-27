var fs = require('fs');
var Utils = require('./HappyUtils');

module.exports = function HappyFSCache(cachePath) {
  var exports = {};
  var cache = { mtimes: {} };

  exports.load = function() {
    if (Utils.isReadable(cachePath)) {
      cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      cache.mtimes = cache.mtimes || {};

      removeStaleEntries(cache.mtimes);

      console.log('Happy: Loaded %d entries from cache', Object.keys(cache.mtimes).length);
    }
  };

  exports.save = function() {
    fs.writeFileSync(cachePath, JSON.stringify(cache));
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

  function getMTime(filePath) {
    try {
      return fs.statSync(filePath).mtime.getTime();
    }
    catch (e) {
      return -1;
    }
  }

  function getMTimeAtCompilationTime(filePath) {
    if (cache.mtimes[filePath]) {
      return cache.mtimes[filePath].mtime;
    }
  }

  function removeStaleEntries(mtimes) {
    var filePaths = Object.keys(mtimes);

    filePaths.forEach(function(filePath) {
      var entry = mtimes[filePath];

      if (!Utils.isReadable(filePath) || !Utils.isReadable(entry.compiledPath)) {
        delete mtimes[filePath];
      }
    });
  }

  return exports;
}
