var UnbufferedFd = exports

UnbufferedFd.of = function(fd) {
  return fd
}

UnbufferedFd.send = function(fd, message, callback) {
  fd.send(message, undefined, undefined, callback)
}

UnbufferedFd.discard = function() {
}