var assert = require('assert');
var ErrorSerializer = require('./ErrorSerializer');
var activeLoaders = {};
var activeCompiler = null;
var activeCompilation = null;

var HappyRPCHandler = exports;

HappyRPCHandler.registerActiveCompiler = function(compiler) {
  activeCompiler = compiler;
};


HappyRPCHandler.registerActiveCompilation = function(compilation) {
  activeCompilation = compilation;
};

HappyRPCHandler.registerActiveLoader = function(id, instance) {
  activeLoaders[id] = instance;
};

HappyRPCHandler.unregisterActiveLoader = function(id) {
  delete activeLoaders[id];
};

var errors = {};

HappyRPCHandler.execute = function(type, payload, done) {
  var loader;

  if (type === 'resolve') {
    assertCompilerIsActive();

    activeCompiler.resolvers.normal.resolve(payload.context, payload.resource, done);
  }
  else if (type === 'compilation:addError') {
    assertCompilerIsActive();
    var errorString = JSON.stringify(payload);

    if (!(errorString in errors)) {
      errors[errorString] = true;
      activeCompilation.errors.push(ErrorSerializer.deserialize(payload));
    }
  }
  else if (type === 'compilation:addFileDependency') {
    assertCompilerIsActive();

    [].concat(payload.files).forEach(function(file) {
      if (payload.options.unique && activeCompilation.fileDependencies.indexOf(file) > -1) {
        return;
      }

      activeCompilation.fileDependencies.push(file);
    });
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
    else if (type === 'emitFile') {
      loader.emitFile(payload.name, payload.contents, JSON.parse(payload.sourceMap));
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
