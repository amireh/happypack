var UnbufferedFd = exports
var processSend = require('./processSend')

UnbufferedFd.of = function(fd) {
  return fd
}

UnbufferedFd.send = function(fd, message, callback) {
  processSend(fd, message, callback)
}

UnbufferedFd.discard = function() {
}