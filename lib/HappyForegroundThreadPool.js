var HappyFakeCompiler = require('./HappyFakeCompiler');
var HappyRPCHandler = require('./HappyRPCHandler');
var HappyWorker = require('./HappyWorker');

/**
 * Create a thread pool that can be shared between multiple plugin instances.
 *
 * @param {Object} config
 *
 * @param {Array.<String>} config.loaders
 *        The loaders to configure the (foreground) worker with.
 */
function HappyForegroundThreadPool(config) {
  var rpcHandler, worker;

  return {
    size: config.size,

    start: function(compilerId, compiler, compilerOptions, done) {
      var fakeCompiler = new HappyFakeCompiler({
        id: 'foreground',
        compilerId: compilerId,
        send: function executeCompilerRPC(message) {
          // TODO: DRY alert, see HappyThread.js
          rpcHandler.execute(message.data.type, message.data.payload, function serveRPCResult(error, result) {
            fakeCompiler._handleResponse(message.id, {
              payload: {
                error: error || null,
                result: result || null
              }
            });
          });
        }
      });

      fakeCompiler.configure(compiler.options);

      rpcHandler = new HappyRPCHandler();
      rpcHandler.registerActiveCompiler(compilerId, compiler);

      worker = new HappyWorker({
        compiler: fakeCompiler,
        loaders: config.loaders
      });

      done();
    },

    isRunning: function() {
      return !!worker;
    },

    stop: function(/*compilerId*/) {
      worker = null;
      rpcHandler = null;
    },

    compile: function(loaderId, loader, params, done) {
      rpcHandler.registerActiveLoader(loaderId, loader);

      worker.compile(params, function(error, data) {
        rpcHandler.unregisterActiveLoader(loaderId);

        done(error, data);
      });
    },
  };
}

module.exports = HappyForegroundThreadPool;