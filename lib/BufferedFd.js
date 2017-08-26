var processSend = require('./processSend')
var BufferedFd = exports

BufferedFd.of = function(fd) {
  return {
    descriptor: fd,
    queue: [],
  }
}

BufferedFd.send = function(fd, message, callback) {
  fd.queue.push([ message, callback ]);

  if (fd.queue.length === 1) {
    deliver(fd)
  }
}

BufferedFd.discard = function(fd) {
  fd.queue.splice(0)
}

function deliver(fd) {
  var item = fd.queue[0]

  processSend(fd.descriptor, item[0], function(err) {
    fd.queue.shift()

    item[1](err)

    process.nextTick(function() {
      if (fd.queue.length) {
        deliver(fd)
      }
    })
  })
}
