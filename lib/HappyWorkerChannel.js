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
  var fakeCompiler = new HappyFakeCompiler(id, stream.send.bind(stream));
  var worker = new HappyWorker({ compiler: fakeCompiler });

  stream.on('message', accept);
  stream.send({ name: 'READY' });

  function accept(message) {
    if (message.name === 'COMPILE') {
      worker.compile(message.data, function(result) {
        stream.send({
          id: message.id,
          name: 'COMPILED',
          sourcePath: result.sourcePath,
          compiledPath: result.compiledPath,
          success: result.success
        });
      });
    }
    else if (message.name === 'COMPILER_RESPONSE') {
      fakeCompiler._handleResponse(message.id, message.data);
    }
    else if (message.name === 'CONFIGURE') {
      fakeCompiler.configure(JSONSerializer.deserialize(message.data.compilerOptions));

      stream.send({
        name: 'CONFIGURE_DONE'
      });
    }
    else {
      console.warn('ignoring unknown message:', message);
    }
  }
}

module.exports = HappyWorkerChannel;