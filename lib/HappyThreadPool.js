var async = require('async');
var assert = require('assert');
var HappyThread = require('./HappyThread');
var ErrorSerializer = require('./ErrorSerializer');
var compilationId = 0;

/**
 * @param {Object} config
 * @param {Number} config.threads
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
  var activeCompiler;

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

    /**
     * @idempotent
     *
     * @param {Webpack.Compiler} compiler
     */
    bind: function(compiler) {
      // Since a ThreadPool can be shared by multiple plugins, we need to make
      // sure we don't run this more than once for any single compiler instance:
      if (activeCompiler === compiler) {
        return;
      }

      activeCompiler = compiler;
      activeCompiler.plugin('after-compile', function(compilation, callback) {
        console.log('applying "after-compile"...')
        // console.log(compilation)
        // console.log(compilation.modules[0])
        var params = {
          compilation: {
            id: String(process.pid) + String(compilationId++),
            errors: compilation.errors.map(ErrorSerializer.serialize),
            modules: compilation.modules.map(function(x) {
              return {
                id: x.id,
                errors: x.errors.map(ErrorSerializer.serialize),
                warnings: x.warnings.map(ErrorSerializer.serialize),
                resource: x.resource,
                request: x.request,
                userRequest: x.userRequest,
                rawRequest: x.rawRequest,
              };
            })
          }
        };

        async.series(threads.filter(send('isOpen')).map(function(thread) {
          return async.apply(thread.applyPluginInBackground, 'after-compile', params);
        }), function(rawError) {
          callback(ErrorSerializer.deserialize(rawError));
        });
      });
    },

    isRunning: function() {
      return !threads.some(not(send('isOpen')));
    },

    stop: function() {
      activeCompiler = null;

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
