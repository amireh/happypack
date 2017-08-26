var async = require('async');
var assert = require('assert');
var HappyRPCHandler = require('./HappyRPCHandler');
var HappyThread = require('./HappyThread');

/**
 * Create a thread pool that can be shared between multiple plugin instances.
 *
 * @param {Object} config
 * @param {Number!} config.size
 *        The number of background threads to spawn for running loaders.
 *
 * @param {String?} config.id
 *        Used for prefixing the thread IDs. This is only used for logging
 *        purposes and does not affect the functionality.
 *
 * @param {Boolean?} [config.verbose=false]
 *        Allow this module and threads to log information to the console.
 *
 * @param {Boolean?} [config.debug=false]
 *        Allow this module and threads to log debugging information to the
 *        console.
 *
 * @param {Boolean?} [config.bufferedMessaging=false]
 *        Compatibility mode for fork() on Windows where message exchange
 *        between the master and worker processes is done serially.
 *
 *        This should be turned on if you're on Windows otherwise the process
 *        could hang!
 */
module.exports = function HappyThreadPool(config) {
  var rpcHandler = new HappyRPCHandler();

  assert(!isNaN(config.size),
    "ArgumentError: HappyThreadPool requires a valid integer for its size, but got NaN."
  );

  assert(config.size > 0,
    "ArgumentError: HappyThreadPool requires a positive integer for its size " +
    ", but got {" + config.size + "}."
  );

  var threads = createThreads(config.size, rpcHandler, {
    id: config.id,
    verbose: config.verbose,
    debug: config.debug,
    buffered: config.hasOwnProperty('bufferedMessaging') ?
      config.bufferedMessaging :
      process.platform === 'win32',
  });

  var getThread = RoundRobinThreadPool(threads);

  return {
    size: config.size,

    start: function(compilerId, compiler, compilerOptions, done) {
      rpcHandler.registerActiveCompiler(compilerId, compiler);

      async.parallel(threads.filter(not(send('isOpen'))).map(get('open')), function(err) {
        if (err) {
          return done(err);
        }

        async.parallel(threads.map(function(thread) {
          return function(callback) {
            thread.configure(compilerId, compilerOptions, callback);
          }
        }), done);
      });
    },

    isRunning: function() {
      return !threads.some(not(send('isOpen')));
    },

    compile: function(loaderId, loader, params, done) {
      var worker = getThread();

      rpcHandler.registerActiveLoader(loaderId, loader);

      worker.compile(params, function(message) {
        rpcHandler.unregisterActiveLoader(loaderId);

        done(message.error, message.data);
      });
    },

    stop: function(compilerId) {
      rpcHandler.unregisterActiveCompiler(compilerId);

      if (!rpcHandler.isActive()) {
        threads.filter(send('isOpen')).map(send('close'));
      }
    },
  };
}

function createThreads(count, rpcHandler, config) {
  var set = []

  for (var threadId = 0; threadId < count; ++threadId) {
    var fullThreadId = config.id ? [ config.id, threadId ].join(':') : threadId;
    set.push(HappyThread(fullThreadId, rpcHandler, config));
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
