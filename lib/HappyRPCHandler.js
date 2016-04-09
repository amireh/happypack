var assert = require('assert');
var activeLoaders = {};
var activeCompiler = null;

var HappyRPCHandler = exports;

HappyRPCHandler.registerActiveCompiler = function(compiler) {
  activeCompiler = compiler;
};

HappyRPCHandler.registerActiveLoader = function(id, instance) {
  activeLoaders[id] = instance;
};

HappyRPCHandler.unregisterActiveLoader = function(id) {
  delete activeLoaders[id];
};

HappyRPCHandler.execute = function(type, payload, done) {
  var loader;

  if (type === 'resolve') {
    assertCompilerIsActive();

    activeCompiler.resolvers.normal.resolve(payload.context, payload.resource, done);
  }
  else { // a loader RPC:
    assertLoaderIsActive(payload.remoteLoaderId);
    loader = activeLoaders[payload.remoteLoaderId];

    if (type === 'emitWarning') {
      loader.emitWarning(payload.message);
    }
    else if (type === 'emitError') {
      loader.emitError(payload.message);
    }
    else if (type === 'addDependency') {
      loader.addDependency(payload.file);
    }
    else if (type === 'addContextDependency') {
      loader.addContextDependency(payload.file);
    }
    else if (type === 'clearDependencies') {
      loader.clearDependencies();
    }
    else {
      assert(false, "Unrecognized RPC '" + type + '"');
    }

  }
};

function assertCompilerIsActive() {
  assert(!!activeCompiler,
    "A compiler RPC was dispatched, but no compiler instance was registered!"
  );
}

function assertLoaderIsActive(id) {
  assert(activeLoaders.hasOwnProperty(id),
    "A loader RPC was dispatched to HappyLoader[" + id + "] but no such loader is active!"
  );
}

module.exports = HappyRPCHandler;
