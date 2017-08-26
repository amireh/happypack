var path = require('path');
var fork = require('child_process').fork;
var assert = require('assert');
var Once = require('./fnOnce');
var WORKER_BIN = path.resolve(__dirname, 'HappyWorkerChannel.js');
var BufferedFd = require('./BufferedFd')
var UnbufferedFd = require('./UnbufferedFd')

/**
 * @param {String|Number} id
 * @param {Object?} config
 * @param {Boolean} [config.verbose=false]
 * @param {Boolean} [config.debug=false]
 * @param {Boolean} [config.buffered=false]
 */
function HappyThread(id, happyRPCHandler, _config) {
  var fd, bfd;
  var config = _config || {};
  var BufferedFdImpl = config.buffered ? BufferedFd : UnbufferedFd;
  var callbacks = {};
  var generateMessageId = (function() {
    var counter = 0;

    return function() {
      var nextId = ++counter;

      return 'Thread::' + id.toString() + ':' + nextId.toString();
    }
  }());

  var logSendError = function(err) {
    if (err) {
      console.error('HappyThread[%s]: unable to send to worker!', id, err)
    }
  }

  var send = function(message) {
    BufferedFdImpl.send(bfd, message, logSendError)
  }

  return {
    open: function(onReady) {
      var emitReady = Once(onReady);

      fd = fork(WORKER_BIN, [id, JSON.stringify({ buffered: config.buffered })], {
        // Do not pass through any arguments that were passed to the main
        // process (webpack or node) because they could have unwanted
        // side-effects, see issue #47
        execArgv: [],
      });

      fd.on('error', throwError);
      fd.on('exit', function(exitCode) {
        if (exitCode !== 0) {
          emitReady('HappyPack: worker exited abnormally with code ' + exitCode);
        }
      });

      bfd = BufferedFdImpl.of(fd)

      fd.on('message', function(message) {
        if (message.name === 'READY') {
          if (config.debug) {
            console.info('HappyThread[%s] is now open.', id);
          }

          emitReady();
        }
        else if (message.name === 'CONFIGURE_DONE') {
          assert(typeof callbacks[message.id] === 'function',
            "HappyThread: expected plugin to be awaiting a configuration ACK."
          );

          callbacks[message.id]();
          delete callbacks[message.id];
        }
        else if (message.name === 'COMPILED') {
          if (config.debug) {
            console.log('HappyThread[%s]: a file has been compiled. (request=%s)', id, message.id);
          }

          assert(typeof callbacks[message.id] === 'function',
            "HappyThread: expected loader to be pending on source file but wasn't! (this is likely an internal error!)"
          );

          callbacks[message.id](message);
          delete callbacks[message.id];
        }
        else if (message.name === 'COMPILER_REQUEST') {
          if (config.debug) {
            console.log('HappyThread[%s]: forwarding compiler request from worker to plugin:', id, message);
          }

          // TODO: DRY alert, see .createForegroundWorker() in HappyPlugin.js
          happyRPCHandler.execute(message.data.type, message.data.payload, function(error, result) {
            send({
              id: message.id, // downstream id
              name: 'COMPILER_RESPONSE',
              data: {
                compilerId: message.data.compilerId,
                payload: {
                  error: error || null,
                  result: result || null
                }
              }
            });
          });
        }
      });
    },

    configure: function(compilerId, compilerOptions, done) {
      var messageId = generateMessageId();

      callbacks[messageId] = done;

      send({
        id: messageId,
        name: 'CONFIGURE',
        data: {
          compilerId: compilerId,
          compilerOptions: compilerOptions
        }
      });
    },

    /**
     * @param {Object} params
     * @param {String} params.compiledPath
     * @param {Object} params.loaderContext
     *
     * @param {Function} done
     */
    compile: function(params, done) {
      var messageId = generateMessageId();

      assert(params.loaderContext && typeof params.loaderContext === 'object');
      assert(!!fd, "You must launch a compilation thread before attempting to use it!!!");

      callbacks[messageId] = done;

      if (config.debug) {
        console.log('HappyThread[%s]: compiling "%s"... (request=%s)', id, params.loaderContext.resourcePath, messageId);
      }

      send({
        id: messageId,
        name: 'COMPILE',
        data: params,
      });
    },

    isOpen: function() {
      return !!fd;
    },

    close: function() {
      BufferedFdImpl.discard(bfd);

      bfd = null;

      fd.kill('SIGINT');
      fd = null;

      if (config.debug) {
        console.info('HappyThread[%s] is now closed.', id);
      }
    },
  };
}

module.exports = HappyThread;

function throwError(e) {
  throw e;
}
