var assert = require('assert');

function HappyCompilerDelegate(id, stream) {
  this._id = id;
  this._stream = stream;
  this._requests = {};
  this._messageId = 0;

  stream.on('message', this._acceptSelfOriginatedMessage.bind(this))
}

var HCDPt = HappyCompilerDelegate.prototype;

/**
 * @public
 *
 * @param  {String}   context
 * @param  {String}   resource
 * @param  {Function} done
 *
 * @param {String} [done.error=null]
 *        A resolving error, if any.
 *
 * @param {String} done.filePath
 *        The resolved file path.
 */
HCDPt.resolve = function(context, resource, done) {
  this._sendMessage('resolve', {
    context: context,
    resource: resource
  }, done);
};

// @private
HCDPt._acceptSelfOriginatedMessage = function(message) {
  if (!message.id || !this._requests[message.id]) return; // not for us

  assert(message.payload.hasOwnProperty('error'),
    "Compiler message payload must contain an @error field!");

  assert(message.payload.hasOwnProperty('result'),
    "Compiler message payload must contain a @result field!");

  var callback = this._requests[message.id];
  delete this._requests[message.id];

  callback(message.payload.error, message.payload.result);
};

// @private
HCDPt._sendMessage = function(type, payload, done) {
  var messageId = [ this._id, ++this._messageId ].join('__');

  this._requests[messageId] = done;
  this._stream.send({
    _compilerRequest: true,
    id: messageId,
    type: type,
    payload: payload
  });
};

module.exports = HappyCompilerDelegate;