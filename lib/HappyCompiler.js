var fs = require('fs');
var assert = require('assert');
var HappyCompilerThread = require('./HappyCompilerThread');

module.exports = function HappyCompiler(config) {
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
      "HappyCompiler: expected loader to be pending on source file '" +
      filePath + "'" + " (this is likely an internal error!)"
    );

    callbacks[filePath](error, error ? null : compiledPath);

    delete callbacks[filePath];
  }

  return {
    start: function() {
      threads.filter(not(send('isOpen'))).forEach(send('open'));
    },

    teardown: function() {
      threads.filter(send('isOpen')).map(send('close'));
    },

    compileSync: function(filePath) {
      var transform = require(config.transformer);

      return transform(fs.readFileSync(filePath, 'utf-8'), filePath);
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
    set.push(HappyCompilerThread(threadId, config, hooks));
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
