var assert = require('assert');
var fs = require('fs');

function HappyFakeCompiler(id, sendMessageImpl) {
  assert(typeof sendMessageImpl === 'function');

  this._id = id;
  this._sendMessageImpl = sendMessageImpl;
  this._requests = {};
  this._messageId = 0;
  this.options = {};
  this.inputFileSystem = fs;
}

var HFCPt = HappyFakeCompiler.prototype;

HFCPt.configure = function(compilerOptions) {
  assert(compilerOptions && typeof compilerOptions === 'object');

  this.options = compilerOptions;
};

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
HFCPt.resolve = function(context, resource, done) {
  this._sendMessage('resolve', {
    context: context,
    resource: resource
  }, done);
};

// @private
HFCPt._handleResponse = function(message) {
  var callback;

  if (!message.id || !this._requests[message.id]) return; // not for us

  assert(message.payload.hasOwnProperty('error'),
    "Compiler message payload must contain an @error field!");

  assert(message.payload.hasOwnProperty('result'),
    "Compiler message payload must contain a @result field!");

  callback = this._requests[message.id];
  delete this._requests[message.id];

  callback(message.payload.error, message.payload.result);
};

// @private
HFCPt._sendMessage = function(type, payload, done) {
  var messageId = [ this._id, ++this._messageId ].join('__');

  this._requests[messageId] = done;
  this._sendMessageImpl({
    name: 'COMPILER_REQUEST',
    data: {
      id: messageId,
      type: type,
      payload: payload,
    }
  });
};

module.exports = HappyFakeCompiler;