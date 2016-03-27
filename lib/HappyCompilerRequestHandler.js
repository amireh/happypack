var assert = require('assert');
var activeLoaders = {};

function HappyCompilerRequestHandler(compiler) {
  return function(type, payload, done) {
    assert(!payload.remoteLoaderId || activeLoaders.hasOwnProperty(payload.remoteLoaderId),
      "A loader RPC was dispatched to a non-active loader '" + payload.remoteLoaderId + "'"
    );

    if (type === 'resolve') {
      compiler.resolvers.normal.resolve(payload.context, payload.resource, done);
    }
    else if (type === 'emitWarning') {
      activeLoaders[payload.remoteLoaderId].emitWarning(payload.message);
    }
    else if (type === 'emitError') {
      activeLoaders[payload.remoteLoaderId].emitError(payload.message);
    }
    else if (type === 'addDependency') {
      activeLoaders[payload.remoteLoaderId].addDependency(payload.file);
    }
  };
}

HappyCompilerRequestHandler.registerActiveLoader = function(id, instance) {
  activeLoaders[id] = instance;
};

HappyCompilerRequestHandler.unregisterActiveLoader = function(id) {
  delete activeLoaders[id];
};

module.exports = HappyCompilerRequestHandler;
