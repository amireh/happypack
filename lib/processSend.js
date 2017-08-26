// node v4 accepted only 3 arguments while later versions accept 4, but the
// callback is always the last
module.exports = function processSend(fd, message, callback) {
  if (fd.send.length === 3) {
    return fd.send(message, undefined, callback)
  }
  else {
    return fd.send(message, undefined, undefined, callback)
  }
}