var fs = require('fs');
var assert = require('assert');
var async = require('async');
var HappyThread = require('./HappyThread');

module.exports = function HappyThreadPool(config) {
  var callbacks = {};
  var threads = createThreads(config.threads, config, {
    onFile: emitFileReady,
    onError: throwError
  });

  var lastThreadId = 0;

  function getAvailableThread() {
    var threadId = lastThreadId;

    lastThreadId++;

    if (lastThreadId >= threads.length) {
      lastThreadId = 0;
    }

    return threads[threadId];
  }

  function emitFileReady(filePath, compiledPath, hasFailed) {
    var error;

    if (hasFailed) {
      error = fs.readFileSync(compiledPath, 'utf-8');
    }

    assert(callbacks[filePath] instanceof Function,
      "HappyThreadPool: expected loader to be pending on source file '" +
      filePath + "'" + " (this is likely an internal error!)"
    );

    callbacks[filePath](error, error ? null : compiledPath);

    delete callbacks[filePath];
  }

  return {
    start: function(onStart) {
      async.parallel(threads.map(function(thread) {
        return function(done) {
          thread.open(done);
        }
      }), onStart);
    },

    isRunning: function() {
      return !threads.some(not(send('isOpen')));
    },

    stop: function() {
      threads.filter(send('isOpen')).map(send('close'));
    },

    compile: function(filePath, callback) {
      var thread = getAvailableThread();

      assert(thread);

      assert(!callbacks[filePath]);
      callbacks[filePath] = callback;

      // TODO since we're not batching anymore, the API doesn't need to accept
      // arrays really
      thread.compile([ filePath ]);
    }
  }
}

function createThreads(count, config, hooks) {
  var set = []

  for (var threadId = 0; threadId < count; ++threadId) {
    set.push(HappyThread(threadId, config, hooks));
  }

  return set;
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
