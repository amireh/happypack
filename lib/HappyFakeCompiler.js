var assert = require('assert');
var fs = require('fs');
var async = require('async');
var ErrorSerializer = require('./ErrorSerializer');

function HappyFakeCompiler(id, sendMessageImpl) {
  assert(typeof sendMessageImpl === 'function');

  this._id = id;
  this._sendMessageImpl = sendMessageImpl;
  this._requests = {};
  this._messageId = 0;
  this._plugins = {
    'after-compile': [],
    'watch-run': [],
  };
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

HFCPt.plugin = function(phase, executor) {
  if (phase in this._plugins) {
    this._plugins[phase].push(executor);
  }
  else {
    console.warn("this._compiler.plugin(\"%s\") is not supported in HappyPack.", phase);
  }
};

HFCPt.isChild = function() {
  return false;
};

HFCPt.applyPlugin = function(phase, params, done) {
  var hooks = this._plugins[phase];

  if (!hooks) {
    return done();
  }

  if (phase === 'after-compile') {
    var compilationDelegate = {
      happypack: true,
      compiler: this,
      id: params.compilation.id,
      modules: params.compilation.modules,
      errors: params.compilation.errors,
      addError: function(err) {
        this._sendMessage('compilation:addError', {
          error: ErrorSerializer.serialize(err)
        });
      }.bind(this),

      purgeErrors: function(matcher) {
        this._sendMessage('compilation:purgeErrors', { matcher: matcher });
      }.bind(this),

      addModuleError: function(err, module) {
        this._sendMessage('compilation:addModuleError', {
          error: ErrorSerializer.serialize(err),
          moduleId: module.id
        });
      }.bind(this),

      purgeModuleErrors: function(module, matcher) {
        this._sendMessage('compilation:purgeModuleErrors', {
          moduleId: module.id,
          matcher: matcher,
        });
      }.bind(this),

      addFileDependency: function(files, options) {
        this._sendMessage('compilation:addFileDependency', {
          files: files,
          options: options || {}
        });
      }.bind(this),

      addAsset: function(assetPath, asset) {
        this._sendMessage('compilation:addAsset', {
          assetPath: assetPath,
          source: asset.source,
          size: asset.size,
        });
      }.bind(this),
    };

    async.series(hooks.map(function(hook) {
      return async.apply(hook, compilationDelegate);
    }), done);
  }
  else if (phase === 'watch-run') {
    var watchingDelegate = {
      happypack: true,
      compiler: this,
      mtimes: params.watching.compiler.watchFileSystem.watcher.mtimes,
    };

    async.series(hooks.map(function(hook) {
      return async.apply(hook, watchingDelegate);
    }), done);
  }
  else {
    done();
  }
};

module.exports = HappyFakeCompiler;