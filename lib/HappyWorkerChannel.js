#!/usr/bin/env node

var fs = require('fs');
var JSONSerializer = require('./JSONSerializer');
var HappyFakeCompiler = require('./HappyFakeCompiler');
var HappyWorker = require('./HappyWorker');

if (process.argv[1] === __filename) {
  startAsWorker();
}

function startAsWorker() {
  var id = String(process.argv[2]);
  var optionsFilePath = process.argv[3];
  var options = JSONSerializer.deserialize(fs.readFileSync(optionsFilePath, 'utf-8'));

  start(id, process, options);
}

function start(id, stream, options) {
  var fakeCompiler = new HappyFakeCompiler(id, stream.send.bind(stream));
  var worker = new HappyWorker(options, fakeCompiler);

  stream.on('message', function(message) {
    try {
      accept(message);
    }
    catch(e) {
      console.error(e);
    }
  });

  stream.send({ name: 'READY' });

  function accept(message) {
    if (message.name === 'COMPILER_RESPONSE') {
      fakeCompiler._handleResponse(message.data);
    }
    else if (message.name === 'COMPILE') {
      worker.compile(message, function(err, result) {
        stream.send({
          name: 'COMPILED',
          sourcePath: result.sourcePath,
          compiledPath: result.compiledPath,
          success: result.success
        });
      });
    }
    else {
      console.warn('ignoring unknown message:', message);
    }
  }
}

module.exports = start;