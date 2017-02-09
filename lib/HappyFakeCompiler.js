var assert = require('assert');
var fs = require('fs');

/**
 * @param {String} params.id
 * @param {String} params.compilerId
 * @param {Function} params.send
 */
function HappyFakeCompiler(params) {
  assert(typeof params.id === 'string',
    "id must be assigned to a HappyFakeCompiler.");

  assert(typeof params.compilerId === 'string',
    "compilerId must be assigned to a HappyFakeCompiler.");

  assert(typeof params.send === 'function',
    "send implementation must be assigned to a HappyFakeCompiler.");

  this._id = 'FakeCompiler::' + params.id.toString() + '-' + params.compilerId.toString();
  this._compilerId = params.compilerId;
  this._sendMessageImpl = params.send;
  this._requests = {};
  this._messageId = 0;
  this.options = {};
  this.context = null;
  this.inputFileSystem = fs;
}

var HFCPt = HappyFakeCompiler.prototype;

HFCPt.configure = function(compilerOptions) {
  assert(compilerOptions && typeof compilerOptions === 'object');

  this.options = compilerOptions;
  this.context = compilerOptions.context;
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
HFCPt._handleResponse = function(id, message) {
  var callback;

  if (!this._requests[id]) return; // not for us

  assert(message.payload.hasOwnProperty('error'),
    "Compiler message payload must contain an @error field!");

  assert(message.payload.hasOwnProperty('result'),
    "Compiler message payload must contain a @result field!");

  callback = this._requests[id];
  delete this._requests[id];

  callback(message.payload.error, message.payload.result);
};

// @private
HFCPt._sendMessage = function(type, payload, done) {
  var messageId = this._id + ':' + (++this._messageId).toString();

  this._requests[messageId] = done;
  this._sendMessageImpl({
    id: messageId,
    name: 'COMPILER_REQUEST',
    data: {
      type: type,
      compilerId: this._compilerId,
      payload: payload,
    }
  });
};

module.exports = HappyFakeCompiler;