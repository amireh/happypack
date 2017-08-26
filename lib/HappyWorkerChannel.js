#!/usr/bin/env node

var JSONSerializer = require('./JSONSerializer');
var HappyFakeCompiler = require('./HappyFakeCompiler');
var HappyWorker = require('./HappyWorker');
var BufferedFd = require('./BufferedFd')
var UnbufferedFd = require('./UnbufferedFd')

if (process.argv[1] === __filename) {
  startAsWorker();
}

function startAsWorker() {
  HappyWorkerChannel(String(process.argv[2]), process, JSON.parse(process.argv[3] || '{}'));
}

function HappyWorkerChannel(id, fd, config) {
  var BufferedFdImpl = config && config.buffered ? BufferedFd : UnbufferedFd;
  var bfd = BufferedFdImpl.of(fd)
  var fakeCompilers = {};
  var workers = {};
  var logSendError = function(err) {
    if (err) {
      console.warn('HappyWorker[%s]: unable to send to master!', id, err)
    }
  }

  var send = function(message) {
    BufferedFdImpl.send(bfd, message, logSendError)
  }

  var handlers = {
    CONFIGURE: function(message) {
      findOrCreateFakeCompiler(message.data.compilerId)
        .configure(JSONSerializer.deserialize(message.data.compilerOptions))
      ;

      send({
        id: message.id,
        name: 'CONFIGURE_DONE'
      });
    },

    COMPILE: function(message) {
      getWorker(message.data.loaderContext.compilerId)
        .compile(message.data, function(err, data) {
          send({
            id: message.id,
            name: 'COMPILED',
            error: err,
            data: data
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

  fd.on('message', accept)

  send({ name: 'READY' });

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
        send: send
      });

      workers[compilerId] = new HappyWorker({
        compiler: fakeCompilers[compilerId]
      });
    }

    return fakeCompilers[compilerId];
  }
}

module.exports = HappyWorkerChannel;