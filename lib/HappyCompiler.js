var fs = require('fs');
var assert = require('assert');
var HappyCompilerThread = require('./HappyCompilerThread');

module.exports = function HappyCompiler(config) {
  var threads = createThreads(config.threads, config);
  var transform = require(config.transformer);
  var callbacks = {};

  function createThreads(count, config) {
    var set = []
    var threadHooks = {
      onFile: function(filePath, destFilePath, hasFailed) {
        var error;

        if (hasFailed) {
          error = fs.readFileSync(destFilePath, 'utf-8');
        }

        callbacks[filePath](error, error ? null : destFilePath);

        delete callbacks[filePath];
      },

      onError: throwError
    }

    for (var threadId = 0; threadId < count; ++threadId) {
      set.push(HappyCompilerThread(threadId, config, threadHooks));
    }

    return set;
  }

  var lastThreadId = 0;

  function getAvailableThread() {
    var threadId = lastThreadId;

    lastThreadId++;

    if (lastThreadId >= threads.length) {
      lastThreadId = 0;
    }

    return threads[threadId];
  }

  return {
    start: function() {
      threads.filter(not(send('isOpen'))).forEach(send('open'));
    },

    teardown: function() {
      threads.filter(send('isOpen')).map(send('close'));
    },

    getPendingQueueSizes: function() {
      return threads.map(send('getQueueSize'));
    },

    compileSync: function(filePath) {
      return transform(fs.readFileSync(filePath, 'utf-8'), filePath);
    },

    compile: function(filePath, callback) {
      var thread = getAvailableThread();

      assert(thread);

      assert(!callbacks[filePath]);
      callbacks[filePath] = callback;

      thread.compile([ filePath ]);
    }
  }
}

function send(method) {
  return function(receiver) {
    return receiver[method].call(receiver);
  };
}

function not(f) {
  return function(x) {
    return !f(x);
  };
}

function throwError(e) {
  throw e;
}