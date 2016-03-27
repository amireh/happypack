var async = require('async');
var HappyThread = require('./HappyThread');

module.exports = function HappyThreadPool(config) {
  var threads = createThreads(config.threads, config);

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

    getThread: RoundRobinThreadPool(threads)
  };
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
