var async = require('async');
var assert = require('assert');
var HappyThread = require('./HappyThread');

module.exports = function HappyThreadPool(config) {
  var threads = createThreads(config.threads, config, handleCompilerRequest);
  var compilerRequestHandler = null;

  return {
    start: function(onStart) {
      async.parallel(threads.filter(not(send('isOpen'))).map(get('open')), onStart);
    },

    isRunning: function() {
      return !threads.some(not(send('isOpen')));
    },

    stop: function() {
      threads.filter(send('isOpen')).map(send('close'));
    },

    getAll: function() { return threads; },

    hasCompilerRequestHandler: function() {
      return !!compilerRequestHandler;
    },

    registerCompilerRequestHandler: function(_compilerRequestHandler) {
      compilerRequestHandler = _compilerRequestHandler;
    },

    getThread: RoundRobinThreadPool(threads)
  };

  function handleCompilerRequest(type, payload, done) {
    assert(!!compilerRequestHandler,
      "Expected a plugin compiler request handler to have been registered, " +
      "but none was! This is an internal HappyPack error."
    );

    compilerRequestHandler(type, payload, done);
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

function get(attr) {
  return function(object) {
    return object[attr];
  };
}

function not(f) {
  return function(x) {
    return !f(x);
  };
}

function RoundRobinThreadPool(threads) {
  var lastThreadId = 0;

  return function getThread() {
    var threadId = lastThreadId;

    lastThreadId++;

    if (lastThreadId >= threads.length) {
      lastThreadId = 0;
    }

    return threads[threadId];
  }
}
