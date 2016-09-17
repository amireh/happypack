#!/usr/bin/env node

var JSONSerializer = require('./JSONSerializer');
var HappyFakeCompiler = require('./HappyFakeCompiler');
var HappyWorker = require('./HappyWorker');

if (process.argv[1] === __filename) {
  startAsWorker();
}

function startAsWorker() {
  HappyWorkerChannel(String(process.argv[2]), process);
}

function HappyWorkerChannel(id, stream) {
  var fakeCompilers = {};
  var workers = {};
  var handlers = {
    CONFIGURE: function(message) {
      findOrCreateFakeCompiler(message.data.compilerId)
        .configure(JSONSerializer.deserialize(message.data.compilerOptions))
      ;

      stream.send({
        id: message.id,
        name: 'CONFIGURE_DONE'
      });
    },

    COMPILE: function(message) {
      getWorker(message.data.loaderContext.compilerId)
        .compile(message.data, function(result) {
          stream.send({
            id: message.id,
            name: 'COMPILED',
            sourcePath: result.sourcePath,
            compiledPath: result.compiledPath,
            success: result.success
          });
        })
      ;
    },

    COMPILER_RESPONSE: function(message) {
      getFakeCompiler(message.data.compilerId)
        ._handleResponse(message.id, message.data)
      ;
    },
  };

  stream.on('message', accept);
  stream.send({ name: 'READY' });

  function accept(message) {
    var handler = handlers[message.name];

    if (!handler) {
      console.warn('ignoring unknown message:', message);
    }
    else {
      handler(message);
    }
  }

  function getFakeCompiler(compilerId) {
    return fakeCompilers[compilerId];
  }

  function getWorker(compilerId) {
    return workers[compilerId];
  }

  function findOrCreateFakeCompiler(compilerId) {
    if (!fakeCompilers[compilerId]) {
      fakeCompilers[compilerId] = new HappyFakeCompiler({
        id: id,
        compilerId: compilerId,
        send: stream.send.bind(stream)
      });

      workers[compilerId] = new HappyWorker({
        compiler: fakeCompilers[compilerId]
      });
    }

    return fakeCompilers[compilerId];
  }
}

module.exports = HappyWorkerChannel;