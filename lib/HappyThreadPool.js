var async = require('async');
var assert = require('assert');
var HappyThread = require('./HappyThread');

/**
 *
 * @param {Object} config
 * @param {Number} config.threads
 * @param {String} config.optionsPath
 *
 * @return {[type]}        [description]
 */
module.exports = function HappyThreadPool(config) {
  assert(!isNaN(config.size),
    "ArgumentError: HappyThreadPool requires a valid integer for its size, but got NaN."
  );

  assert(config.size > 0,
    "ArgumentError: HappyThreadPool requires a positive integer for its size " +
    ", but got {" + config.size + "}."
  );

  var threads = createThreads(config.size, config);

  return {
    size: config.size,

    start: function(done) {
      async.parallel(threads.filter(not(send('isOpen'))).map(get('open')), done);
    },

    configure: function(compilerOptions, done) {
      assert(!threads.some(not(send('isOpen'))),
        "ThreadPool must be started before attempting to configure it!"
      );

      async.parallel(threads.map(function(thread) {
        return function(callback) {
          thread.configure(compilerOptions, callback);
        }
      }), done);
    },

    isRunning: function() {
      return !threads.some(not(send('isOpen')));
    },

    stop: function() {
      threads.filter(send('isOpen')).map(send('close'));
    },

    get: RoundRobinThreadPool(threads)
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
